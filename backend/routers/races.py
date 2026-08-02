from fastapi import APIRouter

from services.api_service import (
    read_driver_payload,
    read_drivers_payload,
    read_lap_telemetry_payload,
    read_laps_by_number_payload,
    read_laps_payload,
    read_race_payload,
    read_race_results_payload,
    read_races_payload,
    read_seasons_payload,
)

router = APIRouter()


@router.get("/seasons")
def read_seasons():
    return read_seasons_payload()


@router.get("/races/{year}")
def read_races(year: int):
    return read_races_payload(year)


@router.get("/races/{year}/{round_number}")
def read_race(year: int, round_number: int):
    return read_race_payload(year, round_number)


@router.get("/races/{year}/{round_number}/drivers")
def read_drivers(year: int, round_number: int):
    return read_drivers_payload(year, round_number)


@router.get("/races/{year}/{round_number}/{driver_code}")
def read_driver(year: int, round_number: int, driver_code: str):
    return read_driver_payload(year, round_number, driver_code)


@router.get("/races/{year}/{round_number}/{driver_code}/laps")
def read_laps(year: int, round_number: int, driver_code: str):
    return read_laps_payload(year, round_number, driver_code)


@router.get("/races/{year}/{round_number}/laps/{lap_number}")
def read_laps_by_number(year: int, round_number: int, lap_number: int):
    return read_laps_by_number_payload(year, round_number, lap_number)


@router.get("/races/{year}/{round_number}/{driver_code}/laps/{lap_number}/telemetry")
def read_lap_telemetry(year: int, round_number: int, driver_code: str, lap_number: int):
    return read_lap_telemetry_payload(year, round_number, driver_code, lap_number)


@router.get("/races/{year}/{round_number}/result")
def read_race_results(year: int, round_number: int):
    return read_race_results_payload(year, round_number)
