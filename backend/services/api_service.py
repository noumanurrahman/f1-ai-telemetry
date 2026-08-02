import json
from typing import Any

import fastf1
import pandas as pd
from fastapi import HTTPException

from db.models import AICoachingCache, Lap, Race, RaceEntry
from services.coaching_feature import analyze_lap
from services.openai_coaching import generate_narrative


def clean(value: Any) -> Any:
    return None if pd.isna(value) else value


def serialize_race(race: Race, include_year: bool = True) -> dict[str, Any]:
    payload = {
        "eventName": race.event_name,
        "officialName": race.official_name,
        "country": race.country,
        "location": race.location,
        "raceDate": race.race_date,
        "totalLaps": race.total_laps,
        "roundNumber": race.round_number,
    }
    if include_year:
        payload["year"] = race.year
    return payload


def serialize_driver(driver: RaceEntry) -> dict[str, Any]:
    return {
        "firstName": driver.first_name,
        "lastName": driver.last_name,
        "fullName": driver.full_name,
        "driverNumber": driver.driver_number,
        "driverCode": driver.driver_code,
        "teamName": driver.team_name,
        "headshotUrl": driver.headshot_url,
        "points": driver.points,
        "status": driver.status,
        "finishPosition": driver.finish_position,
        "gridPosition": driver.grid_position,
        "classifiedPosition": driver.classified_position,
    }


def serialize_lap(lap: Lap) -> dict[str, Any]:
    return {
        "lapNumber": lap.lap_number,
        "lapTime": lap.lap_time_seconds,
        "sector1Time": lap.sector1_seconds,
        "sector2Time": lap.sector2_seconds,
        "sector3Time": lap.sector3_seconds,
        "topSpeed": lap.top_speed,
        "compound": lap.compound,
        "tyreLife": lap.tyre_life,
        "freshTyre": lap.fresh_tyre,
        "stint": lap.stint,
        "position": lap.position,
        "isPitLap": lap.is_pit_lap,
        "isAccurate": lap.is_accurate,
        "isPersonalBest": lap.is_personal_best,
        "deleted": lap.deleted,
        "deltaToFastest": lap.delta_to_fastest,
    }


def get_race(year: int, round_number: int) -> Race | None:
    return Race.get_or_none((Race.round_number == round_number) & (Race.year == year))


def get_entry(race: Race, driver_code: str) -> RaceEntry | None:
    return RaceEntry.get_or_none((RaceEntry.race == race) & (RaceEntry.driver_code == driver_code))


def read_root_payload() -> dict[str, str]:
    return {"Hello": "World"}


def read_races_payload(year: int | None) -> list[dict[str, Any]]:
    query = Race.select()
    if year is not None:
        query = query.where(Race.year == year)
    races: list[Race] = query.execute()
    return [serialize_race(race) for race in races]


def read_seasons_payload() -> list[int]:
    years: list[int] = []
    for race in read_races_payload(None):
        if race["year"] not in years:
            years.append(race["year"])
    return years


def read_race_payload(year: int, round_number: int) -> dict[str, Any]:
    race = get_race(year, round_number)
    if not race:
        return {"error": "Race not found"}
    return serialize_race(race, include_year=False)


def read_drivers_payload(year: int, round_number: int) -> list[dict[str, Any]] | dict[str, str]:
    race = get_race(year, round_number)
    if not race:
        return {"error": "Race not found"}
    drivers: list[RaceEntry] = RaceEntry.select().where(RaceEntry.race == race).execute()
    return [serialize_driver(driver) for driver in drivers]


def read_driver_payload(year: int, round_number: int, driver_code: str) -> dict[str, Any]:
    race = get_race(year, round_number)
    if not race:
        return {"error": "Race not found"}
    driver = get_entry(race, driver_code)
    if not driver:
        return {"error": "Driver not found"}
    return serialize_driver(driver)


def read_laps_payload(year: int, round_number: int, driver_code: str) -> list[dict[str, Any]] | dict[str, str]:
    race = get_race(year, round_number)
    if not race:
        return {"error": "Race not found"}
    entry = get_entry(race, driver_code)
    if not entry:
        return {"error": "Driver not found"}
    laps: list[Lap] = Lap.select().where(Lap.entry == entry).execute()
    return [serialize_lap(lap) for lap in laps]


