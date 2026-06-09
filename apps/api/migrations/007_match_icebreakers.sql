-- Persist AI-generated conversation starter suggestions per mutual match pair.
CREATE TABLE IF NOT EXISTS match_icebreakers (
    id SERIAL PRIMARY KEY,
    user_a_id TEXT NOT NULL,
    user_b_id TEXT NOT NULL,
    suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    source TEXT NOT NULL DEFAULT 'fallback',
    model_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT match_icebreakers_sorted_pair CHECK (user_a_id < user_b_id),
    CONSTRAINT match_icebreakers_unique_pair UNIQUE (user_a_id, user_b_id)
);

ALTER TABLE match_icebreakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Icebreakers are viewable by participants"
    ON match_icebreakers FOR SELECT USING (
        auth.uid()::text = user_a_id OR auth.uid()::text = user_b_id
    );

CREATE POLICY "Participants can create icebreakers"
    ON match_icebreakers FOR INSERT WITH CHECK (
        auth.uid()::text = user_a_id OR auth.uid()::text = user_b_id
    );

CREATE POLICY "Participants can update icebreakers"
    ON match_icebreakers FOR UPDATE USING (
        auth.uid()::text = user_a_id OR auth.uid()::text = user_b_id
    );
