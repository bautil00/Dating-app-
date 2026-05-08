"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Flame, User, LogOut, Settings, ChevronDown, Heart, MessageCircle, Zap } from "lucide-react";
import { useState, useRef, useEffect } from "react";

/* ── Mock counts (replace with real data once Supabase is wired) ── */
const NEW_SPARKS   = 2;  // new mutual matches
const UNREAD_MSGS  = 3;  // unread messages across all convos

const NOTIFICATIONS = [
  { id: 1, icon: "❤️",  text: "Alex Chen liked you back — it's a Spark!",    time: "2m ago",  href: "/sparks"   },
  { id: 2, icon: "💬",  text: "Jordan Rivera sent you a message",             time: "15m ago", href: "/messages" },
  { id: 3, icon: "❤️",  text: "Sam Patel liked you back — it's a Spark!",    time: "1h ago",  href: "/sparks"   },
  { id: 4, icon: "💬",  text: "Sam Patel sent you a message",                 time: "3h ago",  href: "/messages" },
  { id: 5, icon: "👀",  text: "5 people viewed your profile today",           time: "5h ago",  href: "/profile"  },
];

const navLinks = [
  { href: "/discover", label: "Discover", badge: 0            },
  { href: "/sparks",   label: "Sparks",   badge: NEW_SPARKS   },
  { href: "/messages", label: "Messages", badge: UNREAD_MSGS  },
  { href: "/profile",  label: "Profile",  badge: 0            },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [bellOpen,   setBellOpen]   = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const bellRef   = useRef<HTMLDivElement>(null);

  const totalNotifs = NEW_SPARKS + UNREAD_MSGS;

  /* Close dropdowns when clicking outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
      if (bellRef.current   && !bellRef.current.contains(e.target as Node))   setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () => {
    setAvatarOpen(false);
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

        {/* Center nav with badges */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, badge }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-5 text-sm font-semibold transition-colors no-underline ${
                  active ? "text-orange-500" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {label}
                  {badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold"
                      style={{ background: "linear-gradient(to right,#FF7A18,#FF3D2E)" }}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: bell + avatar */}
        <div className="flex items-center gap-3">

          {/* Bell with notification dropdown */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => { setBellOpen(p => !p); setAvatarOpen(false); }}
              className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all"
            >
              <Bell className="w-5 h-5" />
              {totalNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ background: "linear-gradient(to right,#FF7A18,#FF3D2E)" }}>
                  {totalNotifs > 9 ? "9+" : totalNotifs}
                </span>
              )}
            </button>

            {/* Bell dropdown */}
            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                  <span className="text-xs text-orange-500 font-semibold cursor-pointer hover:text-orange-600">
                    Mark all read
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {NOTIFICATIONS.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setBellOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors no-underline border-b border-gray-50 last:border-0"
                    >
                      <span className="text-lg leading-none mt-0.5">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-snug">{n.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100">
                  <Link href="/sparks" onClick={() => setBellOpen(false)}
                    className="text-xs text-orange-500 font-semibold hover:text-orange-600 no-underline">
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Avatar + dropdown */}
          <div ref={avatarRef} className="relative">
            <button
              onClick={() => { setAvatarOpen(p => !p); setBellOpen(false); }}
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
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${avatarOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Avatar dropdown */}
            {avatarOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-900">Alex Rivera</p>
                  <p className="text-xs text-gray-400 truncate">alex@example.com</p>
                </div>
                <Link href="/profile" onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors no-underline">
                  <User className="w-4 h-4 text-gray-400" />
                  View Profile
                </Link>
                <Link href="/profile" onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors no-underline">
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
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
