from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, profiles, matches, messages, ai
from .database import engine, Base
from .config import get_settings

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="AI-powered dating platform API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(matches.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "BLOWTORCH API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
