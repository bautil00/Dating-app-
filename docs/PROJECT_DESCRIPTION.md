# BLOWTORCH - AI-Powered Dating Platform

## Project Description

### What does your project do?

BLOWTORCH is an AI-powered dating web application that helps users find meaningful connections through intelligent matchmaking. Unlike traditional dating apps that rely solely on basic filters, BLOWTORCH leverages personality typing (MBTI) and interest-based matching to pair compatible users. The application provides AI-generated icebreaker suggestions to help users start conversations with confidence.

**Is it solving a problem?** Yes. Many dating app users struggle with:
- Generic matches based only on location/age filters
- Fear of initiating conversations ("blank message anxiety")
- Difficulty expressing their personality in a profile
- Swiping fatigue from endless browsing

BLOWTORCH addresses these by:
1. Matching users based on personality compatibility and shared interests
2. Providing AI-generated icebreakers tailored to both users
3. Offering a streamlined, distraction-free interface

**Is it fun?** Yes. The swipe-based interface is familiar and engaging, while the AI features add novelty and practical value.

**Is it a product attempt?** Yes. BLOWTORCH is designed as a minimum viable product (MVP) that could scale into a real dating platform.

---

## Languages & Technologies

### What language(s) will you use?

- **Backend**: Python with FastAPI
- **Frontend**: JavaScript with React + TypeScript
- **Database**: PostgreSQL

### What platform(s) will it be available on?

- Web browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for desktop and mobile browsers

---

## Team Learning Goals

Each team member states one thing they hope to learn:

| Team Member | Role | Learning Goal |
|-------------|------|---------------|
| Austin Strong | Data Specialist | Learn how to build and maintain a data pipeline for user analytics and matchmaking metrics |
| Thomas Suen | Backend Developer | Gain experience building a production-ready FastAPI backend with Supabase authentication, database integration, and Vercel deployment |
| Zack Ning | UI/UX Designer | Learn modern React patterns and CSS techniques for building responsive, accessible web interfaces |
| Jad Masri | AI/ML Engineer | Learn to integrate third-party AI APIs (OpenAI, etc.) into a dating platform for compatibility scoring and icebreaker generation |
| Logan Bautista | Project Manager | Learn how to coordinate a team using Agile/Scrum methodologies, manage a Jira board, and deliver a product on schedule |

---

## Technologies We Hope to Learn

- **Supabase**: As our backend-as-a-service solution for PostgreSQL database, authentication, and real-time subscriptions. We have experience with Firebase, AWS, and Vercel, but want to explore Supabase for its open-source model and tight PostgreSQL integration.

---

## Project Base Setup

### GitHub Repository
**Link**: https://github.com/bautil00/Dating-app-.git

### Jira Board
**Link**: https://zackning7.atlassian.net/jira/software/projects/BLOW/boards/67

Team members to be added:
- Austin Strong (Data Specialist)
- Thomas Suen (Backend Developer)
- Zack Ning (UI/UX Designer)
- Jad Masri (AI/ML Engineer)
- Logan Bautista (Project Manager)

---

## Data Sources, APIs, and Tools

### External AI API (OpenAI or Similar Provider)

**Provider**: OpenAI API (or alternative provider such as Anthropic, Google Gemini)

**API Documentation**: https://platform.openai.com/docs

**Description**: Third-party AI API provides:
1. **Compatibility Scoring**: Analyze user profiles and calculate compatibility scores based on interests, personality, and other factors
2. **Icebreaker Generation**: Generate personalized conversation starters tailored to both users' profiles
3. **Profile Enhancement**: Suggest profile improvements based on user data

**What data we send**:
- User profile data (interests, bio, personality type)
- Match candidate profile data
- Context about the match (shared interests, etc.)

**What data we receive**:
- Compatibility scores
- Generated icebreaker messages
- Profile enhancement suggestions

---

### PostgreSQL (Supabase)

**Purpose**: User accounts, profile data, matches, and messages

**Description**: Internal PostgreSQL database storing:
- User accounts with JWT authentication
- Profile data (interests, MBTI type, demographics)
- Match requests and statuses
- Chat messages between matched users

---

### External Tools

| Tool | Purpose | Documentation |
|------|---------|---------------|
| Vercel | Frontend and backend deployment | https://vercel.com/docs |
| Supabase | PostgreSQL database, auth, real-time | https://supabase.com/docs |
| OpenAI API | AI-powered matching and icebreakers | https://platform.openai.com/docs |

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   React    │────▶│   FastAPI  │────▶│  PostgreSQL  │
│  Frontend  │     │   Backend  │     │   (Supabase) │
└─────────────┘     └─────┬─────┘     └──────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  OpenAI API │
                   │ (or other)  │
                   └─────────────┘
```

---

## Features (MVP Scope)

### In Progress (v0.5)
- [x] User registration and Supabase authentication (Email/Password & Google OAuth)
- [ ] Profile creation and editing
- [ ] Swipe-based candidate browsing
- [ ] Match request/accept/reject workflow
- [ ] Real-time chat between matched users
- [ ] Compatibility scoring (via external AI API)
- [ ] Icebreaker suggestions (via external AI API)

### Planned (v1.0)
- [ ] Profile image upload
- [ ] Real-time notifications
- [ ] User blocking/reporting

### Future (v2.0)
- [ ] Video chat integration
- [ ] Premium subscription features
- [ ] Advanced AI personality analysis

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.5 | Current | MVP development in progress |
