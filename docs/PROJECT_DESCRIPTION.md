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
- **AI/ML**: Python (scikit-learn for TF-IDF matching)
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
| Thomas Suen | Backend Developer | Gain experience building a production-ready FastAPI backend with authentication, database integration, and deployment |
| Zack Ning | UI/UX Designer | Learn modern React patterns and CSS techniques for building responsive, accessible web interfaces |
| Jad Masri | AI/ML Engineer | Apply machine learning concepts (TF-IDF, personality compatibility matrices) to a real-world matchmaking system |
| Logan Bautista | Project Manager | Learn how to coordinate a team using Agile/Scrum methodologies, manage a Jira board, and deliver a product on schedule |

---

## Technologies We Hope to Learn

- **Supabase**: As our backend-as-a-service solution for PostgreSQL database, authentication, and real-time subscriptions. We have experience with Firebase, AWS, and Vercel, but want to explore Supabase for its open-source model and tight PostgreSQL integration.

---

## Project Base Setup

### GitHub Repository
**Link**: https://github.com/bautil00/Dating-app-.git

### Jira Board
**Link**: (To be added when Jira board is created and all team members are added)

Team members to be added:
- Austin Strong (Data Specialist)
- Thomas Suen (Backend Developer)
- Zack Ning (UI/UX Designer)
- Jad Masri (AI/ML Engineer)
- Logan Bautista (Project Manager)

---

## Data Sources, APIs, and Tools

### Primary Data Source: User-Generated Profile Data

**Source**: Internal PostgreSQL database storing user profiles

**Description**: Users create profiles containing:
- Demographics (age, gender, location)
- Profile image URL
- Biography text
- Interests (comma-separated list)
- MBTI personality type (optional)

**Data Received**: Structured profile data used for:
- TF-IDF vectorization of interests
- Personality compatibility scoring
- Candidate ranking algorithm

---

### AI/ML Services (Internal)

**Provider**: Custom Python service using scikit-learn

**API Documentation**: Built into FastAPI at `/docs`

**Description**: Internal AI service provides:
1. **Interest Matching**: TF-IDF vectorization of user interests with cosine similarity scoring
2. **Personality Compatibility**: MBTI personality type matching using predefined compatibility matrices
3. **Icebreaker Generation**: Random selection from curated icebreaker templates based on user profiles

**What data we receive**:
- Compatibility scores (0.0 to 1.0)
- Ranked candidate lists
- Generated icebreaker messages

---

### External Tools

| Tool | Purpose | Documentation |
|------|---------|---------------|
| Docker | Containerization for local dev and deployment | https://docs.docker.com |
| Railway | Production deployment platform | https://docs.railway.app |
| Supabase | PostgreSQL database, auth, real-time | https://supabase.com/docs |
| scikit-learn | ML for TF-IDF matching and scoring | https://scikit-learn.org/stable/documentation.html |

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
                   │  AI Service │
                   │ (scikit)    │
                   └─────────────┘
```

---

## Features (MVP Scope)

### Completed (v0.5)
- User registration and JWT authentication
- Profile creation and editing
- Swipe-based candidate browsing
- Match request/accept/reject workflow
- Real-time chat between matched users
- AI compatibility scoring
- AI icebreaker suggestions

### Planned (v1.0)
- Profile image upload
- Real-time notifications
- User blocking/reporting

### Future (v2.0)
- Advanced AI personality analysis
- Video chat integration
- Premium subscription features

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1 | Current | MVP with core matching and chat |
