"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Flame, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navLinks = [
  { href: "/discover",  label: "Discover"  },
  { href: "/sparks",    label: "Sparks"    },
  { href: "/messages",  label: "Messages"  },
  { href: "/profile",   label: "Profile"   },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () => {
    setOpen(false);
    // TODO: clear Supabase / API session here
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/discover" className="flex items-center gap-2 no-underline">
          <Flame className="w-6 h-6 text-orange-500" fill="currentColor" />
          <span className="text-lg font-extrabold tracking-tight text-gray-900">Blowtorch</span>
        </Link>

        {/* Center nav */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-5 text-sm font-semibold transition-colors no-underline ${
                  active ? "text-orange-500" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: bell + avatar dropdown */}
        <div className="flex items-center gap-3">
          {/* Bell */}
          <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
          </button>

          {/* Avatar + dropdown */}
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((p) => !p)}
              className="flex items-center gap-1.5 rounded-full focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-orange-200 group-hover:ring-orange-400 transition-all">
                <Image
                  src="https://picsum.photos/seed/avatar/40/40"
                  alt="Avatar"
                  width={36}
                  height={36}
                  className="object-cover"
                />
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown menu */}
            {open && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                {/* User info */}
                <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-900">Alex Rivera</p>
                  <p className="text-xs text-gray-400 truncate">alex@example.com</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors no-underline"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  View Profile
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors no-underline"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </Link>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
