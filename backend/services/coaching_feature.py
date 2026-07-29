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

# TODO: implement corner features extraction
