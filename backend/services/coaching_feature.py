import fastf1

from db.models import Lap


def sector_deltas(target_lap: Lap, reference_lap: Lap) -> dict:
    return {
        "lap_time_delta": target_lap.lap_time_seconds - reference_lap.lap_time_seconds,
        "sector1_delta": target_lap.sector1_seconds - reference_lap.sector1_seconds,
        "sector2_delta": target_lap.sector2_seconds - reference_lap.sector2_seconds,
        "sector3_delta": target_lap.sector3_seconds - reference_lap.sector3_seconds,
    }


def get_lap_telemetry(session, driver_code: str, lap_number: int):
    lap = session.laps.pick_drivers(driver_code).pick_laps(lap_number)
    return lap.telemetry


def extract_braking_zones(telemetry) -> list[dict]:
    zones = []
    zone_start = None
    for _, row in telemetry.iterrows():
        if row["Brake"] and zone_start is None:
            zone_start = row["Distance"]
        elif not row["Brake"] and zone_start is not None:
            zones.append({"start_distance": zone_start, "end_distance": row["Distance"]})
            zone_start = None
    if zone_start is not None:
        zones.append({"start_distance": zone_start, "end_distance": telemetry.iloc[-1]["Distance"]})
    return zones


def match_braking_zones(target_zones: list[dict], reference_zones: list[dict], tolerance_m: float = 150) -> list[dict]:
    matched = []
    for i, tz in enumerate(target_zones):
        candidates = [
            rz for rz in reference_zones
            if abs(rz["start_distance"] - tz["start_distance"]) < tolerance_m
        ]
        ref = min(candidates, key=lambda rz: abs(rz["start_distance"] - tz["start_distance"])) if candidates else None
        matched.append({
            "zone_index": i,
            "start_distance": round(tz["start_distance"], 1),
            "ref_start_distance": round(ref["start_distance"], 1) if ref else None,
            "delta_m": round(tz["start_distance"] - ref["start_distance"], 1) if ref else None,
        })
    return matched


def build_coaching_summary(deltas: dict, braking_zones: list[dict], corner_features: list[dict] | None = None) -> dict:
    summary = {
        "lap_time_delta_s": round(deltas["lap_time_delta"], 3),
        "sectors": {
            "s1_delta_s": round(deltas["sector1_delta"], 3),
            "s2_delta_s": round(deltas["sector2_delta"], 3),
            "s3_delta_s": round(deltas["sector3_delta"], 3),
        },
        "braking_zones": [
            {"zone": z["zone_index"], "delta_m": z["delta_m"]} for z in braking_zones
        ],
    }
    if corner_features:
        summary["corners"] = corner_features
    return summary


def get_session_and_corners(year: int, round_number: int):
    session = fastf1.get_session(year, round_number, "R")
    session.load()
    corners = session.get_circuit_info().corners  # columns: Number, Letter, Angle, Distance, X, Y
    return session, corners


def _corner_id(corner_row) -> str:
    letter = corner_row.get("Letter")
    letter = letter if isinstance(letter, str) else ""
    return f"{int(corner_row['Number'])}{letter}"


def _apex_sample(telemetry, corner_distance: float, window_m: float = 60):
    mask = (telemetry["Distance"] >= corner_distance - window_m) & \
           (telemetry["Distance"] <= corner_distance + window_m)
    window = telemetry[mask]
    if window.empty:
        return None
    return window.loc[window["Speed"].idxmin()]


def _throttle_reapplication_distance(telemetry, apex_distance: float, threshold: float = 95,
                                     search_forward_m: float = 300):
    forward = telemetry[
        (telemetry["Distance"] >= apex_distance) &
        (telemetry["Distance"] <= apex_distance + search_forward_m)
        ]
    hit = forward[forward["Throttle"] >= threshold]
    return None if hit.empty else float(hit.iloc[0]["Distance"])


def extract_corner_features(target_telemetry, reference_telemetry, corners) -> list[dict]:
    features = []
    for _, corner in corners.iterrows():
        corner_distance = float(corner["Distance"])

        target_apex = _apex_sample(target_telemetry, corner_distance)
        ref_apex = _apex_sample(reference_telemetry, corner_distance)
        if target_apex is None or ref_apex is None:
            continue

        target_throttle_pt = _throttle_reapplication_distance(target_telemetry, target_apex["Distance"])
        ref_throttle_pt = _throttle_reapplication_distance(reference_telemetry, ref_apex["Distance"])

        features.append({
            "corner": _corner_id(corner),
            "apex_speed_delta": round(target_apex["Speed"] - ref_apex["Speed"], 1),
            "throttle_reapplication_delta_m": (
                round(target_throttle_pt - ref_throttle_pt, 1)
                if target_throttle_pt is not None and ref_throttle_pt is not None
                else None
            ),
        })
    return features


def analyze_lap(year: int, round_number: int, driver_code: str, target_lap: Lap, reference_lap: Lap) -> dict:
    session, corners = get_session_and_corners(year, round_number)
    target_telemetry = get_lap_telemetry(session, driver_code, target_lap.lap_number)
    reference_telemetry = get_lap_telemetry(session, driver_code, reference_lap.lap_number)

    deltas = sector_deltas(target_lap, reference_lap)

    target_zones = extract_braking_zones(target_telemetry)
    reference_zones = extract_braking_zones(reference_telemetry)
    braking = match_braking_zones(target_zones, reference_zones)

    corner_features = extract_corner_features(target_telemetry, reference_telemetry, corners)

    return build_coaching_summary(deltas, braking, corner_features)
