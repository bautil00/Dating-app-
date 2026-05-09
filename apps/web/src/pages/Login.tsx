import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authService.login(email, password)
      localStorage.setItem('token', res.data.access_token)
      window.location.href = '/dashboard'
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await authService.getGoogleUrl()
      window.location.href = res.data.url
    } catch (error: unknown) {
      setError('Failed to initiate Google login.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-split">
      <aside className="auth-fire-panel">
        <div className="auth-brand">
          <span className="brand-flame">🔥</span>
          <span>Blowtorch</span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Keep the spark alive.</h1>
          <p>Find your perfect match with AI-powered discovery, real profiles, and live matching.</p>
          <div className="auth-benefits">
            <span>🔥 Your matches are waiting</span>
            <span>💬 Pick up real conversations</span>
            <span>✨ Better recommendations every time</span>
          </div>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          <div className="logo">
            <h1>🔥</h1>
            <h1>BLOWTORCH</h1>
          </div>
          <p className="tagline">Find your perfect match</p>

          <button type="button" onClick={handleGoogleLogin} disabled={loading} className="google-btn">
            Sign In with Google
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(prev => !prev)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="switch-link">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
