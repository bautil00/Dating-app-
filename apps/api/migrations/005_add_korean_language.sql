-- Allow the frontend Languages selector to save Korean.
ALTER TYPE public.language_type ADD VALUE IF NOT EXISTS 'korean';
