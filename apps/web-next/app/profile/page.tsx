"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  User, Smile, Heart, Star, Eye, Share2, Settings,
  ChevronRight, Briefcase, GraduationCap, X, Plus, ArrowRight,
} from "lucide-react";

const sidebarNav = [
  { icon: User,     label: "About You" },
  { icon: Smile,    label: "Lifestyle" },
  { icon: Heart,    label: "Preferences" },
  { icon: Star,     label: "Personality" },
  { icon: Eye,      label: "Appearance" },
  { icon: Share2,   label: "Socials" },
  { icon: Settings, label: "Account" },
];

const strengthItems = [
  { label: "Basic info",  done: true },
  { label: "Photos",      done: true },
  { label: "Bio",         done: true },
  { label: "Interests",   done: false },
  { label: "Lifestyle",   done: false },
];

export default function ProfilePage() {
  const [active, setActive] = useState("About You");
  const [photos, setPhotos] = useState<string[]>([
    "https://picsum.photos/seed/p1/200/200",
    "https://picsum.photos/seed/p2/200/200",
    "https://picsum.photos/seed/p3/200/200",
  ]);
  const [form, setForm] = useState({
    name: "Alex Chen",
    age: "26",
    bio: "Product builder by day, curious learner always. Love AI, great coffee, and meaningful convos.",
    job: "Product Manager",
    education: "Master's Degree",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const removePhoto = (i: number) =>
    setPhotos((p) => p.filter((_, idx) => idx !== i));

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && photos.length < 3)
      setPhotos((p) => [...p, URL.createObjectURL(file)]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const done = strengthItems.filter((i) => i.done).length;
  const strength = Math.round((done / strengthItems.length) * 100);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-6">
        {/* ── Left sidebar ── */}
        <aside className="w-52 flex-shrink-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Edit Profile
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {sidebarNav.map(({ icon: Icon, label }) => {
              const isActive = active === label;
              return (
                <button
                  key={label}
                  onClick={() => setActive(label)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all ${
                    isActive
                      ? "text-orange-500 bg-orange-50 font-semibold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-orange-400" : "text-gray-300"}`} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main form ── */}
        <main className="flex-1 space-y-4 min-w-0">
          {/* Section header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900">About You</h2>
            <p className="text-sm text-gray-400 mt-0.5">This info helps AI understand you better.</p>

            <div className="mt-5 space-y-4">
              {/* Name + Age */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => update("age", e.target.value)}
                    min={18}
                    max={99}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                />
                <p className="text-right text-xs text-gray-400">{form.bio.length}/300</p>
              </div>

              {/* Job + Education */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Job
                  </label>
                  <input
                    value={form.job}
                    onChange={(e) => update("job", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Education
                  </label>
                  <input
                    value={form.education}
                    onChange={(e) => update("education", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profile tip */}
          <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-500 text-sm">💡</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Profile tip</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add more details about your lifestyle and preferences to improve your matches.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActive("Lifestyle")}
              className="flex items-center gap-1.5 text-orange-500 text-sm font-semibold whitespace-nowrap hover:text-orange-600 transition-colors ml-4 flex-shrink-0"
            >
              Go to Preferences <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </main>

        {/* ── Right sidebar ── */}
        <aside className="w-64 flex-shrink-0 space-y-4">
          {/* Photos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Your Photos</h3>
              <span className="text-xs text-gray-400">{photos.length}/3 photos added</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {photos.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" unoptimized />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 flex items-center justify-center transition-all"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={addPhoto} />
          </div>

          {/* Profile strength */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-0.5">Profile Strength</h3>
            <p className="text-xs text-gray-400 mb-3">
              {strength >= 80
                ? "Great job! A complete profile gets more and better matches."
                : "Complete your profile to improve your matches."}
            </p>

            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${strength}%`,
                  background: "linear-gradient(to right, #FF7A18, #FF3D2E)",
                }}
              />
            </div>
            <p className="text-right text-xs font-bold text-orange-500">{strength}%</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
