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
    } catch (err) {
      console.error('Failed to load data:', err)
      localStorage.removeItem('token')
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (candidateId: string) => {
    try {
      const token = localStorage.getItem('token')
      const result = await api.post('/match/', { 
        candidate_id: candidateId,
        auth_header: `Bearer ${token}`
      })
      
      if (result.data.matched) {
        alert(`It's a MATCH! You can now chat! 🎉`)
      }
      
      setCandidates(candidates.filter(c => c.id !== candidateId))
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

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'There'

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="logo-text">♡</span>
          <span className="brand-name">BLOWTORCH</span>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="active">Discover</Link>
          <Link to="/matches">Matches ({matches.length})</Link>
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
                {candidates.map((candidate: any) => (
                  <div key={candidate.id} className="profile-card">
                    <div className="card-image">
                      <img 
                        src={candidate.profile_image_url || '/default-avatar.png'} 
                        alt={candidate.display_name}
                      />
                    </div>
                    <div className="card-content">
                      <div className="card-header">
                        <h3>{candidate.display_name || 'New User'}</h3>
                        <span className="age">{candidate.age || '?'}</span>
                      </div>
                      <p className="location">📍 {candidate.location || 'Unknown'}</p>
                      <p className="bio">{candidate.bio || 'No bio yet'}</p>
                      <div className="interests">
                        {candidate.interests?.slice(0, 3).map((interest: string, i: number) => (
                          <span key={i} className="interest-tag">{interest}</span>
                        ))}
                      </div>
                      <button 
                        onClick={() => handleLike(candidate.id)}
                        className="like-btn"
                      >
                        ♡ Like
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}