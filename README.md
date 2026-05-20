# BLOWTORCH

AI-powered dating platform

## Project Description

BLOWTORCH is an AI-powered dating web application that helps users find meaningful connections through intelligent matchmaking. Unlike traditional dating apps that rely solely on basic filters, BLOWTORCH leverages personality typing (MBTI) and interest-based matching to pair compatible users.

## Tech Stack
- **Frontend**: React + TypeScript + Vite (Vercel)
- **Backend**: Python + FastAPI (Vercel)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter API for compatibility scoring and icebreaker generation, with database scoring fallback

## Team

| Name | Role | Learning Goal |
|------|------|---------------|
| Austin Strong | Data Specialist | Learn how to build a data pipeline for user analytics and matchmaking metrics |
| Thomas Suen | Backend Developer | Gain experience with FastAPI, Supabase integration, and Vercel deployment |
| Zack Ning | UI/UX Designer | Learn modern React patterns and responsive CSS |
| Jad Masri | AI/ML Engineer | Learn to integrate third-party AI APIs (OpenAI, etc.) into a dating platform |
| Logan Bautista | Project Manager | Learn Agile/Scrum coordination, Jira management, and on-schedule delivery |

## Technologies We Hope to Learn
- **Supabase**: PostgreSQL database, auth, real-time subscriptions (open-source alternative to Firebase/AWS)
- **OpenAI API**: AI-powered compatibility scoring and icebreaker generation
- **Vercel**: Frontend and backend deployment

## Repository
https://github.com/bautil00/Dating-app-.git

## Jira Board
https://zackning7.atlassian.net/jira/software/projects/BLOW/boards/67

## Quick Start

### Frontend
```bash
cd apps/web
npm install
npm run dev
```

### Backend
```bash
cd apps/api
pip install -r requirements.txt
uvicorn src.main:app --reload --port 4000
```

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
OPENROUTER_API_KEY=your-openrouter-key
```

## Deployment (Vercel)

### Frontend
1. Push to GitHub
2. Connect repo to Vercel
3. Deploy automatically

### Backend
1. Create new Vercel project for backend
2. Connect `apps/api` folder
3. Set environment variables in Vercel dashboard
4. Deploy

## CI/CD Pipeline Guide

The hand-built production pipeline is documented in [`docs/ci_cd_pipeline.md`](docs/ci_cd_pipeline.md).

## Demo & Product Guide

Use [`docs/demo_guide.md`](docs/demo_guide.md) to understand the product, explain the infrastructure, and guide a test user through registration, profile setup, Discover, Sparks, Messages, and AI icebreakers.

Submission links:
- GitHub repository for PR and code standards review: https://github.com/bautil00/Dating-app-
- CI/CD pipeline guide: [`docs/ci_cd_pipeline.md`](docs/ci_cd_pipeline.md)

One-touch command from the repository root:

```bash
./scripts/deploy_prod.sh
```

## Data Sources & APIs

### External AI API (OpenRouter)
- Compatibility scoring based on user profiles
- AI-generated icebreaker messages

### PostgreSQL (Supabase)
- User accounts and authentication (Email/Password & Google OAuth)
- Profile data
- Matches and messages

**Note on Google OAuth Setup**: 
To use Google login, you must configure your Google Cloud Console OAuth 2.0 Client credentials to include the following Authorized Redirect URI:
`https://<your-supabase-project>.supabase.co/auth/v1/callback`

## Architecture
```
React (Vercel) → FastAPI (Vercel) → Supabase PostgreSQL
                           ↓
                    OpenRouter API
```

## Features

### In Progress (v0.5)
- [x] User registration + Supabase auth (Email/Password & Google OAuth)
- [x] Profile CRUD
- [x] Candidate ranking (AI-powered with database fallback)
- [x] Match workflow (create/accept/reject)
- [x] Chat between matches
- [x] AI icebreaker generation
- [x] AI compatibility scoring
- [x] Profile preferences, multi-interest selection, and schedule availability controls

### Planned (v1.0)
- [ ] Profile image upload
- [ ] Real-time notifications
- [ ] User blocking/reporting
