"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { Flame, ShieldCheck, Users, Sparkles, X, Camera } from "lucide-react";

const features = [
  { icon: Sparkles, label: "AI-powered matching" },
  { icon: Users, label: "Meaningful connections" },
  { icon: ShieldCheck, label: "Private and secure" },
];

const STEPS = ["account", "photos"] as const;
type Step = (typeof STEPS)[number];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("account");
  const [email, setEmail] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 3 - photos.length;
    files.slice(0, remaining).forEach((f) =>
      setPhotos((prev) => [...prev, URL.createObjectURL(f)])
    );
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = (i: number) =>
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* ── Left: fire brand panel ── */}
      <div
        className="relative flex flex-col justify-between px-10 py-10 overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 35% 100%, rgba(255,140,0,0.85) 0%, transparent 45%),
            radial-gradient(ellipse at 65% 100%, rgba(255,60,0,0.75) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%,  rgba(200,30,0,0.5)  0%, transparent 45%),
            radial-gradient(ellipse at 20% 70%,  rgba(255,100,0,0.3) 0%, transparent 30%),
            radial-gradient(ellipse at 80% 65%,  rgba(255,80,0,0.3)  0%, transparent 30%),
            linear-gradient(to top, #3d0500, #1a0800 30%, #0a0505 65%, #060304)
          `,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Flame className="w-7 h-7 text-orange-500" fill="currentColor" />
          <span className="text-xl font-extrabold text-white tracking-tight">Blowtorch</span>
        </div>

        {/* Headline + features */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Spark your<br />connections with{" "}
              <span
                style={{
                  background: "linear-gradient(to right, #FF7A18, #FF3D2E)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Blowtorch
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs">
              AI matches you with people who share your vibe and values.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-white/80 text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div />
      </div>

      {/* ── Right: white form area ── */}
      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= stepIndex
                    ? "bg-gradient-to-r from-[#FF7A18] to-[#FF3D2E]"
                    : "bg-gray-200"
                } ${i === stepIndex ? "w-8" : "w-4"}`}
              />
            ))}
          </div>

          {/* ── Step 1: Account ── */}
          {step === "account" && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-gray-400 text-sm mb-7">Jump in and start sparking.</p>

              <div className="space-y-3 mb-6">
                <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
                <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black rounded-xl text-white text-sm font-semibold hover:bg-gray-900 transition-all">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 814 1000">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-161.6-103.1c-46.6-55.2-102.3-136.8-102.3-215.3 0-135.8 103-207.1 204.5-207.1 51.3 0 94.4 33.5 126.4 33.5 30.8 0 79.4-35.5 141.5-35.5 22.1 0 108.2 1.9 163.9 89.9zm-220.3-176.2c27.3-34.5 46.6-82.1 46.6-129.8 0-6.4-.6-12.9-1.9-18.1-44.1 1.6-97.2 30.2-128.8 67.5-25.7 29.5-47.9 76.8-47.9 124.9 0 7.1 1.3 14.2 1.9 16.4 3.2.6 8.4 1.3 13.5 1.3 39.5 0 89.5-26.8 116.6-62.2z" />
                  </svg>
                  Continue with Apple
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
                />
                <button
                  onClick={() => setStep("photos")}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(to right, #FF7A18, #FF3D2E)" }}
                >
                  Continue with Email
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600">
                  Log in
                </Link>
              </p>
              <p className="text-center text-xs text-gray-400 mt-3 px-4 leading-relaxed">
                By continuing, you agree to our{" "}
                <span className="underline cursor-pointer">Terms of Service</span> and{" "}
                <span className="underline cursor-pointer">Privacy Policy</span>.
              </p>
            </div>
          )}

          {/* ── Step 2: Photos ── */}
          {step === "photos" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Almost there! Add up to 3 photos</h2>
                <p className="text-gray-400 text-sm mt-2">Great photos help AI find your best matches.</p>
              </div>

              {/* Photo grid — 4 slots (3 filled + 1 add) */}
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 3 }).map((_, i) => {
                  const photo = photos[i];
                  return (
                    <div key={i} className="relative aspect-square">
                      {photo ? (
                        <div className="w-full h-full rounded-2xl overflow-hidden relative">
                          <Image
                            src={photo}
                            alt={`Photo ${i + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {i === 0 && (
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                              <span>★</span> Main photo
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => inputRef.current?.click()}
                          className="w-full h-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 flex flex-col items-center justify-center gap-1 transition-all"
                          disabled={photos.length >= 3}
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-lg font-light">+</span>
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Always-visible add slot */}
                <button
                  onClick={() => photos.length < 3 && inputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 flex flex-col items-center justify-center gap-1.5 transition-all"
                >
                  <Camera className="w-6 h-6 text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-medium text-center leading-tight px-1">
                    Add photo<br />(3 max)
                  </span>
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFile}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("account")}
                  className="flex-shrink-0 px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(to right, #FF7A18, #FF3D2E)" }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
