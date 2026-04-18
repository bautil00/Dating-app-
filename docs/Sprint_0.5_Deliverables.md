# BLOWTORCH – Sprint 0.5 Deliverables

**Project:** BLOWTORCH – AI-Powered Dating Platform  
**Sprint:** 0.5 (MVP)  
**Demo Date:** Wednesday, April 29, 2026

---

## High Level Design Summary

High Level Design (HLD) describes the overall system architecture — how major components communicate, what technologies handle each responsibility, and how data flows end-to-end. It is not concerned with implementation details or code; it is a blueprint that lets any stakeholder understand the system at a glance.

BLOWTORCH's HLD consists of four layers:

**Client Layer** — A React + TypeScript + Vite single-page application hosted on Vercel. Users interact with five pages: Register/Login, Profile, Dashboard (swipe browsing), Matches, and Chat. The frontend communicates with the backend exclusively via authenticated HTTPS REST calls.

**Application Layer** — A Python FastAPI backend also hosted on Vercel as a serverless application. It exposes five route groups (`/auth`, `/profiles`, `/matches`, `/messages`, `/ai`) and enforces JWT authentication, CORS, and Pydantic request validation through shared middleware.

**Data Layer** — Supabase (PostgreSQL) stores all persistent data: user accounts, profiles (MBTI, interests, bio), match records with status and compatibility scores, and chat messages. Supabase Auth issues JWT tokens and enforces Row Level Security (RLS) so users can only access their own data.

**External Services** — The OpenAI API is called by the `/ai` route to generate compatibility scores and icebreaker messages. Vercel provides CI/CD: every push to the GitHub main branch automatically redeploys both the frontend and backend.

The full architecture diagram is provided in `HLD_Diagram.html` (open in any browser and screenshot, or print to PDF for submission).

---

## User Stories for Version 0.5

Each story follows the format: **As a [role], I want to [action] so that [benefit].**

---

### Feature 1 – User Registration & Authentication

**US-01**  
As a new user, I want to create an account with my email and password so that I can access the BLOWTORCH platform securely.

**US-02**  
As a returning user, I want to log in with my email and password so that I can resume using the app where I left off.

**US-03**  
As a logged-in user, I want to be automatically logged out after my session expires so that my account stays secure if I forget to log out.

---

### Feature 2 – Profile Creation & Editing

**US-04**  
As a new user, I want to create a profile with my name, age, gender, location, MBTI type, interests, and bio so that other users can learn about me.

**US-05**  
As an existing user, I want to edit any field on my profile so that my information stays current and accurate.

**US-06**  
As an existing user, I want to delete my account and profile so that my data is removed from the platform if I no longer want to use it.

---

### Feature 3 – Candidate Browsing (Swipe Dashboard)

**US-07**  
As a user, I want to browse a ranked list of candidate profiles on my dashboard so that I can find people I might be compatible with.

**US-08**  
As a user, I want to see an AI-generated compatibility score on each candidate card so that I can quickly understand how well we might get along.

**US-09**  
As a user, I want to send a match request to a candidate I like so that I can express interest in connecting.

---

### Feature 4 – Match Workflow (Request / Accept / Reject)

**US-10**  
As a user, I want to see incoming match requests from other users so that I can decide whether to accept or reject them.

**US-11**  
As a user, I want to accept a match request so that both of us are notified and a chat is opened between us.

**US-12**  
As a user, I want to reject a match request so that the requesting user is not shown in my incoming list again.

---

### Feature 5 – Chat Between Matched Users

**US-13**  
As a matched user, I want to send text messages to my match so that we can have a real conversation on the platform.

**US-14**  
As a matched user, I want to view the full message history of my conversation so that I can follow the context of our chat.

---

### Feature 6 – AI Icebreaker Generation

**US-15**  
As a user who just matched with someone, I want the app to suggest AI-generated icebreaker messages tailored to both of our profiles so that I have a helpful conversation starter and can message with confidence.

---

### Feature 7 – AI Compatibility Scoring

**US-16**  
As a user, I want my match candidates to be ranked by an AI-calculated compatibility score based on MBTI type and shared interests so that the most relevant profiles appear first.

---

## Daily Scrum

The Daily Scrum is a short, time-boxed (15-minute) team meeting held each day of the sprint. Each team member answers three questions:

**1. What did I do yesterday?**  
Describe the specific task(s) completed since the last standup (reference the Jira ticket ID when possible).

**2. What will I do today?**  
State the task(s) you plan to work on before the next standup.

**3. Are there any blockers?**  
Identify anything that is preventing or slowing your progress so the team or Scrum Master can help remove it.

**Example standup entry (Thomas – Backend Developer):**

> *Yesterday:* Finished setting up the FastAPI project skeleton and configured Supabase connection (BLOW-12). Wrote the `/auth/register` and `/auth/login` endpoints and tested them with Postman.
>
> *Today:* Implement `/profiles` CRUD endpoints (BLOW-15) and write Pydantic schemas for profile validation.
>
> *Blockers:* None — waiting on Zack to share the expected profile fields so the schema matches the frontend form.

**Scrum Master (Logan)** is responsible for:
- Scheduling and running the daily standup
- Updating Jira ticket statuses based on what teammates report
- Escalating any unresolved blockers to the instructor if they persist beyond 24 hours

---

