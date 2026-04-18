import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "BLOWTORCH"
    
    supabase_url: str = "https://meoeszlzwmjreelusizu.supabase.co"
    supabase_key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lb2Vzemx6d21qcmVlbHVzaXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTA3ODYsImV4cCI6MjA5MjAyNjc4Nn0.fc_KhHltSzCMhH46TH9kZA-uIezhQztUqrMvXifs7go"
    
    openrouter_api_key: str = os.environ.get("OPENROUTER_API_KEY", "")

    class Config:
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()