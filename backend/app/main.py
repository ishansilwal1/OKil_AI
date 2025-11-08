from typing import Union

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .api.v1.legal_chat import router as legal_chat_router
from .api.v1.chat_history import router as chat_history_router
from . import models
from .db import init_db

app = FastAPI(
    title="OKIL AI Legal Assistant API",
    description="AI-powered legal question answering system for Nepali law",
    version="1.0.0"
)

# Allow the frontend dev server to access the API during development.
# In production, narrow this to specific origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Debug middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"🔍 Request: {request.method} {request.url}")
    print(f"🔍 Headers: {dict(request.headers)}")
    response = await call_next(request)
    print(f"🔍 Response status: {response.status_code}")
    return response


@app.get("/")
def read_root():
    return {
        "message": "OKIL AI Legal Assistant API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "auth": "/auth",
            "legal_chat": "/api/v1/legal"
        }
    }


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(legal_chat_router, prefix="/api/v1/legal", tags=["Legal Chat"])
app.include_router(chat_history_router, prefix="/api/v1/chat", tags=["Chat History"])


@app.on_event("startup")
def on_startup():
    # Ensure DB tables are created (models must be imported before this runs)
    init_db()