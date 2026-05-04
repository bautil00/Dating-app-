"use client";

import Image from "next/image";
import { User } from "@/types/user";
import { X, Flame } from "lucide-react";

interface Props {
  user: User;
  onPass: (id: number) => void;
  onIgnite: (id: number) => void;
}

export default function UserCard({ user, onPass, onIgnite }: Props) {
  const sparkPct = Math.round(user.spark_score * 100);

  return (
    <div className="w-[400px] bg-white rounded-2xl shadow-xl overflow-hidden select-none">
      {/* Photo */}
      <div className="relative h-[500px]">
        <Image
          src={user.photos[0]}
          alt={user.name}
          fill
          className="object-cover"
          sizes="400px"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Spark badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
          <Flame className="w-4 h-4 text-orange-500" fill="currentColor" />
          <span className="text-sm font-bold text-gray-800">{sparkPct}% Spark</span>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-4 left-5 right-5">
          <h2 className="text-2xl font-bold text-white">
            {user.name},{" "}
            <span className="font-normal opacity-90">{user.age}</span>
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <p className="text-gray-500 text-sm italic leading-relaxed">
          &ldquo;{user.ai_reason}&rdquo;
        </p>

        {/* Interest tags */}
        <div className="flex flex-wrap gap-2">
          {user.interests.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-xs font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => onPass(user.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-500 rounded-xl font-semibold hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-150"
          >
            <X className="w-4 h-4" />
            Pass
          </button>
          <button
            onClick={() => onIgnite(user.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#FF7A18] to-[#FF3D2E] text-white rounded-xl font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(255,122,24,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            <Flame className="w-4 h-4" fill="currentColor" />
            Ignite
          </button>
        </div>
      </div>
    </div>
  );
}
