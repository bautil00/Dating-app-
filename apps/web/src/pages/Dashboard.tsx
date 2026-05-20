import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, ChevronRight, Flame, Heart, MessageCircle, Users, X } from 'lucide-react';
import { authService, matchService, profileService } from '../services/api';
import Navbar from '../components/Navbar';
import {
  profileAge,
  profileBio,
  profileCompatibility,
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

export default function Dashboard() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [candidates, setCandidates] = useState<Record<string, unknown>[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
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
        setCandidates(candidatesRes.data || []);
        setMatches(matchesRes.data || []);
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

  const advance = () => {
    setExiting(true);
    window.setTimeout(() => {
      setCandidates((prev) => prev.slice(1));
      setExiting(false);
    }, 180);
  };

  const handleLike = async () => {
    if (!current) return;
    const candidateId = profileUserId(current);
    if (!candidateId) return;

    try {
      const result = await matchService.create(candidateId);
      setMatches((prev) => [result.data, ...prev.filter((match) => match.id !== result.data.id)]);
      setToast(result.data?.matched ? "It's a spark. You can message them now." : 'Ignite sent.');
      window.setTimeout(() => setToast(''), 2400);
      advance();
    } catch (err) {
      console.error('Failed to like profile:', err);
      setToast('Could not send ignite. Try again.');
      window.setTimeout(() => setToast(''), 2400);
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
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar
        sparkCount={sparkCount}
        profileName={displayName}
        profileEmail={String(user?.email || '')}
      />

      <main className="mx-auto flex max-w-5xl items-start justify-center gap-8 px-6 py-8">
        {!profile || profile.is_complete === false ? (
          <CompleteProfile />
        ) : current ? (
          <>
            <div className="flex flex-col items-center gap-5">
              <div
                className={`transition-all duration-200 ${
                  exiting
                    ? '-translate-x-4 scale-95 opacity-0'
                    : 'translate-x-0 scale-100 opacity-100'
                }`}
              >
                <DiscoverCard profile={current} onNext={advance} />
              </div>

              <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={advance}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95"
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
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] shadow-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,122,24,0.5)] active:scale-95"
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
    </div>
  );
}

function DiscoverCard({
  profile,
  onNext,
}: {
  profile: Record<string, unknown>;
  onNext: () => void;
}) {
  const name = profileName(profile);
  const age = profileAge(profile);
  const score = profileCompatibility(profile) ?? 72;
  const bio =
    profileBio(profile) ||
    `${name} shares signals that line up with your dating preferences and interests.`;
  const interests = profileInterests(profile);
  const location = profileLocation(profile);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <div className="relative h-[560px] w-[min(480px,calc(100vw-3rem))] overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-rose-500 to-gray-950 shadow-2xl">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[160px] font-black text-white/20">{initial}</span>
        </div>
        <div className="absolute right-5 top-5 z-10 flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] shadow-xl">
          <span className="text-[22px] font-black leading-none text-white">{score}%</span>
          <span className="mt-0.5 text-[11px] font-semibold text-white/90">Spark</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
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
          <p className="mb-4 text-sm leading-relaxed text-white/80">{bio}</p>
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
        onClick={onNext}
        className="absolute right-[-18px] top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:shadow-xl"
        aria-label="Next profile"
      >
        <ChevronRight className="h-4 w-4 text-gray-600" />
      </button>
    </div>
  );
}

function AiMatchInsight({ profile }: { profile: Record<string, unknown> }) {
  const name = profileName(profile);
  const interests = profileInterests(profile);
  const score = profileCompatibility(profile);

  return (
    <div className="hidden w-72 flex-shrink-0 pt-2 lg:block">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" fill="currentColor" />
          <h3 className="text-sm font-bold text-gray-900">AI Match Insight</h3>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-gray-500">
          {name} has a compatibility signal
          {score == null ? '' : ` near ${score}%`} based on your profile data, preferences, and
          shared interests.
        </p>

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
        to="/profile"
        className="rounded-2xl px-6 py-3 text-sm font-semibold text-white btn-ignite"
      >
        Build profile
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
