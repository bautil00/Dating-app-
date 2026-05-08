# Backend API Documentation

**Base URL**: `http://localhost:4000/api/v1`

**Auth**: Bearer token in `Authorization` header (JWT from Supabase auth)

---

## Authentication (Supabase Auth)

### Register
```
POST /auth/register
Body: { "email": "string", "password": "string" }
Response: { "id": "string", "email": "string" }
```

### Login
```
POST /auth/login
Body: { "email": "string", "password": "string" }
Response: { "access_token": "string", "token_type": "bearer" }
```

### Get Google OAuth URL
```
GET /auth/google/url
Response: { "url": "string" }
```

### Get Current User
```
GET /auth/me
Header: Authorization: Bearer <token>
Response: { "id": "string", "email": "string" }
```

---

## Profiles

### Create Profile
```
POST /profiles/
Header: Authorization: Bearer <token>
Body: {
  "display_name": "string",
  "bio": "string",
  "age": 25,
  "gender": "string",
  "location": "string",
  "profile_image_url": "string",
  "interests": "string (comma-separated)",
  "personality_type": "string (optional)"
}
Response: ProfileResponse
```

### Get My Profile
```
GET /profiles/me
Header: Authorization: Bearer <token>
Response: ProfileResponse
```

### Update Profile
```
PATCH /profiles/me
Header: Authorization: Bearer <token>
Body: partial Profile fields
Response: ProfileResponse
```

### Get Candidates (ranked by AI)
```
GET /profiles/candidates?limit=10
Header: Authorization: Bearer <token>
Response: ProfileResponse[]
```

### Get Profile by ID
```
GET /profiles/{id}
Response: ProfileResponse
```

---

## Matches

### Create Match
```
POST /matches/
Header: Authorization: Bearer <token>
Body: { "receiver_id": "string (user_id)" }
Response: MatchResponse
```

### Get My Matches
```
GET /matches/
Header: Authorization: Bearer <token>
Response: MatchResponse[]
```

### Accept Match
```
PATCH /matches/{id}/accept
Header: Authorization: Bearer <token>
Response: MatchResponse
```

### Reject Match
```
PATCH /matches/{id}/reject
Header: Authorization: Bearer <token>
Response: MatchResponse
```

---

## Messages

### Send Message
```
POST /messages/
Header: Authorization: Bearer <token>
Body: { "receiver_id": "string", "content": "string" }
Response: MessageResponse
```

### Get All Conversations
```
GET /messages/conversations
Header: Authorization: Bearer <token>
Response: [{ "user_id": "string", "last_message": "string", "unread_count": int }]
```

### Get Conversation with User
```
GET /messages/conversations/{user_id}
Header: Authorization: Bearer <token>
Response: MessageResponse[]
```

### Mark Message Read
```
PATCH /messages/{id}/read
Header: Authorization: Bearer <token>
Response: MessageResponse
```

---

## AI Features (OpenAI API)

### Generate Icebreaker
```
GET /ai/icebreaker/{match_id}
Header: Authorization: Bearer <token>
Response: { "icebreaker": "string" }
```

### Get Compatibility Score
```
GET /ai/compatibility/{profile_id}
Header: Authorization: Bearer <token>
Response: { "profile_id": int, "compatibility_score": float }
```

---

## Data Models

### User
```json
{
  "id": "string (uuid)",
  "email": "string"
}
```

### Profile
```json
{
  "id": int,
  "user_id": "string (uuid)",
  "display_name": "string",
  "bio": "string",
  "age": int,
  "gender": "string",
  "location": "string",
  "profile_image_url": "string",
  "interests": "string",
  "personality_type": "string",
  "compatibility_score": float,
  "created_at": "datetime"
}
```

### Match
```json
{
  "id": int,
  "sender_id": "string (uuid)",
  "receiver_id": "string (uuid)",
  "status": "pending|accepted|rejected",
  "created_at": "datetime"
}
```

### Message
```json
{
  "id": int,
  "sender_id": "string (uuid)",
  "receiver_id": "string (uuid)",
  "content": "string",
  "is_read": bool,
  "created_at": "datetime"
}
```

---

## Deployment

### Local
```bash
cd apps/api
pip install -r requirements.txt
uvicorn src.main:app --reload --port 4000
```

### Production (Vercel)
1. Push code to GitHub
2. Create new Vercel project for backend
3. Connect `apps/api` folder to Vercel
4. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `OPENAI_API_KEY`
5. Deploy

### Environment Variables
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `DEBUG` | Enable debug mode |