## Definitions of Done

A user story is **Done** only when **all** criteria in its DoD checklist are met. No partial credit.

---

### DoD – US-01 / US-02 / US-03 (Authentication)

- [ ] `/auth/register` endpoint accepts email + password, creates a Supabase Auth user, and returns a JWT
- [ ] `/auth/login` endpoint validates credentials and returns a valid JWT
- [ ] JWT is stored client-side and attached to all subsequent API requests as a Bearer token
- [ ] Session expiry causes the frontend to redirect to the login page
- [ ] Registration with a duplicate email returns a clear error message (no 500)
- [ ] Passwords are never stored in plaintext (Supabase handles hashing)
- [ ] Manual end-to-end test: register → log out → log back in successfully
- [ ] Jira ticket moved to **Done** and linked GitHub PR is merged to `main`

---

### DoD – US-04 / US-05 / US-06 (Profile CRUD)

- [ ] `/profiles` POST creates a new profile record associated with the authenticated user's ID
- [ ] `/profiles/{id}` GET returns the correct profile for the requesting user
- [ ] `/profiles/{id}` PUT updates any editable field and persists to Supabase
- [ ] `/profiles/{id}` DELETE removes the user's profile (and optionally cascades to matches/messages)
- [ ] All profile fields (name, age, gender, location, MBTI, interests, bio) are validated via Pydantic schemas; invalid input returns a descriptive 422 error
- [ ] Frontend Profile page renders existing data on load and reflects edits after save
- [ ] Row Level Security: a user cannot read or modify another user's profile record
- [ ] Manual end-to-end test: create profile → edit two fields → verify changes persist after page refresh
- [ ] Jira ticket moved to **Done** and linked GitHub PR is merged to `main`

---

### DoD – US-07 / US-08 / US-09 (Candidate Browsing)

- [ ] Dashboard page fetches a list of candidate profiles excluding the current user and already-requested matches
- [ ] Candidates are returned ranked by AI compatibility score (highest first)
- [ ] Each candidate card displays name, MBTI type, interests, bio snippet, and compatibility score
- [ ] Clicking "Like" (or swipe right equivalent) sends a POST to `/matches` creating a pending match request
- [ ] Frontend gracefully handles an empty candidate list (no candidates remaining)
- [ ] Manual end-to-end test: two test accounts are created; User A sees User B on dashboard and can send a request
- [ ] Jira ticket moved to **Done** and linked GitHub PR is merged to `main`

---

### DoD – US-10 / US-11 / US-12 (Match Workflow)

- [ ] `/matches` GET returns all incoming pending match requests for the authenticated user
- [ ] `/matches/{id}/accept` updates match status to `accepted`
- [ ] `/matches/{id}/reject` updates match status to `rejected`
- [ ] Accepting a match opens a chat thread visible to both users
- [ ] Rejected requests no longer appear in either user's incoming list
- [ ] Frontend Matches page displays pending requests with Accept and Reject buttons
- [ ] Manual end-to-end test: User A requests User B → User B sees request → accepts → both can navigate to Chat
- [ ] Jira ticket moved to **Done** and linked GitHub PR is merged to `main`

---

### DoD – US-13 / US-14 (Chat)

- [ ] `/messages` POST saves a new message associated with the correct match ID and sender user ID
- [ ] `/messages?match_id={id}` GET returns the full ordered message history for that match
- [ ] Only users who are part of the match can send or read messages (enforced by RLS or backend check)
- [ ] Frontend Chat page displays message history on load, sorted oldest to newest
- [ ] Sending a new message appends it to the view without requiring a full page reload
- [ ] Manual end-to-end test: two matched users exchange at least 3 messages; history persists after refresh
- [ ] Jira ticket moved to **Done** and linked GitHub PR is merged to `main`

---

### DoD – US-15 (AI Icebreaker Generation)

- [ ] `/ai/icebreaker` endpoint accepts two user profile payloads and returns 3 icebreaker message suggestions
- [ ] Prompts sent to the OpenAI API include relevant profile fields (MBTI, interests, bio) from both users
- [ ] Icebreaker suggestions are displayed in the Chat or Matches page UI after a match is accepted
- [ ] API errors from OpenAI (rate limit, timeout) are caught and return a graceful fallback response, not a 500
- [ ] OpenAI API key is stored as an environment variable and never hardcoded in source
- [ ] Manual end-to-end test: accept a match → icebreaker suggestions appear → one is used to pre-fill the chat input
- [ ] Jira ticket moved to **Done** and linked GitHub PR is merged to `main`

---

### DoD – US-16 (AI Compatibility Scoring)

- [ ] `/ai/compatibility` endpoint accepts two user profile payloads and returns a numeric score (0–100)
- [ ] Scoring logic considers at minimum: MBTI compatibility and number of shared interests
- [ ] Scores are stored in the `matches` table alongside the match record
- [ ] Dashboard displays the score on each candidate card, fetched from the API
- [ ] API errors from OpenAI are caught; a default score (e.g., 50) is used as a fallback so the app remains usable
- [ ] Manual end-to-end test: two profiles with identical interests score higher than two profiles with no overlap
- [ ] Jira ticket moved to **Done** and linked GitHub PR is merged to `main`

---

*All items above must also pass a code review by at least one other team member via a GitHub Pull Request before merging to `main`.*
