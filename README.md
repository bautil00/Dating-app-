# BLOWTORCH

AI-powered dating platform

## Project Description

BLOWTORCH is an AI-powered dating web application that helps users find meaningful connections through intelligent matchmaking. Unlike traditional dating apps that rely solely on basic filters, BLOWTORCH leverages personality typing (MBTI) and interest-based matching to pair compatible users.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Python + FastAPI + PostgreSQL
- **AI**: OpenAI API (or similar provider) for compatibility scoring and icebreaker generation
- **DevOps**: Docker

## Team

| Name | Role | Learning Goal |
|------|------|---------------|
| Austin Strong | Data Specialist | Learn how to build a data pipeline for user analytics and matchmaking metrics |
| Thomas Suen | Backend Developer | Gain experience with FastAPI, authentication, database integration, and deployment |
| Zack Ning | UI/UX Designer | Learn modern React patterns and responsive CSS |
| Jad Masri | AI/ML Engineer | Learn to integrate third-party AI APIs (OpenAI, etc.) into a dating platform |
| Logan Bautista | Project Manager | Learn Agile/Scrum coordination, Jira management, and on-schedule delivery |

## Technologies We Hope to Learn
- **Supabase**: PostgreSQL database, auth, real-time subscriptions (open-source alternative to Firebase/AWS)
- **OpenAI API**: AI-powered compatibility scoring and icebreaker generation

## Repository
https://github.com/bautil00/Dating-app-.git

## Jira Board
https://zackning7.atlassian.net/jira/software/projects/BLOW/boards/67

## Quick Start
```bash
docker-compose up
```
- Web app: http://localhost:3000
- API docs: http://localhost:4000/docs

## Data Sources & APIs

### External AI API (OpenAI or Similar)
- Compatibility scoring based on user profiles
- AI-generated icebreaker messages
- Profile enhancement suggestions

### PostgreSQL (Supabase)
- User accounts and authentication
- Profile data
- Matches and messages

## Architecture
```
React → FastAPI → PostgreSQL
             ↓
       OpenAI API
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
- [ ] Video chat
- [ ] Premium subscriptions
