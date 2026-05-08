"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Flame, Plus, X } from "lucide-react";

/* ── Types ──────────────────────────────────────── */
type Step = "account" | "interests" | "about" | "story" | "photos";
const QUIZ_STEPS: Step[] = ["interests", "about", "story"];

const INTEREST_OPTIONS = [
  "Tech", "AI", "Music", "Fitness",
  "Startups", "Travel", "Gaming", "Art",
  "Cooking", "Photography", "Sports", "Books",
];

type Gender   = "Male" | "Female" | "Non-binary" | null;
type InterestedIn = "Male" | "Female" | "Everyone" | null;

/* ── Helpers ─────────────────────────────────────── */
function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      <span className="text-2xl font-black text-orange-500 tracking-tight">Blowtorch</span>
      <Flame className="w-6 h-6 text-orange-500" fill="currentColor" />
    </div>
  );
}

function QuizProgress({ step }: { step: Step }) {
  const idx = QUIZ_STEPS.indexOf(step);
  if (idx === -1) return null;
  return (
    <div className="w-full mb-2">
      <div className="flex gap-2 mb-1.5">
        {QUIZ_STEPS.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= idx ? "linear-gradient(to right,#FF7A18,#FF3D2E)" : "#E5E7EB" }}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 font-medium">Step {idx + 1} of {QUIZ_STEPS.length}</p>
    </div>
  );
}

