# BLOWTORCH Demo & Product Guide

Use this guide when the team needs to explain the product, walk a test user through it, or answer basic infrastructure questions during a demo.

## One-Sentence Pitch

BLOWTORCH is a dating app that lets users create a profile, discover AI-ranked candidates, create mutual sparks, and message matches with optional AI-generated icebreakers.

## Production Links

- Web app: <https://web-two-beta-72.vercel.app>
- API health check: <https://api-lemon-psi-31.vercel.app/health>
- GitHub repository: <https://github.com/bautil00/Dating-app->
- CI/CD guide: [`docs/ci_cd_pipeline.md`](ci_cd_pipeline.md)

## Product Mental Model

The user flow is:

1. A user creates an account or signs in.
2. The user completes their profile.
3. The Discover page fetches candidate profiles.
4. The backend scores candidates with OpenRouter LLM compatibility scoring.
5. If the LLM is unavailable or too slow, the backend falls back to the Supabase database compatibility score.
6. The user presses Ignite to like another user.
7. If both users like each other, they become a Spark.
8. Sparks can message each other.
9. A matched user can request an AI icebreaker for a conversation starter.

## Infrastructure Mental Model

The app has three main runtime pieces:

```text
Browser
  React + TypeScript + Vite frontend on Vercel
    |
    | HTTPS /api/v1 requests
    v
FastAPI backend on Vercel
    |
    | Supabase REST/Auth
    v
Supabase PostgreSQL
    |
    | optional scoring/generation calls
    v
OpenRouter LLM API
```

### Frontend

- Code: [`apps/web`](../apps/web)
- Framework: React + TypeScript + Vite
- Hosted on Vercel at the web URL above.
- Important routes:
  - `/login`: sign in
  - `/register`: create account
  - `/discover`: candidate browsing
  - `/sparks`: mutual matches and pending match requests
  - `/messages`: conversation list and chat panel
  - `/chat/:userId`: direct chat with one user
  - `/profile`: profile editor

### Backend

- Code: [`apps/api/src/main.py`](../apps/api/src/main.py)
- Framework: FastAPI
- Hosted on Vercel at the API URL above.
- API prefix: `/api/v1`
- Main route groups:
  - `/auth`: Supabase email/password and Google OAuth URL helper
  - `/profiles`: profile CRUD and candidate discovery
  - `/matches`: like, accept, reject, list matches
  - `/messages`: send messages and load conversations
  - `/ai`: icebreakers and compatibility score endpoints

### Database

- Provider: Supabase PostgreSQL
- Auth: Supabase Auth issues JWT access tokens.
- Main tables:
  - `user_data`: profile details, interests, preferences, availability fields
  - `matches`: sender, receiver, status, compatibility score
  - `messages`: sender, receiver, content, read status
- Database fallback scoring uses the `compatibility_score` RPC function when LLM scoring is not available.

### AI

- Provider: OpenRouter
- Compatibility scoring model: `liquid/lfm-2.5-1.2b-instruct:free`
- The LLM receives profile fields such as age, interests, job, gender, education, relationship, and availability.
- Candidate discovery has a short timeout and database fallback, so the app should not stay stuck on "Finding your matches..." if OpenRouter is slow.
- Icebreaker generation also has a fallback response so the demo can keep moving.

## Demo Prep Checklist

Do this before handing the app to a test user:

1. Open the web app in a fresh browser or private window.
2. Confirm the API health check returns `{"status":"healthy"}`.
3. Have at least two complete test users ready.
4. Use fake profile data only. Do not ask test users for sensitive personal information.
5. If there are no candidates on Discover, create a second profile with `seeking_gender` set to `everyone`.
6. Keep one teammate ready to log in as the second user if you want to demonstrate a mutual Spark.

Recommended demo data:

| Field | User A | User B |
| --- | --- | --- |
| Display name | Alex Demo | Taylor Demo |
| Age | 25 | 26 |
| Gender | Female | Male |
| Interested in | everyone | everyone |
| Interest | Music | Music |
| Job | Programmer | Programmer |
| Education | Bachelors | Bachelors |
| Relationship | single | single |
| Living status | Alone | Alone |

## Guided Test User Script

Use this when someone is trying the product for the first time.

### 1. Start At Login Or Register

Say:

> This is BLOWTORCH. Start by creating an account or signing in. The account is backed by Supabase Auth, so the backend receives a real JWT token after login.

Ask the tester to:

1. Go to <https://web-two-beta-72.vercel.app>.
2. Click Create one if they need a new account.
3. Use a fake email and a test password.
4. Sign in.

Expected result:

- They land on Discover if they already have a complete profile.
- They are asked to complete their profile if profile data is missing.

### 2. Complete The Profile

Say:

> The profile is the data source for matching. The backend saves these fields in Supabase and uses them for LLM scoring and database fallback scoring.

Ask the tester to fill:

- Display name
- Age
- Gender
- Interest
- Job
- Education
- Relationship
- Living status
- Interested in
- Max distance

Then click Save Profile.

Expected result:

- The app returns to Discover.
- The profile is saved through `POST /api/v1/profiles/`.

### 3. Use Discover

Say:

> Discover is where the product ranks possible matches. The frontend asks the API for candidates, the API scores them, and the card shows the compatibility signal.

Ask the tester to:

