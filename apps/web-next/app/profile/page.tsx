"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import PhotoUploader from "@/components/PhotoUploader";
import {
  User,
  Smile,
  Heart,
  Star,
  Eye,
  Share2,
  Settings,
  ChevronRight,
  Briefcase,
  GraduationCap,
} from "lucide-react";

const sidebarNav = [
  { icon: User, label: "About You" },
  { icon: Smile, label: "Lifestyle" },
  { icon: Heart, label: "Preferences" },
  { icon: Star, label: "Personality" },
  { icon: Eye, label: "Appearance" },
  { icon: Share2, label: "Socials" },
  { icon: Settings, label: "Account" },
];

const profileStrengthItems = [
  { label: "Basic info", done: true },
  { label: "Photos", done: false },
  { label: "Bio", done: true },
  { label: "Interests", done: false },
  { label: "Lifestyle", done: false },
];

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState("About You");
  const [form, setForm] = useState({
    name: "Alex Chen",
    age: "26",
    bio: "Building AI products by day, exploring hidden coffee spots by night. I believe technology should feel human.",
    job: "Software Engineer",
    education: "MIT, Computer Science",
  });

  const done = profileStrengthItems.filter((i) => i.done).length;
  const strength = Math.round((done / profileStrengthItems.length) * 100);

  const update = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
        {/* ── Left sidebar navigation ── */}
        <aside className="w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {sidebarNav.map(({ icon: Icon, label }) => {
              const active = activeSection === label;
              return (
                <button
                  key={label}
                  onClick={() => setActiveSection(label)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-orange-50 text-orange-600 border-r-2 border-orange-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${
                      active ? "rotate-90 text-orange-500" : "text-gray-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main form ── */}
        <main className="flex-1 space-y-5 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{activeSection}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Keep your profile fresh to improve your matches
              </p>
            </div>
            <button className="btn-ignite px-5 py-2.5 text-white text-sm font-semibold rounded-xl">
              Save changes
            </button>
          </div>

          {/* Basic info card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">First name</label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => update("age", e.target.value)}
                  min={18}
                  max={99}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                rows={4}
                placeholder="Tell people what makes you, you…"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
              />
              <p className="text-xs text-gray-400 text-right">{form.bio.length}/300</p>
            </div>
          </div>

          {/* Work & education */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
              Work &amp; Education
            </h3>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Job title
              </label>
              <input
                value={form.job}
                onChange={(e) => update("job", e.target.value)}
                placeholder="e.g. Product Designer"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Education
              </label>
              <input
                value={form.education}
                onChange={(e) => update("education", e.target.value)}
                placeholder="e.g. Harvard, Psychology"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
              />
            </div>
          </div>
        </main>

        {/* ── Right sidebar ── */}
        <aside className="w-72 flex-shrink-0 space-y-5">
          {/* Photos */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Your Photos</h3>
            <PhotoUploader />
          </div>

          {/* Profile strength */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Profile Strength</h3>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  strength >= 80
                    ? "bg-green-100 text-green-600"
                    : strength >= 50
                    ? "bg-orange-100 text-orange-600"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {strength}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-[#FF7A18] to-[#FF3D2E] rounded-full transition-all duration-700"
                style={{ width: `${strength}%` }}
              />
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Complete your profile to improve your matches
            </p>

            <div className="space-y-2">
              {profileStrengthItems.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done ? "bg-green-500" : "bg-gray-200"
                    }`}
                  >
                    {done && (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      done ? "text-gray-600 line-through" : "text-gray-800"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
