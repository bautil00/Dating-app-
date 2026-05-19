import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="auth-container">
      <div className="logo">
        <h1>♡</h1>
        <h1>BLOWTORCH</h1>
      </div>
      <p className="tagline">Find your perfect match</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="switch-link">
        Don't have an account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}
