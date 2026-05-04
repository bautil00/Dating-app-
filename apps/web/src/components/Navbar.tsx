import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const linkClass = (path: string) =>
    `text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
      pathname === path
        ? 'bg-orange-500/20 text-orange-400'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] shadow-lg">
      <Link to="/discover" className="flex items-center gap-2 no-underline">
        <span className="text-2xl">🔥</span>
        <span className="text-white font-extrabold tracking-widest text-lg">BLOWTORCH</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link to="/discover" className={linkClass('/discover')}>
          Discover
        </Link>
        <Link to="/matches" className={linkClass('/matches')}>
          Matches
        </Link>
        <Link to="/profile" className={linkClass('/profile')}>
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className="ml-2 text-sm font-medium px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