1. Look at the current candidate card.
2. Read the AI Match Insight panel.
3. Click Pass to skip.
4. Click Ignite to like a candidate.

Expected result:

- Pass removes the current card locally.
- Ignite sends `POST /api/v1/matches/` with the candidate's `user_id`.
- If the other person already liked this user, it becomes a mutual Spark.

### 4. Create A Mutual Spark

For a reliable demo:

1. User A clicks Ignite on User B.
2. A teammate logs in as User B.
3. User B clicks Ignite on User A, or accepts the pending request from Sparks if it appears there.

Expected result:

- Both users now see each other in Sparks.
- The match row in Supabase changes to an accepted/matched state.

### 5. Open Sparks

Say:

> Sparks are mutual matches. This is where users can see people who liked them back and start a chat.

Ask the tester to:

1. Open Sparks.
2. Find the mutual match.
3. Click Message.

Expected result:

- The app opens a chat route for the matched user's `user_id`.

### 6. Send Messages

Say:

> Messaging is backed by the API and Supabase. The conversation list is built from the messages table.

Ask the tester to:

1. Type a short message.
2. Send it.
3. Open Messages to see the conversation list.

Expected result:

- The message is saved through `POST /api/v1/messages/`.
- The conversation appears in `/messages`.

### 7. Try An AI Icebreaker

Say:

> The lightbulb button asks the backend for an AI-generated icebreaker. It only works for users who are matched.

Ask the tester to:

1. Open a chat with a Spark.
2. Click the lightbulb button.
3. Use the suggested text if it appears.

Expected result:

- The frontend calls `/api/v1/ai/icebreaker/{target_user_id}`.
- The backend uses OpenRouter if available.
- If AI fails, the backend returns a fallback icebreaker.

## What Each Team Member Can Explain

### Product Explanation

- The app is trying to reduce shallow swiping.
- Profile data is used to produce compatibility scores.
- Discover is the top of the funnel.
- Sparks are mutual matches.
- Messages are the post-match conversation flow.
- AI helps with ranking and icebreakers, but the app still has fallbacks.

### Frontend Explanation

- React/Vite app deployed on Vercel.
- Routes map directly to user workflows.
- The frontend stores the Supabase access token in `localStorage`.
- API requests attach the token as `Authorization: Bearer <token>`.
- The UI uses the orange/black BLOWTORCH design system.

### Backend Explanation

- FastAPI receives authenticated requests.
- It validates the JWT against Supabase Auth.
- It reads and writes Supabase tables through Supabase REST.
- It computes compatibility through OpenRouter first, then database fallback.
- It exposes clean REST endpoints for profiles, matches, messages, and AI.

### Database Explanation

- Supabase Auth owns account identity.
- `user_data` owns dating profile fields.
- `matches` owns like/match state.
- `messages` owns chat history.
- Availability and schedule fields exist in the backend/database, but the current frontend does not expose full schedule controls yet.

### Deployment Explanation

- The one-touch script is [`scripts/deploy_prod.sh`](../scripts/deploy_prod.sh).
- It pulls `origin/main`, runs checks/tests/smoke tests, then deploys through the Vercel REST API.
- It does not depend on the local Vercel CLI account.
- Production deploy success ends with `Pipeline completed successfully`.

## Common Demo Problems

### "Finding your matches..." takes too long

What it means:

- Discover is waiting for profile/candidate/match API responses.

What to say:

> Candidate scoring calls OpenRouter with a short timeout and falls back to database scoring, so this should clear in a few seconds. If it does not, refresh once and check API health.

Quick checks:

- Open <https://api-lemon-psi-31.vercel.app/health>.
- Make sure the user has a complete profile.
- Make sure at least one other complete profile exists.

### No Candidates

Likely causes:

- There is only one complete profile in the database.
- Gender preference filters exclude all other profiles.
- The current user has not saved a profile.

Fix:

- Create another complete test user.
- Set `Interested in` to `everyone` for the demo.

### Sparks Is Empty

Likely cause:

- One user liked another user, but the like is not mutual yet.

Fix:

- Log in as the other user and like back, or accept the pending request.

### Icebreaker Fails

Likely causes:

- Users are not matched.
- AI provider is unavailable.

Fix:

- Confirm they are mutual Sparks.
- Continue the demo with manual messaging; fallback is designed to keep the flow usable.

### Login Returns To Login

Likely causes:

- Invalid password.
- Token was cleared or expired.
- Browser has stale local state.

Fix:

- Refresh and log in again.
- Use a fresh private window for demo accounts.

## Instructor/Test User Demo Path

Fastest successful path:

1. Register or log in as User A.
2. Complete User A profile.
3. Register or log in as User B in another browser/private window.
4. Complete User B profile.
5. User A opens Discover and clicks Ignite on User B.
6. User B opens Discover or Sparks and likes/accepts User A.
7. User A opens Sparks and clicks Message.
8. User A sends a message.
9. User B opens Messages and sees the conversation.
10. In a chat, click the lightbulb for an AI icebreaker.

## Current Limitations To State Honestly

- Profile image upload is not implemented yet; cards use generated initials/gradients.
- Full frontend schedule/timetable controls are not exposed yet, although backend/database fields for availability exist.
- Blocking/hiding from the UI is not a full moderation system.
- Google OAuth requires provider configuration in Supabase/Google Cloud.
- This is a class MVP, not a production dating service with moderation, safety review, or real identity verification.
