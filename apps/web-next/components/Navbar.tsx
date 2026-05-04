"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Flame } from "lucide-react";

const navLinks = [
  { href: "/", label: "Discover" },
  { href: "/sparks", label: "Sparks" },
  { href: "/messages", label: "Messages" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Flame className="w-7 h-7 text-orange-500" fill="currentColor" />
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#FF7A18] to-[#FF3D2E] bg-clip-text text-transparent">
            Blowtorch
          </span>
        </Link>

        {/* Center nav */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 no-underline ${
                  active
                    ? "bg-orange-50 text-orange-500"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>
          <button className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] flex items-center justify-center text-white text-sm font-bold shadow-md hover:shadow-glow transition-all">
            A
          </button>
        </div>
      </div>
    </nav>
  );
}
