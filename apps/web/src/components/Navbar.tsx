import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Flame, LogOut, MessageCircle, Settings, User } from 'lucide-react';
import {
  authService,
  clearApiCache,
  matchService,
  messageService,
  profileService,
} from '../services/api';

type NavbarProps = {
  sparkCount?: number;
  unreadCount?: number;
  profileName?: string;
  profileEmail?: string;
};

const navLinks = [
  { href: '/discover', label: 'Discover' },
  { href: '/sparks', label: 'Sparks' },
  { href: '/messages', label: 'Messages' },
  { href: '/profile', label: 'Profile' },
];

export default function Navbar({
  sparkCount = 0,
  unreadCount = 0,
  profileName = 'Your profile',
  profileEmail = '',
}: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeDropdowns = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', closeDropdowns);
    return () => document.removeEventListener('mousedown', closeDropdowns);
  }, []);

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearApiCache();
    navigate('/login');
  };

  const prefetchRoute = (href: string) => {
    if (!localStorage.getItem('token')) return;
    void authService.getMe().catch(() => undefined);

    if (href === '/discover') {
      void profileService.getMe().catch(() => undefined);
      void profileService.getCandidates(20).catch(() => undefined);
      void matchService.getAll().catch(() => undefined);
    }
    if (href === '/sparks') {
      void matchService.getAll().catch(() => undefined);
    }
    if (href === '/messages') {
      void messageService.getConversations().catch(() => undefined);
    }
    if (href === '/profile') {
      void profileService.getMe().catch(() => undefined);
    }
  };

  const totalNotifs = sparkCount + unreadCount;
  const initial = profileName.trim().charAt(0).toUpperCase() || 'B';

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link to="/discover" className="flex items-center gap-2 no-underline">
          <Flame className="h-6 w-6 text-orange-500" fill="currentColor" />
          <span className="text-lg font-extrabold tracking-tight text-gray-900">Blowtorch</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => {
            const active =
              location.pathname === href ||
              (href === '/sparks' && location.pathname === '/matches');
            const badge = label === 'Sparks' ? sparkCount : label === 'Messages' ? unreadCount : 0;
            return (
              <Link
                key={href}
                to={href}
                onFocus={() => prefetchRoute(href)}
                onMouseEnter={() => prefetchRoute(href)}
                className={`relative px-4 py-5 text-sm font-semibold transition-colors ${
                  active ? 'text-orange-500' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {label}
                  {badge > 0 && (
                    <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white btn-ignite">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-orange-500" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setBellOpen((open) => !open);
                setAvatarOpen(false);
              }}
              className="relative rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {totalNotifs > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white btn-ignite">
                  {totalNotifs > 9 ? '9+' : totalNotifs}
                </span>
              )}
            </button>
            {bellOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  <Link
                    to="/sparks"
                    onClick={() => setBellOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <Flame className="mt-0.5 h-4 w-4 text-orange-500" fill="currentColor" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">
                        {sparkCount} mutual {sparkCount === 1 ? 'spark' : 'sparks'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">Pulled from your matches</p>
                    </div>
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setBellOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    <MessageCircle className="mt-0.5 h-4 w-4 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">
                        {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">Based on your conversations</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div ref={avatarRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setAvatarOpen((open) => !open);
                setBellOpen(false);
              }}
              className="group flex items-center gap-1.5 rounded-full focus:outline-none"
              aria-label="Profile menu"
            >
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-bold text-white ring-2 ring-orange-200 transition-all group-hover:ring-orange-400">
                {initial}
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
                  avatarOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {avatarOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl">
                <div className="mb-1 border-b border-gray-100 px-4 py-2.5">
                  <p className="text-sm font-bold text-gray-900">{profileName}</p>
                  {profileEmail && <p className="truncate text-xs text-gray-400">{profileEmail}</p>}
                </div>
                <Link
                  to="/profile"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  View Profile
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setAvatarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                </Link>
                <div className="mt-1 border-t border-gray-100 pt-1">
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
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
