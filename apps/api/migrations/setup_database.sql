-- BLOWTORCH - Match your existing schema
-- Run in Supabase SQL Editor

-- ==========================================
-- Map to your existing UserData table
-- ==========================================
-- Your table already has: Name, Age, Location, Height, interests, Job, etc.
-- We'll use these fields for matching

-- Make sure UserData has is_complete for triggering matching
ALTER TABLE "UserData" ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE "UserData" ADD COLUMN IF NOT EXISTS compatibility_score REAL DEFAULT 0.0;
ALTER TABLE "UserData" ADD COLUMN IF NOT EXISTS latitude REAL;
ALTER TABLE "UserData" ADD COLUMN IF NOT EXISTS longitude REAL;
ALTER TABLE "UserData" ADD COLUMN IF NOT EXISTS max_distance_km INTEGER DEFAULT 50;
ALTER TABLE "UserData" ADD COLUMN IF NOT EXISTS seeking_gender TEXT DEFAULT 'everyone';

-- Index for complete profiles
CREATE INDEX IF NOT EXISTS userdata_complete_idx ON "UserData"(is_complete) WHERE is_complete = TRUE;

-- ==========================================
-- MATCHES TABLE (already exists)
-- ==========================================
-- Already has: sender_id, receiver_id, status, compatibility_score

-- ==========================================
-- MESSAGES TABLE (already exists)
-- ==========================================
-- Already has: sender_id, receiver_id, content, is_read

-- ==========================================
-- Insert sample seed data
-- ==========================================
INSERT INTO "UserData" (Name, Age, Location, Age, interest_1, interest_2, interest_3, Job, gender, "is_complete", compatibility_score)
VALUES 
('Alex', 26, 'Seattle', 47.6062, 'coding', 'hiking', 'music', 'developer', 'male', TRUE, 85.5),
('Jordan', 24, 'Portland', 45.5152, 'art', 'coffee', 'travel', 'artist', 'female', TRUE, 72.3),
('Casey', 28, 'San Francisco', 37.7749, 'gym', 'cooking', 'gaming', 'trainer', 'male', TRUE, 68.1),
('Taylor', 25, 'Los Angeles', 34.0522, 'music', 'producing', 'art', 'producer', 'female', TRUE, 78.9),
('Morgan', 27, 'Seattle', 47.6062, 'reading', 'travel', 'cooking', 'writer', 'non-binary', TRUE, 91.2)
ON CONFLICT DO NOTHING;

SELECT 'Schema updated!' as result;