"use client";

import Link from "next/link";
import { useState } from "react";
import { Flame, Sparkles, ShieldCheck, Users } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-powered matching",
    desc: "Our AI finds people who truly match your personality and values.",
  },
  {
    icon: Users,
    title: "Meaningful connections",
    desc: "Skip the endless swiping — every match is curated for depth.",
  },
  {
    icon: ShieldCheck,
    title: "Private and secure",
    desc: "Your data stays yours. We never sell or share your information.",
  },
];

export default function OnboardingPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* ── Left: dark brand panel ── */}
      <div className="relative bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] flex flex-col justify-center px-12 py-16 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <Flame className="w-9 h-9 text-orange-500" fill="currentColor" />
          <span className="text-2xl font-extrabold tracking-tight text-white">Blowtorch</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-black text-white leading-tight mb-4 max-w-sm">
          Spark your connections with{" "}
          <span className="gradient-text">Blowtorch</span>
        </h1>
        <p className="text-gray-400 text-base leading-relaxed mb-12 max-w-sm">
          AI matches you with people who share your vibe — no algorithm fatigue, just genuine chemistry.
        </p>

        {/* Feature list */}
        <div className="space-y-6 max-w-sm">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-gray-400 text-sm mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: sign-up form ── */}
      <div className="flex items-center justify-center bg-white px-8 py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
            <p className="text-gray-500 text-sm mb-8">Join thousands finding their spark.</p>

            {/* Social buttons */}
            <div className="space-y-3 mb-6">
              <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-150">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black rounded-xl text-white font-semibold hover:bg-gray-900 transition-all duration-150">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c1.99 0 3.804.701 5.22 1.857C16.138 7.48 14.177 8.5 12 8.5s-4.138-1.02-5.22-2.643A7.963 7.963 0 0 1 12 4zm0 16c-2.21 0-4.21-.898-5.657-2.343C7.516 16.21 9.66 15 12 15s4.484 1.21 5.657 2.657A7.963 7.963 0 0 1 12 20zm7.072-4.157C17.72 14.33 15.007 13 12 13s-5.72 1.33-7.072 2.843A7.957 7.957 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8a7.957 7.957 0 0 1-.928 3.843z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email input */}
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />
              <button className="btn-ignite w-full py-3 text-white rounded-xl font-semibold text-sm">
                Continue with Email →
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              Log in
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4 px-6">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span> and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
