from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
import httpx

router = APIRouter(prefix="/auth", tags=["Authentication"])

SUPABASE_URL = "https://meoeszlzwmjreelusizu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lb2Vzemx6d21qcmVlbHVzaXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTA3ODYsImV4cCI6MjA5MjAyNjc4Nn0.fc_KhHltSzCMhH46TH9kZA-uIezhQztUqrMvXifs7go"


@router.post("/login")
def login(user: dict):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {"apikey": SUPABASE_KEY, "Content-Type": "application/json"}
    
    try:
        client = httpx.Client(timeout=30.0)
        response = client.post(url, json=user, headers=headers)
        client.close()
        
        if response.status_code >= 400:
            return JSONResponse(
                status_code=401,
                content={"error": "login_failed", "details": response.text[:200], "key": SUPABASE_KEY}
            )
        
        data = response.json()
        return {"access_token": data.get("access_token", ""), "token_type": "bearer"}
    except Exception as e:
        return JSONResponse(
            status_code=401,
            content={"error": str(e)[:200]}
        )


@router.get("/test")
def test():
    return {"url": SUPABASE_URL, "key": SUPABASE_KEY}