-- Persist user-facing compatibility score explanations on match rows.
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS compatibility_reason TEXT,
ADD COLUMN IF NOT EXISTS compatibility_factors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS compatibility_source TEXT;

UPDATE public.matches
SET compatibility_factors = '[]'::jsonb
WHERE compatibility_factors IS NULL;
