from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Prefer environment variable but fall back to the provided connection string
DATABASE_URL = os.environ.get('DATABASE_URL') or 'postgresql://postgres:animesh@localhost:5432/okil_ai_db'

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables based on SQLAlchemy models. Call this after models are imported."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        # Don't raise at import time; let the app startup logs show the error.
        pass
