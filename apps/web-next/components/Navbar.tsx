"use client";

import Link from "next/link";
import Image from "next/image";
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
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Flame className="w-6 h-6 text-orange-500" fill="currentColor" />
          <span className="text-lg font-extrabold tracking-tight text-gray-900">Blowtorch</span>
        </Link>

        {/* Center nav — underline active */}
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

        {/* Right: bell + avatar */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-orange-200">
            <Image
              src="https://picsum.photos/seed/avatar/40/40"
              alt="Avatar"
              width={36}
              height={36}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
