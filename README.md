# BLOWTORCH

AI-powered dating platform

## Project Description

BLOWTORCH is an AI-powered dating web application that helps users find meaningful connections through intelligent matchmaking. Unlike traditional dating apps that rely solely on basic filters, BLOWTORCH leverages personality typing (MBTI) and interest-based matching to pair compatible users.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Python + FastAPI + PostgreSQL
- **AI**: Python (scikit-learn: TF-IDF + MBTI personality matching)
- **DevOps**: Docker

## Team

| Name | Role | Learning Goal |
|------|------|---------------|
| Austin Strong | Data Specialist | Learn how to build a data pipeline for user analytics and matchmaking metrics |
| Thomas Suen | Backend Developer | Gain experience with FastAPI, authentication, database integration, and deployment |
| Zack Ning | UI/UX Designer | Learn modern React patterns and responsive CSS |
| Jad Masri | AI/ML Engineer | Apply ML concepts (TF-IDF, personality compatibility) to a real-world system |
| Logan Bautista | Project Manager | Learn Agile/Scrum coordination, Jira management, and on-schedule delivery |

## Technologies We Hope to Learn
- **Supabase**: PostgreSQL database, auth, real-time subscriptions (open-source alternative to Firebase/AWS)

## Repository
https://github.com/bautil00/Dating-app-.git

## Jira Board
(To be added)

## Quick Start
```bash
docker-compose up
```
- Web app: http://localhost:3000
- API docs: http://localhost:4000/docs

## Data Sources & APIs

### Internal AI Service
- **scikit-learn** TF-IDF vectorization for interest matching
- MBTI personality compatibility matrices
- Curated icebreaker templates

### PostgreSQL (Supabase)
- User accounts and authentication
- Profile data
- Matches and messages

## Architecture
```
React → FastAPI → PostgreSQL
            ↓
      AI Service (scikit-learn)
```

## Features

### Completed
- [x] User registration + JWT auth
- [x] Profile CRUD
- [x] Candidate ranking (AI-powered)
- [x] Match workflow (create/accept/reject)
- [x] Chat between matches
- [x] AI icebreaker generation
- [x] AI compatibility scoring

### Planned
- [ ] Profile image upload
- [ ] Real-time notifications
- [ ] User blocking/reporting

### Future
- [ ] Advanced AI personality analysis
- [ ] Video chat
- [ ] Premium subscriptions
