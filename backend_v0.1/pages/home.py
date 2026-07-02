import logging
from fastapi import APIRouter, status,Depends
from fastapi.responses import JSONResponse


home_router = APIRouter(prefix="/api/v1", tags=["Home"])
logger = logging.getLogger("Monicare.home")

@home_router.get("/home", status_code=status.HTTP_200_OK)
async def home(payload):
    pass    