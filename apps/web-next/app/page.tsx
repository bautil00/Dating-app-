"use client";

import { useEffect, useState } from "react";
import { getDiscoverUsers } from "@/lib/mockApi";
import { User } from "@/types/user";
import Navbar from "@/components/Navbar";
import UserCard from "@/components/UserCard";
import UserCardSkeleton from "@/components/UserCardSkeleton";
import { Flame, Users, Heart, MessageCircle, X } from "lucide-react";

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    getDiscoverUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const advance = () => {
    setExiting(true);
    setTimeout(() => {
      setUsers((prev) => prev.slice(1));
      setExiting(false);
    }, 280);
  };

  const current = users[0] ?? null;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8 flex gap-8 items-start justify-center">
        {loading ? (
          <>
            <UserCardSkeleton />
            <AiInsightSkeleton />
          </>
        ) : current ? (
          <>
            {/* Left: card + action buttons */}
            <div className="flex flex-col items-center gap-5">
              <div
                className={`transition-all duration-280 ${
                  exiting ? "opacity-0 scale-95 -translate-x-4" : "opacity-100 scale-100 translate-x-0"
                }`}
              >
                <UserCard user={current} onNext={advance} />
              </div>

              {/* Circular action buttons */}
              <div className="flex items-center gap-10">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={advance}
                    className="w-14 h-14 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                  <span className="text-xs text-gray-400 font-medium">Pass</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={advance}
                    className="w-14 h-14 bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] rounded-full shadow-lg flex items-center justify-center hover:shadow-[0_0_20px_rgba(255,122,24,0.5)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Heart className="w-6 h-6 text-white" fill="white" />
                  </button>
                  <span className="text-xs text-gray-600 font-medium">Ignite</span>
                </div>
              </div>
            </div>

            {/* Right: AI Match Insight */}
            <div className="w-72 flex-shrink-0 pt-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-orange-500" fill="currentColor" />
                  <h3 className="font-bold text-gray-900 text-sm">AI Match Insight</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  {current.name} has a passion for innovation and growth. You share{" "}
                  {current.interests.length} common interests and a similar outlook on life.
                </p>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">
                      {current.interests.length} shared interests
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Similar values</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Great conversation potential</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

function AiInsightSkeleton() {
  return (
    <div className="w-72 bg-white rounded-2xl shadow-lg p-5 animate-pulse space-y-3 mt-2">
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-4/5" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 pt-1">
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 h-3 bg-gray-200 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] flex items-center justify-center shadow-xl mb-6">
        <Flame className="w-10 h-10 text-white" fill="white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
      <p className="text-gray-500 text-sm max-w-xs">
        You&apos;ve seen all your matches for today. Check back tomorrow.
      </p>
    </div>
  );
}
