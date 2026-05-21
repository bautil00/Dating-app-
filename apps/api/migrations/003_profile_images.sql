-- Store onboarding/profile photo previews for Discover cards.
ALTER TABLE "user_data" ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE "UserData" ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
