# Backend API Documentation

**Base URL**: `http://localhost:4000/api/v1`

**Auth**: Bearer token in `Authorization` header (JWT from `/auth/login`)

---

## Authentication

### Register
```
POST /auth/register
Body: { "email": "string", "password": "string" }
Response: UserResponse
```

### Login
```
POST /auth/login
FormData: username=email&password=password
Response: { "access_token": "string", "token_type": "bearer" }
```

### Get Current User
```
GET /auth/me
Response: UserResponse
```

---

## Profiles

### Create Profile
```
POST /profiles/
Body: {
  "display_name": "string",
  "bio": "string",
  "age": 25,
  "gender": "string",
  "location": "string",
  "profile_image_url": "string",
  "interests": "string (comma-separated)"
}
Response: ProfileResponse
```

### Get My Profile
```
GET /profiles/me
Response: ProfileResponse
```

### Update Profile
```
PATCH /profiles/me
Body: partial Profile fields
Response: ProfileResponse
```

### Get Candidates (ranked)
```
GET /profiles/candidates?limit=10
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
Body: { "receiver_id": int }
Response: MatchResponse
```

### Get My Matches
```
GET /matches/
Response: MatchResponse[]
```

### Accept Match
```
PATCH /matches/{id}/accept
Response: MatchResponse
```

### Reject Match
```
PATCH /matches/{id}/reject
Response: MatchResponse
```

---

## Messages

### Send Message
```
POST /messages/
Body: { "receiver_id": int, "content": "string" }
Response: MessageResponse
```

### Get All Conversations
```
GET /messages/conversations
Response: [{ "user_id": int, "last_message": "string", "unread_count": int }]
```

### Get Conversation with User
```
GET /messages/conversations/{user_id}
Response: MessageResponse[]
```

### Mark Message Read
```
PATCH /messages/{id}/read
Response: MessageResponse
```

---

## AI Features

### Generate Icebreaker
```
GET /ai/icebreaker/{match_id}
Response: { "icebreaker": "string" }
```

### Get Compatibility Score
```
GET /ai/compatibility/{profile_id}
Response: { "profile_id": int, "compatibility_score": float }
```

---

## Data Models

### User
```json
{
  "id": int,
  "email": "string",
  "is_active": bool,
  "created_at": "datetime"
}
```

### Profile
```json
{
  "id": int,
  "user_id": int,
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
  "sender_id": int,
  "receiver_id": int,
  "status": "pending|accepted|rejected",
  "created_at": "datetime"
}
```

### Message
```json
{
  "id": int,
  "sender_id": int,
  "receiver_id": int,
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

### Docker
```bash
docker-compose up --build
```

### Production ( Railway / Render / Fly.io )
1. Push code to GitHub
2. Connect repo to hosting platform
3. Set environment variables:
   - `DATABASE_URL=postgresql://user:pass@host:5432/blowtorch`
   - `SECRET_KEY=<random-256-bit-key>`
   - `DEBUG=false`
4. Deploy from `apps/api/Dockerfile`

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | postgresql://user:pass@localhost:5432/blowtorch |
| `SECRET_KEY` | JWT signing key | change-me-in-production |
| `DEBUG` | Enable debug mode | true |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | 30 |
