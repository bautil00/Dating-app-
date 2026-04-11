# BLOWTORCH

AI-powered dating platform

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Python + FastAPI + PostgreSQL
- **AI**: Python (TF-IDF + personality-based matching)
- **DevOps**: Docker

## Team
- **Austin Strong** - Data Specialist
- **Thomas Suen** - Backend Developer
- **Zack Ning** - UI/UX Designer
- **Jad Masri** - AI/ML Engineer
- **Logan Bautista** - Project Manager

## Quick Start
```bash
docker-compose up
```

## API Docs
- Swagger UI: `http://localhost:4000/docs`
- ReDoc: `http://localhost:4000/redoc`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (returns JWT)
- `GET /api/v1/auth/me` - Get current user

### Profiles
- `POST /api/v1/profiles/` - Create profile
- `GET /api/v1/profiles/me` - Get my profile
- `PATCH /api/v1/profiles/me` - Update my profile
- `GET /api/v1/profiles/candidates` - Get ranked candidate matches
- `GET /api/v1/profiles/{id}` - Get profile by ID

### Matches
- `POST /api/v1/matches/` - Create match
- `GET /api/v1/matches/` - Get my matches
- `PATCH /api/v1/matches/{id}/accept` - Accept match
- `PATCH /api/v1/matches/{id}/reject` - Reject match

### Messages
- `POST /api/v1/messages/` - Send message
- `GET /api/v1/messages/conversations` - Get all conversations
- `GET /api/v1/messages/conversations/{user_id}` - Get conversation with user
- `PATCH /api/v1/messages/{id}/read` - Mark message as read

### AI Features
- `GET /api/v1/ai/icebreaker/{match_id}` - Generate icebreaker message
- `GET /api/v1/ai/compatibility/{profile_id}` - Get compatibility score

## Architecture
- Web app → FastAPI backend → PostgreSQL
- AI features: personality matching, icebreaker generation, candidate ranking
