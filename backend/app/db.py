from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Prefer environment variable but fall back to the provided connection string
DATABASE_URL = os.environ.get('DATABASE_URL') or 'postgresql://postgres:ishan@localhost:5432/okil_ai_db'

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
        _run_lightweight_migrations()
    except Exception:
        # Don't raise at import time; let the app startup logs show the error.
        pass


def _run_lightweight_migrations():
    """Very small, safe migrations for dev environments.
    - Add missing columns required by updated models.
    This is NOT a replacement for Alembic, but helps avoid crashes when the
    schema evolves during development.
    """
    try:
        with engine.begin() as conn:
            # Ensure queries.lawyer_id exists (nullable int, FK to users.id)
            result = conn.execute(
                text(
                    """
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = :t
                      AND column_name = :c
                    """
                ),
                {"t": "queries", "c": "lawyer_id"},
            )
            if result.fetchone() is None:
                # Add column if missing
                conn.execute(text("ALTER TABLE queries ADD COLUMN lawyer_id INTEGER NULL"))
                # Try to add FK constraint (ignore if it already exists)
                try:
                    conn.execute(text(
                        "ALTER TABLE ONLY queries \n"
                        "ADD CONSTRAINT fk_queries_lawyer_id_users_id \n"
                        "FOREIGN KEY (lawyer_id) REFERENCES users(id)"
                    ))
                except Exception:
                    # Ignore if the constraint already exists
                    pass

            # Ensure users.expertise exists (nullable varchar)
            result2 = conn.execute(
                text(
                    """
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = :t
                      AND column_name = :c
                    """
                ),
                {"t": "users", "c": "expertise"},
            )
            if result2.fetchone() is None:
                conn.execute(text("ALTER TABLE users ADD COLUMN expertise VARCHAR NULL"))
            
              # Ensure users.is_verified exists
            result3 = conn.execute(
                text(
                    """
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema()
                      AND table_name = :t
                      AND column_name = :c
                    """
                ),
                {"t": "users", "c": "is_verified"},
            )
            if result3.fetchone() is None:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
    except Exception as e:
        # best-effort only; print to help diagnose in dev
        print("[init_db] Lightweight migration skipped due to:", repr(e))
