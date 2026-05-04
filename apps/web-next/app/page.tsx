"use client";

import { useEffect, useState } from "react";
import { getDiscoverUsers } from "@/lib/mockApi";
import { User } from "@/types/user";
import Navbar from "@/components/Navbar";
import UserCard from "@/components/UserCard";
import UserCardSkeleton from "@/components/UserCardSkeleton";
import { Flame, Sparkles, MessageCircle, Heart } from "lucide-react";

const insightBullets = [
  {
    icon: Flame,
    label: "Shared interests",
    desc: "Both passionate about AI, startups, and building things",
  },
  {
    icon: Heart,
    label: "Similar values",
    desc: "Ambition, creativity, and making a meaningful impact",
  },
  {
    icon: MessageCircle,
    label: "Conversation potential",
    desc: "High — lots of overlapping topics to explore together",
  },
];

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exitingId, setExitingId] = useState<number | null>(null);

  useEffect(() => {
    getDiscoverUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const current = users[0] ?? null;

  const advance = (id: number) => {
    setExitingId(id);
    setTimeout(() => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setExitingId(null);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading
              ? "Finding your best matches…"
              : current
              ? `${users.length} match${users.length === 1 ? "" : "es"} curated for you today`
              : "You've seen everyone for today — check back tomorrow!"}
          </p>
        </div>

        {loading ? (
          <div className="flex gap-8 items-start">
            <UserCardSkeleton />
            <InsightSkeleton />
          </div>
        ) : current ? (
          <div className="flex gap-8 items-start">
            {/* User card */}
            <div
              className={`transition-all duration-300 ${
                exitingId === current.id
                  ? "opacity-0 -translate-x-6 scale-95"
                  : "opacity-100 translate-x-0 scale-100"
              }`}
            >
              <UserCard
                user={current}
                onPass={(id) => advance(id)}
                onIgnite={(id) => advance(id)}
              />
            </div>

            {/* AI insight sidebar */}
            <div className="flex-1 space-y-5">
              {/* Insight header */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <h2 className="font-bold text-gray-900 text-lg">AI Match Insight</h2>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  Our AI analysed your profiles, interests, and communication
                  style to find why you two could really connect.
                </p>

                {/* Spark score */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] flex items-center justify-center shadow-lg flex-shrink-0">
                    <Flame className="w-7 h-7 text-white" fill="white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black gradient-text">
                      {Math.round(current.spark_score * 100)}%
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Spark compatibility</p>
                  </div>
                </div>

                {/* Bullets */}
                <div className="space-y-4">
                  {insightBullets.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Queue preview */}
              {users.length > 1 && (
                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Up next
                  </p>
                  <div className="space-y-2">
                    {users.slice(1, 4).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center font-bold text-orange-600 text-sm flex-shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {u.name}, {u.age}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {Math.round(u.spark_score * 100)}% Spark
                          </p>
                        </div>
                        <Flame className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded-full w-1/2" />
      <div className="h-3 bg-gray-200 rounded-full w-full" />
      <div className="h-3 bg-gray-200 rounded-full w-4/5" />
      <div className="h-16 bg-gray-200 rounded-xl" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded-full w-1/3" />
            <div className="h-3 bg-gray-200 rounded-full w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] flex items-center justify-center shadow-xl mb-6">
        <Flame className="w-10 h-10 text-white" fill="white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        You&apos;ve seen all your matches for today. Check back tomorrow for fresh connections.
      </p>
    </div>
  );
}
