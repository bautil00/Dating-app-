import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    try {
      await authService.register(email, password)
      const loginRes = await authService.login(email, password)
      localStorage.setItem('token', loginRes.data.access_token)
      window.location.href = '/dashboard'
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      setError(err.response?.data?.detail || 'Registration failed')
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
      setError('Failed to initiate Google registration.')
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
          <p className="eyebrow">Start matching</p>
          <h1>Spark your connections.</h1>
          <p>Create an account, complete your profile, and let the matching engine find compatible people.</p>
          <div className="auth-benefits">
            <span>🔥 AI-powered matching</span>
            <span>🧭 Preference-based discovery</span>
            <span>🔒 Private profile data</span>
          </div>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          <div className="logo">
            <h1>🔥</h1>
            <h1>BLOWTORCH</h1>
          </div>
          <p className="tagline">Create your account</p>

          <button type="button" onClick={handleGoogleLogin} disabled={loading} className="google-btn">
            Sign Up with Google
          </button>

          <div className="auth-divider">
            <span>or create with email</span>
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
              <label htmlFor="register-password">Password</label>
              <div className="password-field">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(prev => !prev)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <label>
              <span>Confirm password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </label>

            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="switch-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
