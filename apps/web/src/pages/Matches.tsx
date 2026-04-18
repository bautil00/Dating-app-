import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Matches() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      const res = await api.get('/matches/')
      setMatches(res.data || [])
    } catch (err) {
      console.error('Failed to load matches:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (matchId: string) => {
    try {
      await api.patch(`/matches/${matchId}/accept`)
      setMatches(matches.map(m => 
        m.id === matchId ? { ...m, status: 'accepted' } : m
      ))
    } catch (err) {
      console.error('Failed to accept:', err)
    }
  }

  const handleReject = async (matchId: string) => {
    try {
      await api.patch(`/matches/${matchId}/reject`)
      setMatches(matches.filter(m => m.id !== matchId))
    } catch (err) {
      console.error('Failed to reject:', err)
    }
  }

  const pending = matches.filter(m => m.status === 'pending')
  const accepted = matches.filter(m => m.status === 'accepted')

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="matches-page">
      <nav className="navbar">
        <Link to="/dashboard" className="back-btn">← Back</Link>
        <h1>Your Matches</h1>
        <div></div>
      </nav>

      <main className="matches-content">
        {matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <h2>No matches yet</h2>
            <p>Start liking profiles to get matches!</p>
            <Link to="/dashboard" className="btn-primary">Discover People</Link>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="matches-section">
                <h2>Pending Requests</h2>
                <div className="matches-list">
                  {pending.map(match => (
                    <div key={match.id} className="match-card pending">
                      <div className="match-info">
                        <span className="match-name">User #{match.sender_id}</span>
                        <span className="match-time">
                          {new Date(match.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="match-actions">
                        <button 
                          onClick={() => handleAccept(match.id)}
                          className="accept-btn"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleReject(match.id)}
                          className="reject-btn"
                        >
                          Pass
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {accepted.length > 0 && (
              <section className="matches-section">
                <h2>Your Matches</h2>
                <div className="matches-list">
                  {accepted.map(match => (
                    <Link 
                      key={match.id} 
                      to={`/chat/${match.sender_id === match.receiver_id ? match.sender_id : match.sender_id}`}
                      className="match-card accepted"
                    >
                      <div className="match-avatar">
                        <span>♡</span>
                      </div>
                      <div className="match-info">
                        <span className="match-name">Match #{match.id}</span>
                        <span className="match-status">Click to chat</span>
                      </div>
                      <span className="chat-arrow">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}