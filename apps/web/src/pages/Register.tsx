import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { authService, clearApiCache, userFacingError } from '../services/api';
import GoogleIcon from '../components/GoogleIcon';

const EMAIL_LOCAL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/i;
const EMAIL_DOMAIN_LABEL_PATTERN = /^[A-Z0-9-]+$/i;

function isValidSignupEmail(value: string) {
  const email = value.trim();
  if (email.length < 3 || email.length > 254 || /\s/.test(email)) return false;
  if ((email.match(/@/g) || []).length !== 1) return false;

  const [local, domain] = email.split('@');
  if (!local || !domain || local.length > 64 || domain.length > 253) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (!EMAIL_LOCAL_PATTERN.test(local)) return false;

  const labels = domain.split('.');
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (
      !label ||
      label.length > 63 ||
      label.startsWith('-') ||
      label.endsWith('-') ||
      !EMAIL_DOMAIN_LABEL_PATTERN.test(label)
    ) {
      return false;
    }
  }

  const topLevelDomain = labels[labels.length - 1];
  return topLevelDomain.length >= 2 && /[A-Z]/i.test(topLevelDomain);
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = isValidSignupEmail(email);
  const showEmailError = email.trim().length > 0 && !emailValid;
  const canSubmit = emailValid && password.length >= 6 && confirmPassword.length >= 6;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!emailValid) {
      setError('Enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.register(normalizedEmail, password);
      const loginRes = await authService.login(normalizedEmail, password);
      localStorage.setItem('token', loginRes.data.access_token);
      clearApiCache();
      window.location.href = '/onboarding';
    } catch (error: unknown) {
      setError(userFacingError(error, 'Registration failed. Check your email and password.'));
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
      setError('Google sign-up is not available right now.');
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
            Spark your connections with <span className="gradient-text">Blowtorch</span>
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-gray-400">
            AI matches you with people who share your vibe and values.
          </p>
          <div className="space-y-4">
            {[
              {
                label: 'AI-powered matching',
                sub: 'Smart algorithms find your perfect connections',
              },
              { label: 'Meaningful connections', sub: 'Quality over quantity, every time' },
              { label: 'Private and secure', sub: 'Your data is protected and never shared' },
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

      <div className="flex items-center justify-center bg-white px-4 py-8 sm:px-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Flame className="h-7 w-7 text-orange-500" fill="currentColor" />
            <span className="text-xl font-extrabold text-gray-900">Blowtorch</span>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl sm:p-8">
            <h2 className="mb-1 text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="mb-7 text-sm text-gray-400">Get started in seconds</p>

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
              <span className="text-xs text-gray-400">or sign up with email</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={showEmailError}
                aria-describedby={showEmailError ? 'register-email-error' : undefined}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
                required
                autoComplete="email"
              />
              {showEmailError && (
                <p id="register-email-error" className="text-xs font-medium text-red-600">
                  Enter a valid email address.
                </p>
              )}
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
                required
                autoComplete="new-password"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
                required
                autoComplete="new-password"
              />

              {error && (
                <p className="break-words rounded-xl bg-red-50 px-3 py-2 text-sm font-medium leading-relaxed text-red-600">
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
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">
                Sign in
              </Link>
            </p>
            <p className="mt-3 text-center text-xs leading-relaxed text-gray-400">
              By continuing, you agree to our{' '}
              <span className="font-semibold text-gray-600">Terms of Service</span> and{' '}
              <span className="font-semibold text-gray-600">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
