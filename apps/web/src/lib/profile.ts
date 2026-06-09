export type ProfileLike = Record<string, unknown> | null | undefined;
export type CompatibilityFactor = {
  label: string;
  detail: string;
  points?: number;
};

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
  const value = profile?.location_name || profile?.Location || profile?.location || '';
  const text = String(value || '').trim();
  return Number.isFinite(Number(text)) ? '' : text;
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

export function profileCompatibilityReason(profile: ProfileLike) {
  const reason = profile?.compatibility_reason || profile?.match_reason || '';
  return String(reason || '').trim();
}

function normalizeFactor(value: unknown): CompatibilityFactor | null {
  if (!value || typeof value !== 'object') return null;
  const factor = value as Record<string, unknown>;
  const label = String(factor.label || '').trim();
  const detail = String(factor.detail || '').trim();
  const pointsValue = Number(factor.points);
  if (!label || !detail) return null;
  return {
    label,
    detail,
    ...(Number.isFinite(pointsValue) ? { points: Math.round(pointsValue) } : {}),
  };
}

export function profileCompatibilityFactors(profile: ProfileLike): CompatibilityFactor[] {
  const raw = profile?.compatibility_factors || profile?.match_factors;
  if (Array.isArray(raw)) {
    return raw.map(normalizeFactor).filter((factor): factor is CompatibilityFactor => !!factor);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeFactor)
          .filter((factor): factor is CompatibilityFactor => !!factor);
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function shortUserId(userId: string) {
  return userId ? userId.slice(0, 8) : 'unknown';
}
