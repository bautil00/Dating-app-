import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Heart, MessageCircle, MoreHorizontal, ShieldOff, Star, UserX } from 'lucide-react';
import { authService, matchService } from '../services/api';
import Navbar from '../components/Navbar';
import {
  profileAge,
  profileCompatibility,
  profileInterests,
  profileName,
  shortUserId,
} from '../lib/profile';

type MatchRecord = {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender_profile?: Record<string, unknown> | null;
  receiver_profile?: Record<string, unknown> | null;
  other_profile?: Record<string, unknown> | null;
};

type ConfirmAction = { type: 'unmatch' | 'block'; matchId: number; name: string } | null;
type Filter = 'all' | 'new';

export default function Matches() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const [matchesRes, userRes] = await Promise.all([
        matchService.getAll(),
        authService.getMe().catch(() => ({ data: null })),
      ]);
      setMatches(matchesRes.data || []);
      setCurrentUserId(String(userRes.data?.id || ''));
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId: number) => {
    try {
      await matchService.accept(matchId);
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'accepted' } : m)));
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleReject = async (matchId: number) => {
    try {
      await matchService.reject(matchId);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirm) return;
    if (confirm.type === 'unmatch') {
      await handleReject(confirm.matchId);
    } else {
      setMatches((prev) => prev.filter((match) => match.id !== confirm.matchId));
    }
    setToast(
      confirm.type === 'unmatch'
        ? `You unmatched ${confirm.name}.`
        : `${confirm.name} is hidden from your sparks.`,
    );
    window.setTimeout(() => setToast(''), 2400);
    setConfirm(null);
  };

  const accepted = useMemo(() => {
    const acceptedMap = new Map<string, MatchRecord>();
    matches.forEach((match) => {
      if (match.status !== 'accepted' && match.status !== 'matched') return;
      const id = otherUserId(match, currentUserId);
      if (!acceptedMap.has(id)) acceptedMap.set(id, match);
    });
    return Array.from(acceptedMap.values());
  }, [matches, currentUserId]);

  const pendingIncoming = matches.filter(
    (match) => match.status === 'pending' && String(match.receiver_id) === currentUserId,
  );
  const pendingOutgoing = matches.filter(
    (match) => match.status === 'pending' && String(match.sender_id) === currentUserId,
  );
  const newMatches = accepted.filter(
    (match) => Date.now() - Date.parse(match.created_at) < 86_400_000,
  );
  const visibleMatches = filter === 'new' ? newMatches : accepted;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar sparkCount={accepted.length} />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Flame className="h-6 w-6 text-orange-500" fill="currentColor" />
              Your Sparks
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">
              People who liked you back. Mutual sparks are ready for messages.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
            {(['all', 'new'] as Filter[]).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  filter === item
                    ? 'text-white shadow btn-ignite'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {item === 'all' ? `All (${accepted.length})` : `New (${newMatches.length})`}
              </button>
            ))}
          </div>
        </div>

        {pendingIncoming.length > 0 && (
          <section className="mb-8 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
              Pending Requests
            </h2>
            <div className="space-y-3">
              {pendingIncoming.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-xl bg-orange-50 p-4"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {profileName(match.sender_profile, `User ${shortUserId(match.sender_id)}`)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Sent {new Date(match.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAccept(match.id)}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white btn-ignite"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(match.id)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-white"
                    >
                      Pass
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {visibleMatches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {visibleMatches.map((match) => {
              const otherId = otherUserId(match, currentUserId);
              const profile = otherProfile(match, currentUserId);
              const name = profileName(profile, `User ${shortUserId(otherId)}`);
              return (
                <MatchCard
                  key={match.id}
                  match={match}
                  name={name}
                  age={profileAge(profile)}
                  interests={profileInterests(profile)}
                  score={profileCompatibility(profile) ?? 76}
                  otherUserId={otherId}
                  isNew={newMatches.some((item) => item.id === match.id)}
                  onUnmatch={() => setConfirm({ type: 'unmatch', matchId: match.id, name })}
                  onBlock={() => setConfirm({ type: 'block', matchId: match.id, name })}
                />
              );
            })}
          </div>
        )}

        {pendingOutgoing.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
              Waiting For Response
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {pendingOutgoing.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <p className="font-semibold text-gray-800">
                    {profileName(match.receiver_profile, `User ${shortUserId(match.receiver_id)}`)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Sent {new Date(match.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                confirm.type === 'block' ? 'bg-red-100' : 'bg-orange-100'
              }`}
            >
              {confirm.type === 'block' ? (
                <ShieldOff className="h-6 w-6 text-red-500" />
              ) : (
                <UserX className="h-6 w-6 text-orange-500" />
              )}
            </div>
            <h3 className="mb-1 text-center text-lg font-bold text-gray-900">
              {confirm.type === 'unmatch' ? `Unmatch ${confirm.name}?` : `Hide ${confirm.name}?`}
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500">
              This removes the spark from this view. Existing backend match data is handled through
              the match status endpoint.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-all ${
                  confirm.type === 'block'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {confirm.type === 'unmatch' ? 'Unmatch' : 'Hide'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="animate-fade-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  name,
  age,
  interests,
  score,
  otherUserId,
  isNew,
  onUnmatch,
  onBlock,
}: {
  match: MatchRecord;
  name: string;
  age: string;
  interests: string[];
  score: number;
  otherUserId: string;
  isNew: boolean;
  onUnmatch: () => void;
  onBlock: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] bg-gradient-to-br from-orange-400 via-rose-500 to-gray-950">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-8xl font-black text-white/20">{initial}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {isNew && (
          <div className="absolute left-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">
            NEW
          </div>
        )}
        <div className="absolute right-3 top-3 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] shadow-lg">
          <span className="text-sm font-black leading-none text-white">{score}%</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-base font-bold text-white">
            {name}
            {age ? `, ${age}` : ''}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {interests.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Star className="h-3.5 w-3.5 text-orange-400" fill="currentColor" />
          {new Date(match.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to={`/chat/${otherUserId}`}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:shadow-md btn-ignite"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Message
          </Link>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-xl p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700"
              aria-label="Spark actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onUnmatch();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 transition-colors hover:bg-orange-50"
                >
                  <UserX className="h-4 w-4" />
                  Unmatch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onBlock();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <ShieldOff className="h-4 w-4" />
                  Hide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] shadow-xl">
        <Heart className="h-10 w-10 text-white" fill="white" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">No sparks yet</h2>
      <p className="mb-6 max-w-xs text-sm text-gray-500">
        Keep discovering people. Mutual likes will show up here.
      </p>
      <Link
        to="/discover"
        className="rounded-2xl px-6 py-3 text-sm font-semibold text-white btn-ignite"
      >
        Go to Discover
      </Link>
    </div>
  );
}

function otherUserId(match: MatchRecord, currentUserId: string) {
  return String(match.sender_id) === currentUserId
    ? String(match.receiver_id)
    : String(match.sender_id);
}

function otherProfile(match: MatchRecord, currentUserId: string) {
  return (
    match.other_profile ||
    (otherUserId(match, currentUserId) === String(match.sender_id)
      ? match.sender_profile
      : match.receiver_profile)
  );
}
