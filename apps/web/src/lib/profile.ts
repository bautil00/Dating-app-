export type ProfileLike = Record<string, unknown> | null | undefined;

export function profileUserId(profile: ProfileLike) {
  return String(profile?.user_id || profile?.id || '');
}

export function profileName(profile: ProfileLike, fallback = 'New User') {
  return String(
    profile?.Name || profile?.name || profile?.display_name || profile?.email || fallback,
  );
}

export function profileAge(profile: ProfileLike) {
  const age = profile?.Age || profile?.age;
  return age == null || age === '' ? '' : String(age);
}

export function profileLocation(profile: ProfileLike) {
  return String(profile?.Location || profile?.location || '');
}

export function profileInterests(profile: ProfileLike): string[] {
  const interests = profile?.interests;
  if (Array.isArray(interests)) return interests.map(String).filter(Boolean);
  if (typeof interests === 'string') {
    return interests
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function profileBio(profile: ProfileLike) {
  return String(profile?.bio || profile?.Bio || '');
}

export function profileImage(profile: ProfileLike) {
  return String(
    profile?.profile_image_url ||
      profile?.avatar_url ||
      profile?.photo_url ||
      profile?.image_url ||
      '',
  );
}

export function profileCompatibility(profile: ProfileLike) {
  const score = profile?.compatibility_score || profile?.match_score || profile?.score;
  const value = typeof score === 'number' ? score : Number(score);
  if (!Number.isFinite(value)) return null;
  return value > 1 ? Math.round(value) : Math.round(value * 100);
}

export function shortUserId(userId: string) {
  return userId ? userId.slice(0, 8) : 'unknown';
}
