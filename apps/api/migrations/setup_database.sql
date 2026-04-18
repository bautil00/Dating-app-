-- BLOWTORCH Database Schema v0.5 - Complete
-- Run in Supabase SQL Editor: https://meoeszlzwmjreelusizu.supabase.co/dashboard

-- ==========================================
-- 1. DROP EXISTING TABLES
-- ==========================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ==========================================
-- 2. PROFILES TABLE
-- ==========================================
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    age INTEGER,
    
    -- Location
    location TEXT,
    latitude REAL,
    longitude REAL,
    max_distance_km INTEGER DEFAULT 50,
    
    -- Gender & Preferences  
    gender TEXT NOT NULL,
    seeking_gender TEXT NOT NULL DEFAULT 'everyone',
    
    -- Personality & Interests
    personality_type TEXT,
    interests TEXT,
    profile_image_url TEXT,
    
    -- Compatibility (calculated by AI)
    compatibility_score REAL DEFAULT 0.0,
    
    -- Triggers matching when complete
    is_complete BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX profiles_location ON profiles(location);
CREATE INDEX profiles_gender ON profiles(gender);
CREATE INDEX profiles_complete ON profiles(is_complete) WHERE is_complete = TRUE;

-- ==========================================
-- 3. MATCHES TABLE
-- ==========================================
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    compatibility_score REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

CREATE INDEX matches_sender ON matches(sender_id);
CREATE INDEX matches_receiver ON matches(receiver_id);

-- ==========================================
-- 4. MESSAGES TABLE
-- ==========================================
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX messages_sender ON messages(sender_id);
CREATE INDEX messages_receiver ON messages(receiver_id);

-- ==========================================
-- 5. ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 6. SEED DATA (Seattle/Portland/SF area)
-- ==========================================
INSERT INTO profiles 
(user_id, display_name, bio, age, location, latitude, longitude, gender, seeking_gender, interests, personality_type, is_complete, compatibility_score)
VALUES 
('seed-1', 'Alex', 'Tech developer who loves hiking', 26, 'Seattle', 47.6062, -122.3321, 'male', 'female', 'coding,hiking,music', 'INTJ', TRUE, 85.5),
('seed-2', 'Jordan', 'Artist and coffee enthusiast', 24, 'Portland', 45.5152, -122.6784, 'female', 'male', 'art,coffee,travel', 'ENFP', TRUE, 72.3),
('seed-3', 'Casey', 'Fitness passionate', 28, 'San Francisco', 37.7749, -122.4194, 'male', 'female', 'gym,cooking,gaming', 'ISTP', TRUE, 68.1),
('seed-4', 'Taylor', 'Music producer and creative', 25, 'Los Angeles', 34.0522, -118.2437, 'female', 'both', 'music,producing,art', 'INFP', TRUE, 78.9),
('seed-5', 'Morgan', 'Bookworm and world traveler', 27, 'Seattle', 47.6062, -122.3321, 'non-binary', 'everyone', 'reading,travel,cooking', 'INTP', TRUE, 91.2);

SELECT 
    'Database ready!' as status,
    (SELECT COUNT(*) FROM profiles) as profiles,
    (SELECT COUNT(*) FROM matches) as matches,
    (SELECT COUNT(*) FROM messages) as messages;