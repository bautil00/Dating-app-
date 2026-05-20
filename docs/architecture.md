# Architecture

## System Overview
React web app → FastAPI API → Supabase PostgreSQL
                       ↓
                OpenRouter AI API

## Services
- **web**: React frontend (Vite)
- **api**: FastAPI backend (Python)
- **database/auth**: Supabase PostgreSQL and Supabase Auth
- **ai**: OpenRouter compatibility scoring and icebreaker generation, with database fallback scoring

For the demo flow and teammate explanation guide, see [`demo_guide.md`](demo_guide.md).
