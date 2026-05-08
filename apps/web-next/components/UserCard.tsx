"use client";

import Image from "next/image";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { User } from "@/types/user";

interface Props {
  user: User;
  onNext?: () => void;
}

export default function UserCard({ user, onNext }: Props) {
  const sparkPct = Math.round(user.spark_score * 100);

  return (
    <div className="relative">
      {/* Card */}
      <div className="relative w-[480px] h-[560px] rounded-3xl overflow-hidden shadow-2xl">
        {/* Photo */}
        <Image
          src={user.photos[0]}
          alt={user.name}
          fill
          className="object-cover"
          sizes="480px"
          priority
        />

        {/* Circular spark badge */}
        <div className="absolute top-5 right-5 w-[76px] h-[76px] rounded-full bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] flex flex-col items-center justify-center shadow-xl z-10">
          <span className="text-[22px] font-black text-white leading-none">{sparkPct}%</span>
          <span className="text-[11px] font-semibold text-white/90 mt-0.5">Spark</span>
        </div>

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Overlaid content */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-[22px] font-bold text-white leading-snug">
              {user.name}, {user.age}
            </h2>
            <BadgeCheck className="w-5 h-5 text-orange-400 flex-shrink-0" fill="rgba(255,122,24,0.2)" />
          </div>
          <p className="text-white/80 text-sm leading-relaxed mb-4">{user.ai_reason}</p>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-black/40 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation arrow — outside, right edge */}
      {onNext && (
        <button
          onClick={onNext}
          className="absolute right-[-18px] top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center z-20 hover:shadow-xl transition-all"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}