def read_laps_by_number_payload(year: int, round_number: int, lap_number: int) -> list[dict[str, Any]] | dict[str, str]:
    race = get_race(year, round_number)
    if not race:
        return {"error": "Race not found"}

    entries: list[RaceEntry] = RaceEntry.select().where(RaceEntry.race == race).execute()
    laps: list[dict[str, Any]] = []
    for entry in entries:
        lap: Lap | None = (
            Lap.select()
            .where((Lap.entry == entry) & (Lap.lap_number == lap_number))
            .first()
        )
        if lap is None:
            continue
        lap_payload = serialize_lap(lap)
        lap_payload["driver"] = {
            "code": entry.driver_code,
            "number": entry.driver_number,
            "fullName": entry.full_name,
            "teamName": entry.team_name,
            "headshotUrl": entry.headshot_url,
        }
        laps.append(lap_payload)
    return laps


def read_lap_telemetry_payload(year: int, round_number: int, driver_code: str, lap_number: int) -> list[dict[str, Any]]:
    session = fastf1.get_session(year, round_number, "R")
    session.load()
    lap = session.laps.pick_drivers(driver_code).pick_laps(lap_number)
    telemetry = lap.telemetry
    telemetry_json = []
    for _, info in telemetry.iterrows():
        telemetry_json.append({
            "date": clean(info["Date"]),
            "sessionTime": clean(info["SessionTime"]),
            "speed": clean(info["Speed"]),
            "rpm": clean(info["RPM"]),
            "gear": clean(info["nGear"]),
            "throttle": clean(info["Throttle"]),
            "brake": clean(info["Brake"]),
            "drs": clean(info["DRS"]),
            "driverAhead": clean(info["DriverAhead"]),
            "distanceToDriverAhead": clean(info["DistanceToDriverAhead"]),
            "time": clean(info["Time"]),
            "distance": clean(info["Distance"]),
            "relativeDistance": clean(info["RelativeDistance"]),
            "x": clean(info["X"]),
            "y": clean(info["Y"]),
            "z": clean(info["Z"]),
        })
    return telemetry_json


def read_race_results_payload(year: int, round_number: int) -> list[dict[str, Any]]:
    race = fastf1.get_session(year, round_number, "R")
    race.load()
    result = race.results
    result_json = []
    for _, info in result.iterrows():
        result_json.append({
            "driverName": info["FullName"],
            "driverCode": info["Abbreviation"],
            "driverNumber": info["DriverNumber"],
            "driverId": info["DriverId"],
            "teamName": info["TeamName"],
            "teamColor": info["TeamColor"],
            "countryCode": info["CountryCode"],
            "position": info["Position"],
            "gridPosition": info["GridPosition"],
            "classifiedPosition": info["ClassifiedPosition"],
            "status": info["Status"],
            "points": info["Points"],
        })
    return result_json


def create_lap_analysis_payload(year: int, round_number: int, driver_code: str, lap_number: int) -> dict[str, Any]:
    race = get_race(year, round_number)
    if not race:
        return {"error": "Race not found"}
    entry = get_entry(race, driver_code)
    if not entry:
        return {"error": "Driver not found"}

    lap = Lap.get_or_none((Lap.entry == entry) & (Lap.lap_number == lap_number))
    if lap is None:
        raise HTTPException(status_code=404, detail="Lap not found")

    cached = AICoachingCache.get_or_none(AICoachingCache.lap == lap)
    if cached is not None:
        return {
            "lapNumber": lap.lap_number,
            "featureSummary": json.loads(cached.feature_summary_json),
            "narrative": cached.narrative,
            "cached": True,
        }

    reference_lap = (
        Lap.select()
        .where((Lap.entry == entry) & (Lap.is_personal_best == True))
        .first()
    )
    if reference_lap is None:
        raise HTTPException(status_code=422, detail="No personal-best lap found to compare against")
    if reference_lap.lap_number == lap.lap_number:
        raise HTTPException(
            status_code=422,
            detail="This lap is already this driver's fastest lap this session — nothing to compare it to",
        )

    try:
        summary = analyze_lap(
            year=race.year,
            round_number=race.round_number,
            driver_code=entry.driver_code,
            target_lap=lap,
            reference_lap=reference_lap,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Telemetry analysis failed: {exc}")

    try:
        narrative = generate_narrative(summary)
    except Exception as exc:
        return {
            "lapNumber": lap.lap_number,
            "featureSummary": summary,
            "narrative": None,
            "error": f"Narrative generation failed: {exc}",
            "cached": False,
        }

    AICoachingCache.create(
        lap=lap,
        feature_summary_json=json.dumps(summary),
        openai_model="gpt-5.4-mini",
        narrative=narrative,
    )

    return {
        "lapNumber": lap.lap_number,
        "featureSummary": summary,
        "narrative": narrative,
        "cached": False,
    }
