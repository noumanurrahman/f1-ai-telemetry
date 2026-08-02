from fastapi import APIRouter

from services.api_service import create_lap_analysis_payload

router = APIRouter()


@router.post("/analysis/{year}/{round_number}/{driver_code}/{lap_number}")
def create_lap_analysis(year: int, round_number: int, driver_code: str, lap_number: int):
    return create_lap_analysis_payload(year, round_number, driver_code, lap_number)
