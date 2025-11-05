from typing import Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .interactions import router as interactions_router
from . import models
from .db import init_db

app = FastAPI()

# Allow the frontend dev server to access the API during development.
# In production, narrow this to specific origins.
# During development, allow all origins to avoid CORS issues when opening the
# frontend via file:// or different hosts/ports. Consider restricting this in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


app.include_router(auth_router, prefix="/auth")
app.include_router(interactions_router)


@app.on_event("startup")
def on_startup():
    # Ensure DB tables are created (models must be imported before this runs)
    init_db()