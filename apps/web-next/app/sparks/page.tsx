"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Flame, MessageCircle, Heart, Star, MoreHorizontal, UserX, ShieldOff } from "lucide-react";

type Match = {
  id: number;
  name: string;
  age: number;
  photo: string;
  spark_score: number;
  interests: string[];
  matched_at: string;
  is_new: boolean;
};

const MOCK_MATCHES: Match[] = [
  { id: 1, name: "Alex Chen",    age: 26, photo: "https://picsum.photos/seed/alex/400/500",    spark_score: 0.87, interests: ["AI", "Startups", "Music"],       matched_at: "2m ago",   is_new: true  },
  { id: 2, name: "Jordan Rivera",age: 29, photo: "https://picsum.photos/seed/jordan/400/500",  spark_score: 0.74, interests: ["Design", "Travel", "Coffee"],     matched_at: "1h ago",   is_new: true  },
  { id: 3, name: "Sam Patel",    age: 24, photo: "https://picsum.photos/seed/sam/400/500",     spark_score: 0.91, interests: ["Music", "Gaming", "Fitness"],     matched_at: "3h ago",   is_new: false },
  { id: 4, name: "Morgan Lee",   age: 27, photo: "https://picsum.photos/seed/morgan/400/500",  spark_score: 0.68, interests: ["Books", "Art", "Cooking"],        matched_at: "1d ago",   is_new: false },
  { id: 5, name: "Riley Kim",    age: 25, photo: "https://picsum.photos/seed/riley/400/500",   spark_score: 0.82, interests: ["Photography", "Travel", "Tech"],  matched_at: "2d ago",   is_new: false },
  { id: 6, name: "Casey Moore",  age: 28, photo: "https://picsum.photos/seed/casey/400/500",   spark_score: 0.79, interests: ["Fitness", "Sports", "Gaming"],    matched_at: "3d ago",   is_new: false },
];

type Filter = "all" | "new";
type ConfirmAction = { type: "unmatch" | "block"; matchId: number; name: string } | null;

export default function SparksPage() {
  const [filter,  setFilter]  = useState<Filter>("all");
  const [list,    setList]    = useState<Match[]>(MOCK_MATCHES);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [toast,   setToast]   = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = () => {
    if (!confirm) return;
    setList((prev) => prev.filter((m) => m.id !== confirm.matchId));
    showToast(
      confirm.type === "unmatch"
        ? `You unmatched ${confirm.name}.`
        : `${confirm.name} has been blocked.`
    );
    setConfirm(null);
  };

  const allCount = list.length;
  const newCount = list.filter((m) => m.is_new).length;
  const matches  = filter === "new" ? list.filter((m) => m.is_new) : list;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" fill="currentColor" />
              Your Sparks
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">People who liked you back — it&apos;s a match!</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
            {(["all", "new"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === f ? "text-white shadow" : "text-gray-500 hover:text-gray-700"
                }`}
                style={filter === f ? { background: "linear-gradient(to right,#FF7A18,#FF3D2E)" } : {}}
              >
                {f === "all" ? `All (${allCount})` : `New 🔥 (${newCount})`}
              </button>
            ))}
          </div>
        </div>

        {matches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onUnmatch={() => setConfirm({ type: "unmatch", matchId: match.id, name: match.name })}
                onBlock={()   => setConfirm({ type: "block",   matchId: match.id, name: match.name })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Confirmation modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto ${
              confirm.type === "block" ? "bg-red-100" : "bg-orange-100"
            }`}>
              {confirm.type === "block"
                ? <ShieldOff className="w-6 h-6 text-red-500" />
                : <UserX className="w-6 h-6 text-orange-500" />
              }
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
              {confirm.type === "unmatch" ? `Unmatch ${confirm.name}?` : `Block ${confirm.name}?`}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {confirm.type === "unmatch"
                ? "This will remove your match and delete your conversation. This can't be undone."
                : "They won't be able to see your profile or contact you. This can't be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all ${
                  confirm.type === "block"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {confirm.type === "unmatch" ? "Unmatch" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-2xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  onUnmatch,
  onBlock,
}: {
  match: Match;
  onUnmatch: () => void;
  onBlock: () => void;
}) {
  const sparkPct = Math.round(match.spark_score * 100);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Photo */}
      <div className="relative aspect-[3/4]">
        <Image src={match.photo} alt={match.name} fill className="object-cover" unoptimized />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* New badge */}
        {match.is_new && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
            NEW ✨
          </div>
        )}

        {/* Spark score */}
        <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] flex flex-col items-center justify-center shadow-lg">
          <span className="text-sm font-black text-white leading-none">{sparkPct}%</span>
        </div>

        {/* Name / age */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-base">
            {match.name}, {match.age}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {match.interests.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium rounded-full border border-white/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Star className="w-3.5 h-3.5 text-orange-400" fill="currentColor" />
          {match.matched_at}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/messages"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:shadow-md"
            style={{ background: "linear-gradient(to right,#FF7A18,#FF3D2E)" }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </Link>

          {/* 3-dot menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                <button
                  onClick={() => { setMenuOpen(false); onUnmatch(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  Unmatch
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onBlock(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <ShieldOff className="w-4 h-4" />
                  Block
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
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] flex items-center justify-center shadow-xl mb-6">
        <Heart className="w-10 h-10 text-white" fill="white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">No sparks yet</h2>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Keep swiping on Discover — when someone likes you back, they&apos;ll show up here.
      </p>
      <Link
        href="/discover"
        className="px-6 py-3 rounded-2xl text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
        style={{ background: "linear-gradient(to right,#FF7A18,#FF3D2E)" }}
      >
        Go to Discover
      </Link>
    </div>
  );
}
