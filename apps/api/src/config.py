import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "BLOWTORCH"
    
    supabase_url: str = "https://meoeszlzwmjreelusizu.supabase.co"
    supabase_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lb2Vzemx6d21qcmVlbHVzaXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTA3ODYsImV4cCI6MjA5MjAyNjc4Nn0.fc_KhHltSzCMhH46TH9kZA-uIezhQztUqrMvXifs7go"
    
    openrouter_api_key: str = "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"
    openai_api_key: str | None = None

    model_config = SettingsConfigDict(extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    return Settings()