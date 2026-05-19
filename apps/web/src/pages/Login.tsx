import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Flame } from 'lucide-react';
import { authService } from '../services/api';
import GoogleIcon from '../components/GoogleIcon';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.includes('@') && password.length >= 6;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      localStorage.setItem('token', res.data.access_token);
      window.location.href = '/discover';
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const res = await authService.getGoogleUrl();
      const url = res.data?.url || res.data?.authorization_url;
      if (!url) throw new Error('Missing Google authorization URL');
      window.location.href = url;
    } catch {
      setError('Google sign-in is not available right now.');
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="fire-panel hidden flex-col justify-between overflow-hidden px-10 py-10 lg:flex">
        <div className="flex items-center gap-2">
          <Flame className="h-7 w-7 text-orange-500" fill="currentColor" />
          <span className="text-xl font-extrabold text-white">Blowtorch</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-black leading-tight text-white">
            Welcome back to <span className="gradient-text">Blowtorch</span>
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-gray-400">
            Your matches are waiting. Sign in to keep the spark alive.
          </p>
          <div className="space-y-4">
            {[
              {
                label: 'Your matches are waiting',
                sub: 'See who liked you back while you were away',
              },
              { label: 'New conversations', sub: "Don't leave anyone on read too long" },
              { label: 'AI keeps improving', sub: 'The more you use it, the better it gets' },
            ].map(({ label, sub }) => (
              <div key={label} className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div />
      </div>

      <div className="flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Flame className="h-7 w-7 text-orange-500" fill="currentColor" />
            <span className="text-xl font-extrabold text-gray-900">Blowtorch</span>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
            <h2 className="mb-1 text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mb-7 text-sm text-gray-400">Sign in to your account</p>

            <button
              type="button"
              onClick={handleGoogle}
              className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">or sign in with email</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-11 text-sm transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((show) => !show)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition-all duration-200 ${
                  canSubmit && !loading
                    ? 'btn-ignite text-white'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400'
                }`}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-600">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
