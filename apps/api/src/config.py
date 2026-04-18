from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "BLOWTORCH"

    class Config:
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()