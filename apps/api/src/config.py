from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "BLOWTORCH"

    supabase_url: str = "https://example.supabase.co"
    supabase_key: str = "replace-with-supabase-anon-key"

    openrouter_api_key: str = ""
    model_config = SettingsConfigDict(extra="ignore")

    @field_validator("supabase_url", "supabase_key", "openrouter_api_key")
    @classmethod
    def strip_secret_whitespace(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value


@lru_cache()
def get_settings() -> Settings:
    return Settings()
