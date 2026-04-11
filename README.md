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
- Web app: http://localhost:3000
- API docs: http://localhost:4000/docs

## Pages
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Swipe candidates, view matches
- `/profile` - Create/edit profile
- `/matches` - View pending/accepted matches
- `/chat/:userId` - Chat with matches

## API Docs
Swagger UI: `http://localhost:4000/docs`
ReDoc: `http://localhost:4000/redoc`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login (returns JWT)
- `GET /api/v1/auth/me` - Get current user

### Profiles
- `POST /api/v1/profiles/` - Create profile
- `GET /api/v1/profiles/me` - Get my profile
- `PATCH /api/v1/profiles/me` - Update profile
- `GET /api/v1/profiles/candidates` - Ranked candidates
- `GET /api/v1/profiles/{id}` - Get profile

### Matches
- `POST /api/v1/matches/` - Create match
- `GET /api/v1/matches/` - Get matches
- `PATCH /api/v1/matches/{id}/accept` - Accept
- `PATCH /api/v1/matches/{id}/reject` - Reject

### Messages
- `POST /api/v1/messages/` - Send
- `GET /api/v1/messages/conversations` - All conversations
- `GET /api/v1/messages/conversations/{uid}` - One conversation
- `PATCH /api/v1/messages/{id}/read` - Mark read

### AI Features
- `GET /api/v1/ai/icebreaker/{match_id}` - Generate icebreaker
- `GET /api/v1/ai/compatibility/{profile_id}` - Compatibility score

## Architecture
Web (React) → FastAPI → PostgreSQL
                  ↓
            AI: TF-IDF interest matching + MBTI personality compatibility