function ContinueBtn({
  label = "Continue",
  disabled,
  onClick,
}: {
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
        disabled
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "text-white shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
      }`}
      style={!disabled ? { background: "linear-gradient(to right,#FF7A18,#FF3D2E)" } : {}}
    >
      {label}
    </button>
  );
}

function SelectPill({
  label,
  selected,
  onClick,
  orange,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  orange?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl border-2 text-sm font-medium transition-all duration-150 ${
        selected
          ? orange
            ? "border-orange-500 bg-orange-50 text-orange-600"
            : "border-orange-500 bg-orange-50 text-orange-600"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

/* ── Main page ───────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("account");

  // Account
  const [email, setEmail] = useState("");

  // Interests
  const [interests, setInterests] = useState<string[]>([]);

  // About
  const [gender, setGender]           = useState<Gender>(null);
  const [interestedIn, setInterestedIn] = useState<InterestedIn>(null);
  const [age, setAge]                 = useState(25);
  const [location, setLocation]       = useState("");

  // Story
  const [bio, setBio] = useState("");

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleInterest = (tag: string) =>
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? [])
      .slice(0, 3 - photos.length)
      .forEach((f) => setPhotos((p) => [...p, URL.createObjectURL(f)]));
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  /* ── Wrapper shared by quiz steps ── */
  const QuizShell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo />
        <QuizProgress step={step} />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     STEP: account
  ════════════════════════════════════════════════ */
  if (step === "account") {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left — fire panel */}
        <div
          className="relative flex flex-col justify-between px-10 py-10 overflow-hidden"
          style={{
            background: `
              radial-gradient(ellipse at 35% 100%, rgba(255,140,0,0.85) 0%, transparent 45%),
              radial-gradient(ellipse at 65% 100%, rgba(255,60,0,0.75) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 80%,  rgba(200,30,0,0.5)  0%, transparent 45%),
              linear-gradient(to top, #3d0500, #1a0800 30%, #0a0505 65%, #060304)
            `,
          }}
        >
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-500" fill="currentColor" />
            <span className="text-xl font-extrabold text-white">Blowtorch</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-black text-white leading-tight">
              Spark your connections with{" "}
              <span style={{ background: "linear-gradient(to right,#FF7A18,#FF3D2E)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Blowtorch
              </span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              AI matches you with people who share your vibe and values.
            </p>
            <div className="space-y-4">
              {[
                { label: "AI-powered matching",   sub: "Smart algorithms find your perfect connections" },
                { label: "Meaningful connections", sub: "Quality over quantity, every time" },
                { label: "Private and secure",     sub: "Your data is protected and never shared" },
              ].map(({ label, sub }) => (
                <div key={label} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div />
        </div>

        {/* Right — sign-up card */}
        <div className="flex items-center justify-center bg-white px-8 py-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-gray-400 text-sm mb-7">Get started in seconds</p>

              <div className="space-y-3 mb-6">
                <button className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <button className="w-full flex items-center justify-center gap-3 py-3 bg-black rounded-xl text-white text-sm font-semibold hover:bg-gray-900 transition-all">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 814 1000">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-161.6-103.1C46.6 Resource 1 0 0 0-24.6 0-103.1 0-215.3c0-135.8 103-207.1 204.5-207.1 51.3 0 94.4 33.5 126.4 33.5 30.8 0 79.4-35.5 141.5-35.5 22.1 0 108.2 1.9 163.9 89.9zm-220.3-176.2c27.3-34.5 46.6-82.1 46.6-129.8 0-6.4-.6-12.9-1.9-18.1-44.1 1.6-97.2 30.2-128.8 67.5-25.7 29.5-47.9 76.8-47.9 124.9 0 7.1 1.3 14.2 1.9 16.4 3.2.6 8.4 1.3 13.5 1.3 39.5 0 89.5-26.8 116.6-62.2z"/>
                  </svg>
                  Continue with Apple
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all"
                />
                <ContinueBtn
                  label="Continue with Email"
                  disabled={!email.includes("@")}
                  onClick={() => setStep("interests")}
                />
              </div>

              <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600">
                  Log in
                </Link>
              </p>
              <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
                By continuing, you agree to our{" "}
                <span className="font-semibold text-gray-600 cursor-pointer">Terms of Service</span>{" "}
                and{" "}
                <span className="font-semibold text-gray-600 cursor-pointer">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     STEP 1: interests
  ════════════════════════════════════════════════ */
  if (step === "interests") {
    return (
      <QuizShell>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Spark your connections</h2>
          <p className="text-sm text-orange-400 mt-1">Find people who share your interests instantly</p>
        </div>

        <p className="font-semibold text-gray-800 mb-1">What ignites your passion?</p>
        <p className="text-xs text-gray-400 mb-4">Select at least 3 interests</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {INTEREST_OPTIONS.map((tag) => (
            <SelectPill
              key={tag}
              label={tag}
              selected={interests.includes(tag)}
              onClick={() => toggleInterest(tag)}
            />
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mb-6">
          {interests.length}/3 selected
        </p>

        <ContinueBtn
          disabled={interests.length < 3}
          onClick={() => setStep("about")}
        />
      </QuizShell>
    );
  }

  /* ════════════════════════════════════════════════
     STEP 2: about
  ════════════════════════════════════════════════ */
  if (step === "about") {
    const canContinue = gender !== null && interestedIn !== null && location.trim().length > 0;
    return (
      <QuizShell>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">About you</h2>
          <p className="text-sm text-orange-400 mt-1">Help us find your perfect match</p>
        </div>

        {/* Gender */}
        <p className="text-sm font-semibold text-gray-700 mb-2">I am</p>
        <div className="flex gap-2 mb-5">
          {(["Male", "Female", "Non-binary"] as Gender[]).map((g) => (
            <SelectPill key={g!} label={g!} selected={gender === g} onClick={() => setGender(g)} />
          ))}
        </div>

        {/* Interested in */}
        <p className="text-sm font-semibold text-gray-700 mb-2">Interested in</p>
        <div className="flex gap-2 mb-5">
          {(["Male", "Female", "Everyone"] as InterestedIn[]).map((g) => (
            <SelectPill key={g!} label={g!} selected={interestedIn === g} onClick={() => setInterestedIn(g)} />
          ))}
        </div>

        {/* Age slider */}
        <p className="text-sm font-semibold text-gray-700 mb-2">Age: {age}</p>
        <input
          type="range"
          min={18}
          max={60}
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          className="w-full mb-5 accent-orange-500"
        />

        {/* Location */}
        <p className="text-sm font-semibold text-gray-700 mb-2">Location</p>
        <input
          type="text"
          placeholder="San Francisco, CA"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all mb-6"
        />

        <ContinueBtn disabled={!canContinue} onClick={() => setStep("story")} />
      </QuizShell>
    );
  }

  /* ════════════════════════════════════════════════
     STEP 3: story
  ════════════════════════════════════════════════ */
  if (step === "story") {
    return (
      <QuizShell>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Tell your story</h2>
          <p className="text-sm text-orange-400 mt-1">Share what makes you unique (optional)</p>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">Bio</p>
        <textarea
          rows={6}
          placeholder="I'm passionate about building things that matter..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm placeholder-gray-400 resize-none focus:outline-none focus:border-orange-400 transition-all mb-2"
        />
        <p className="text-xs text-gray-400 mb-6">This helps AI find better matches for you</p>

        <ContinueBtn
          label="Ignite Your Journey 🔥"
          disabled={false}
          onClick={() => setStep("photos")}
        />
      </QuizShell>
    );
  }

  /* ════════════════════════════════════════════════
     STEP 4: photos
  ════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add up to 3 photos</h2>
        <p className="text-sm text-gray-400 mb-8">
          Great photos help AI find your <span className="font-semibold text-gray-600">best matches</span>
        </p>

        {/* 3 photo slots */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[0, 1, 2].map((i) => {
            const photo = photos[i];
            const isFirst = i === 0;
            return (
              <div key={i} className="aspect-[3/4]">
                {photo ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image src={photo} alt="" fill className="object-cover" unoptimized />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => inputRef.current?.click()}
                    className={`w-full h-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                      isFirst
                        ? "border-orange-400 bg-orange-50/50 hover:bg-orange-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isFirst ? "bg-orange-100" : "bg-gray-100"
                      }`}
                    >
                      <Plus className={`w-5 h-5 ${isFirst ? "text-orange-500" : "text-gray-400"}`} />
                    </div>
                    <span className={`text-xs font-medium ${isFirst ? "text-orange-500" : "text-gray-400"}`}>
                      Add photo
                      {isFirst && <span className="block text-[10px] opacity-75">(3 max)</span>}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={addPhoto}
        />

        <ContinueBtn
          disabled={photos.length === 0}
          onClick={() => router.push("/discover")}
        />
        {photos.length === 0 && (
          <p className="text-xs text-gray-400 mt-2">Add at least one photo to continue</p>
        )}
      </div>
    </div>
  );
}
