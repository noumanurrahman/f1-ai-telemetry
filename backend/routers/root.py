from fastapi import APIRouter

from services.api_service import read_root_payload

router = APIRouter()


@router.get("/")
def read_root():
    return read_root_payload()
