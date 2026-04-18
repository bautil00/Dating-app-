-- Run this in Supabase SQL Editor to create tables for BLOWTORCH

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    age INTEGER,
    gender TEXT,
    location TEXT,
    interests TEXT,
    personality_type TEXT,
    compatibility_score REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create matches table  
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 5. Create policies (for authenticated access)
-- For now, allow full access for testing (disable RLS if needed)
-- Run: ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 6. Insert test data
INSERT INTO profiles (user_id, display_name, bio, age, gender, location, interests, personality_type)
VALUES 
  ('user-1', 'Alex', 'Love hiking and tech', 26, 'male', 'Seattle', 'coding,hiking,music', 'INTJ'),
  ('user-2', 'Jordan', 'Artist and coffee lover', 24, 'female', 'Portland', 'art,coffee,travel', 'ENFP'),
  ('user-3', 'Casey', 'Fitness enthusiast', 28, 'male', 'San Francisco', 'gym,cooking,gaming', 'ISTP');

-- Success message
SELECT 'Tables created successfully!' as result;