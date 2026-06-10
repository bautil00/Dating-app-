import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flame,
  Heart,
  MessageCircle,
  Users,
  X,
} from 'lucide-react';
import { authService, matchService, profileService } from '../services/api';
import Navbar from '../components/Navbar';
import {
  profileAge,
  profileBio,
  profileCompatibility,
  profileCompatibilityFactors,
  profileCompatibilityReason,
  profileImage,
  profileInterests,
  profileLocation,
  profileName,
  profileUserId,
} from '../lib/profile';

type MatchRecord = {
  id?: number;
  sender_id?: string;
  receiver_id?: string;
  status?: string;
};

type SwipeAction = 'pass' | 'like';

const PROFILE_EDITOR_NUDGE_KEY = 'blowtorch.profileEditorNudge';

function dedupeProfiles(profiles: Record<string, unknown>[]) {
  const seen = new Set<string>();
  return profiles.filter((profile) => {
    const id = profileUserId(profile);
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function scoreLabel(score: number) {
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Good';
  if (score >= 25) return 'Mixed';
  return 'Low';
}

export default function Dashboard() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [candidates, setCandidates] = useState<Record<string, unknown>[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeAction>('pass');
  const [pendingAction, setPendingAction] = useState<SwipeAction | null>(null);
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, profileRes] = await Promise.all([
        authService.getMe(),
        profileService.getMe().catch(() => ({ data: null })),
      ]);
      setUser(userRes.data);
      setProfile(profileRes.data);

      if (profileRes.data && profileRes.data.is_complete !== false) {
        const [candidatesRes, matchesRes] = await Promise.all([
          profileService.getCandidates(20),
          matchService.getAll().catch(() => ({ data: [] })),
        ]);
        setCandidates(dedupeProfiles(candidatesRes.data || []));
        setMatches(matchesRes.data || []);
        setShowProfileNudge(localStorage.getItem(PROFILE_EDITOR_NUDGE_KEY) === '1');
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      console.error('Failed to load discovery data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const current = candidates[0] || null;

  const sparkCount = useMemo(() => {
    const userId = String(user?.id || '');
    return new Set(
      matches
        .filter((match) => match.status === 'accepted' || match.status === 'matched')
        .map((match) =>
          String(match.sender_id) === userId ? String(match.receiver_id) : String(match.sender_id),
        ),
    ).size;
  }, [matches, user]);

  const dismissProfileNudge = () => {
    localStorage.removeItem(PROFILE_EDITOR_NUDGE_KEY);
    setShowProfileNudge(false);
  };

  const openProfileEditor = () => {
    dismissProfileNudge();
    navigate('/profile');
  };

  const advance = (direction: SwipeAction, candidateId?: string) => {
    setExitDirection(direction);
    setExiting(true);
    window.setTimeout(() => {
      setCandidates((prev) => {
        if (!candidateId) return prev.slice(1);
        const next = prev.filter((candidate) => profileUserId(candidate) !== candidateId);
        return next.length === prev.length ? prev.slice(1) : next;
      });
      setExiting(false);
    }, 180);
  };

  const handleLike = async () => {
    if (!current || pendingAction) return;
    const candidateId = profileUserId(current);
    if (!candidateId) return;

    setPendingAction('like');
    try {
      const result = await matchService.create(candidateId);
      setMatches((prev) => [result.data, ...prev.filter((match) => match.id !== result.data.id)]);
      setToast(result.data?.matched ? "It's a spark. You can message them now." : 'Ignite sent.');
      window.setTimeout(() => setToast(''), 2400);
      advance('like', candidateId);
    } catch (err) {
      console.error('Failed to like profile:', err);
      setToast('Could not send ignite. Try again.');
      window.setTimeout(() => setToast(''), 2400);
    } finally {
      setPendingAction(null);
    }
  };

  const handlePass = async () => {
    if (!current || pendingAction) return;
    const candidateId = profileUserId(current);
    if (!candidateId) return;

    setPendingAction('pass');
    try {
      await matchService.dismiss(candidateId);
      advance('pass', candidateId);
    } catch (err) {
      console.error('Failed to pass profile:', err);
      setToast('Could not save pass. Try again.');
      window.setTimeout(() => setToast(''), 2400);
    } finally {
      setPendingAction(null);
    }
  };

  const displayName = profileName(
    profile || {
      display_name:
        (user?.user_metadata as { display_name?: string } | undefined)?.display_name ||
        String(user?.email || '').split('@')[0],
    },
    'There',
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
          <p className="text-sm font-medium text-gray-400">Finding your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-0">
      <Navbar
        sparkCount={sparkCount}
        profileName={displayName}
        profileEmail={String(user?.email || '')}
        profileImageUrl={profileImage(profile)}
      />

      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 px-3 py-4 sm:px-6 sm:py-8 lg:flex-row lg:items-start">
        {!profile || profile.is_complete === false ? (
          <CompleteProfile />
        ) : current ? (
          <>
            <div className="flex flex-col items-center gap-5">
              <div
                className={`transition-all duration-200 ${
                  exiting
                    ? `${
                        exitDirection === 'like' ? 'translate-x-8' : '-translate-x-8'
                      } scale-95 opacity-0`
                    : 'translate-x-0 scale-100 opacity-100'
                }`}
              >
                <DiscoverCard
                  profile={current}
                  onPass={handlePass}
                  onLike={handleLike}
                  disabled={Boolean(pendingAction) || exiting}
                />
              </div>

              <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePass}
                    disabled={Boolean(pendingAction) || exiting}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Pass"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                  <span className="text-xs font-medium text-gray-400">Pass</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={Boolean(pendingAction) || exiting}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,122,24,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Ignite"
                  >
                    <Heart className="h-6 w-6 text-white" fill="white" />
                  </button>
                  <span className="text-xs font-medium text-gray-600">Ignite</span>
                </div>
              </div>
            </div>

            <AiMatchInsight profile={current} />
          </>
        ) : (
          <EmptyState />
        )}
      </main>

      {toast && (
        <div className="animate-fade-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      {showProfileNudge && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                  <Flame className="h-5 w-5 text-orange-500" fill="currentColor" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Make your profile yours</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    Add a display name, relationship details, lifestyle info, and schedule so your
                    matches understand more than the basics.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissProfileNudge}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                aria-label="Close profile reminder"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={openProfileEditor}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-white btn-ignite"
              >
                Add profile details
              </button>
              <button
                type="button"
                onClick={dismissProfileNudge}
                className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Browse first
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiscoverCard({
  profile,
  onPass,
  onLike,
  disabled,
}: {
  profile: Record<string, unknown>;
  onPass: () => void | Promise<void>;
  onLike: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const name = profileName(profile);
  const age = profileAge(profile);
  const score = profileCompatibility(profile) ?? 72;
  const bio =
    profileBio(profile) ||
    `${name} shares signals that line up with your dating preferences and interests.`;
  const interests = profileInterests(profile);
  const location = profileLocation(profile);
  const image = profileImage(profile);
  const initial = name.charAt(0).toUpperCase();
  const swipeThreshold = 90;
  const rotation = Math.max(-12, Math.min(12, dragOffset / 18));

  const resetDrag = () => {
    setDragStart(null);
    setDragOffset(0);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    setDragStart(event.clientX);
    setDragOffset(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || dragStart === null) return;
    setDragOffset(event.clientX - dragStart);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || dragStart === null) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const offset = event.clientX - dragStart;
    resetDrag();
    if (offset >= swipeThreshold) {
      void onLike();
    } else if (offset <= -swipeThreshold) {
      void onPass();
    }
  };

  return (
    <div
      className={`relative touch-pan-y select-none ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
      data-testid="discover-card"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetDrag}
      style={{
        transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
        transition: dragStart === null ? 'transform 160ms ease' : 'none',
      }}
    >
      <div className="relative h-[min(560px,calc(100dvh-15rem))] min-h-[420px] w-[min(480px,calc(100vw-1.5rem))] overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-rose-500 to-gray-950 shadow-2xl sm:w-[min(480px,calc(100vw-3rem))]">
        {image ? (
          <img src={image} alt={name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[160px] font-black text-white/20">{initial}</span>
          </div>
        )}
        <div className="absolute right-5 top-5 z-10 flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] shadow-xl">
          <span className="text-[22px] font-black leading-none text-white">{score}%</span>
          <span className="mt-0.5 text-[11px] font-semibold text-white/90">
            {scoreLabel(score)}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        {dragOffset > 40 && (
          <div className="absolute left-6 top-8 z-20 rotate-[-10deg] rounded-2xl border-4 border-orange-400 px-4 py-2 text-xl font-black uppercase tracking-wide text-orange-300">
            Ignite
          </div>
        )}
        {dragOffset < -40 && (
          <div className="absolute right-6 top-8 z-20 rotate-[10deg] rounded-2xl border-4 border-white/70 px-4 py-2 text-xl font-black uppercase tracking-wide text-white/80">
            Pass
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[22px] font-bold leading-snug text-white">
              {name}
              {age ? `, ${age}` : ''}
            </h2>
            <BadgeCheck
              className="h-5 w-5 flex-shrink-0 text-orange-400"
              fill="rgba(255,122,24,0.2)"
            />
          </div>
          {location && <p className="mb-2 text-sm font-medium text-white/70">{location}</p>}
          <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-white/80">{bio}</p>
          <div className="flex flex-wrap gap-2">
            {interests.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onPass}
        disabled={disabled}
        className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:right-[-18px]"
        aria-label="Pass profile"
      >
        <ChevronRight className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

function AiMatchInsight({ profile }: { profile: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const name = profileName(profile);
  const interests = profileInterests(profile);
  const score = profileCompatibility(profile);
  const reason = profileCompatibilityReason(profile);
  const factors = profileCompatibilityFactors(profile);
  const summary =
    reason ||
    `${name} has a compatibility signal${
      score == null ? '' : ` near ${score}%`
    } based on your profile data, preferences, and shared interests.`;

  return (
    <div className="w-[min(480px,calc(100vw-1.5rem))] flex-shrink-0 pt-0 sm:w-[min(480px,calc(100vw-3rem))] lg:w-72 lg:pt-2">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" fill="currentColor" />
          <h3 className="text-sm font-bold text-gray-900">AI Match Insight</h3>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-gray-500">{summary}</p>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-left text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
          aria-expanded={expanded}
        >
          <span>Why this score?</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded ? (
          factors.length ? (
            <div className="space-y-3">
              {factors.slice(0, 4).map((factor) => (
                <div key={`${factor.label}-${factor.detail}`} className="rounded-xl bg-gray-50 p-3">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-900">{factor.label}</span>
                    {typeof factor.points === 'number' && (
                      <span className="flex-shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-orange-600">
                        {factor.points} pts
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-gray-500">{factor.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
              {summary}
            </p>
          )
        ) : (
          <div className="space-y-3.5">
            <InsightRow icon={<Users className="h-4 w-4 text-orange-500" />}>
              {interests.length} shared-interest signals
            </InsightRow>
            <InsightRow icon={<Heart className="h-4 w-4 text-orange-500" />}>
              Similar profile values
            </InsightRow>
            <InsightRow icon={<MessageCircle className="h-4 w-4 text-orange-500" />}>
              Strong conversation potential
            </InsightRow>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{children}</span>
    </div>
  );
}

function CompleteProfile() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] shadow-xl">
        <Flame className="h-10 w-10 text-white" fill="white" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">Complete your profile</h2>
      <p className="mb-6 max-w-xs text-sm text-gray-500">
        Add your details before discovery so the matcher has real data to score.
      </p>
      <Link
        to="/onboarding"
        className="rounded-2xl px-6 py-3 text-sm font-semibold text-white btn-ignite"
      >
        Start onboarding
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] shadow-xl">
        <Flame className="h-10 w-10 text-white" fill="white" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">All caught up</h2>
      <p className="max-w-xs text-sm text-gray-500">
        You have seen all available matches. Check back when more complete profiles are available.
      </p>
    </div>
  );
}
