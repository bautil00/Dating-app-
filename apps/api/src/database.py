from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from functools import lru_cache


@lru_cache()
def get_settings():
    from .config import get_settings as _get_settings

    return _get_settings()


@lru_cache()
def get_engine():
    settings = get_settings()
    if not settings.database_url:
        return None
    return create_engine(settings.database_url)


@lru_cache()
def get_session_local():
    engine = get_engine()
    if engine is None:
        return None
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base = declarative_base()


def get_db():
    SessionLocal = get_session_local()
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
