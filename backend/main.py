import os
from os import environ

import fastf1
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import analysis_router, races_router, root_router

load_dotenv()

origins = [
    "http://localhost:5173",
    environ["FRONTEND_URL"]
]

CACHE_PATH = os.getenv(
    "CACHE_PATH",
    "./data/fastf1-cache"
)
fastf1.Cache.enable_cache(CACHE_PATH)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(root_router)
app.include_router(races_router)
app.include_router(analysis_router)
