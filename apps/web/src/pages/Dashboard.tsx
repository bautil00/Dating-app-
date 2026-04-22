import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

interface User {
  id: string
  email: string
  user_metadata?: {
    display_name?: string
    bio?: string
    age?: number
    gender?: string
    location?: string
    profile_image_url?: string
  }
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    loadData()
  }, [navigate])

  const loadData = async () => {
    try {
      const [userRes, profileRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/profiles/me').catch(() => ({ data: null }))
      ])
      setUser(userRes.data)
      setProfile(profileRes.data)
      
      if (profileRes.data) {
        const [candidatesRes, matchesRes] = await Promise.all([
          api.get('/profiles/candidates?limit=20'),
          api.get('/matches/').catch(() => ({ data: [] }))
        ])
        setCandidates(candidatesRes.data || [])
        setMatches(matchesRes.data || [])
      }
    } catch (err: any) {
      console.error('Failed to load data:', err)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (candidateId: string) => {
    try {
      const result = await api.post('/matches/', {
        receiver_id: candidateId
      })
      
      if (result.data.matched) {
        alert(`It's a MATCH! You can now chat! 🎉`)
      }
      
      setCandidates(prev =>
        prev.filter(c => String(c.user_id ?? c.id) !== String(candidateId))
      )

      setMatches(prev => {
        const exists = prev.some(
          (m) =>
            String(m.sender_id) === String(result.data.sender_id) &&
            String(m.receiver_id) === String(result.data.receiver_id)
        )
        if (exists) {
          return prev.map((m) =>
            String(m.sender_id) === String(result.data.sender_id) &&
            String(m.receiver_id) === String(result.data.receiver_id)
              ? { ...m, ...result.data }
              : m
          )
        }
        return [result.data, ...prev]
      })
    } catch (err) {
      console.error('Failed to like:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Finding your matches...</p>
      </div>
    )
  }

  const displayName = profile?.Name || profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'There'
  const uniqueMatchCount = user?.id
    ? new Set(
        matches.map((m) =>
          String(m.sender_id) === String(user.id)
            ? String(m.receiver_id)
            : String(m.sender_id)
        )
      ).size
    : matches.length

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="logo-text">♡</span>
          <span className="brand-name">BLOWTORCH</span>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="active">Discover</Link>
          <Link to="/matches">Matches ({uniqueMatchCount})</Link>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <section className="welcome-section">
          <h2>Hey, {displayName}! 👋</h2>
          <p>Here are people you might match with</p>
        </section>

        {!profile ? (
          <div className="profile-prompt">
            <div className="prompt-card">
              <h3>Complete Your Profile</h3>
              <p>Add your details to start matching with people</p>
              <Link to="/profile" className="btn-primary">Create Profile</Link>
            </div>
          </div>
        ) : (
          <section className="candidates-section">
            {candidates.length === 0 ? (
              <div className="empty-state">
                <p>No more profiles to show</p>
                <p className="sub">Check back later for new matches!</p>
              </div>
            ) : (
              <div className="card-grid">
                {candidates.map((candidate: any) => {
                  const name = candidate.Name || candidate.display_name || 'New User'
                  const age = candidate.Age || candidate.age
                  const location = candidate.Location || candidate.location
                  const interests = typeof candidate.interests === 'string'
                    ? candidate.interests.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : Array.isArray(candidate.interests) ? candidate.interests : []
                  const score = candidate.compatibility_score
                  return (
                    <div key={candidate.id || candidate.user_id} className="profile-card">
                      <div className="card-image">
                        <div className="card-image-placeholder">
                          <span className="avatar-initial">{name.charAt(0).toUpperCase()}</span>
                        </div>
                        {score != null && (
                          <div className="compatibility-badge">{Math.round(score)}%</div>
                        )}
                      </div>
                      <div className="card-content">
                        <div className="card-header">
                          <h3>{name}</h3>
                          {age && <span className="age">{age}</span>}
                        </div>
                        {location && <p className="location">{location}</p>}
                        {candidate.bio && <p className="bio">{candidate.bio}</p>}
                        {interests.length > 0 && (
                          <div className="interests">
                            {interests.slice(0, 3).map((interest: string, i: number) => (
                              <span key={i} className="interest-tag">{interest}</span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => handleLike(candidate.user_id || candidate.id)}
                          className="like-btn"
                        >
                          ♡ Like
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}