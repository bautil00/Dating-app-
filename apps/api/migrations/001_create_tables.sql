-- Create profiles table
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
    seeking_gender TEXT DEFAULT 'everyone',
    max_distance_km INTEGER DEFAULT 50,
    mbti TEXT,
    relationship TEXT,
    pets BOOLEAN,
    kids BOOLEAN,
    drives BOOLEAN,
    zodiac TEXT,
    education TEXT,
    languages TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE USING (auth.uid()::text = user_id);

-- Create policies for matches
CREATE POLICY "Matches are viewable by participants" 
    ON matches FOR SELECT USING (
        auth.uid()::text = sender_id OR auth.uid()::text = receiver_id
    );

CREATE POLICY "Users can create matches" 
    ON matches FOR INSERT WITH CHECK (
        auth.uid()::text = sender_id
    );

CREATE POLICY "Users can update their matches" 
    ON matches FOR UPDATE USING (
        auth.uid()::text = receiver_id
    );

-- Create policies for messages
CREATE POLICY "Messages are viewable by participants" 
    ON messages FOR SELECT USING (
        auth.uid()::text = sender_id OR auth.uid()::text = receiver_id
    );

CREATE POLICY "Users can send messages" 
    ON messages FOR INSERT WITH CHECK (
        auth.uid()::text = sender_id
    );

CREATE POLICY "Users can update read status" 
    ON messages FOR UPDATE USING (
        auth.uid()::text = receiver_id
    );
