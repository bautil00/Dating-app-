import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Matches() {
  const [matches, setMatches] = useState<{ id: number, sender_id: string, receiver_id: string, status: string, created_at: string }[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatches()
    api.get('/auth/me').then(res => setCurrentUserId(res.data.id)).catch(() => {})
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

  const handleAccept = async (matchId: number) => {
    try {
      await api.patch(`/matches/${matchId}/accept`)
      setMatches(prev =>
        prev.map(m => (m.id === matchId ? { ...m, status: 'accepted' } : m))
      )
    } catch (err) {
      console.error('Failed to accept:', err)
    }
  }

  const handleReject = async (matchId: number) => {
    try {
      await api.patch(`/matches/${matchId}/reject`)
      setMatches(prev => prev.filter(m => m.id !== matchId))
    } catch (err) {
      console.error('Failed to reject:', err)
    }
  }

  const pendingIncoming = matches.filter(
    m => m.status === 'pending' && String(m.receiver_id) === String(currentUserId)
  )
  const pendingOutgoing = matches.filter(
    m => m.status === 'pending' && String(m.sender_id) === String(currentUserId)
  )

  const acceptedMap = new Map<string, { id: number, sender_id: string, receiver_id: string, status: string, created_at: string }>()
  matches.forEach((m) => {
    if (m.status !== 'accepted' && m.status !== 'matched') return
    const otherUserId = String(m.sender_id) === String(currentUserId)
      ? String(m.receiver_id)
      : String(m.sender_id)
    if (!acceptedMap.has(otherUserId)) {
      acceptedMap.set(otherUserId, m)
    }
  })
  const accepted = Array.from(acceptedMap.values())
  const totalSparks = accepted.length

  const otherUserId = (match: { sender_id: string, receiver_id: string }) =>
    String(match.sender_id) === String(currentUserId)
      ? String(match.receiver_id)
      : String(match.sender_id)

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
        <h1>Your Sparks</h1>
        <div></div>
      </nav>

      <main className="matches-content">
        <section className="sparks-hero">
          <div>
            <p className="eyebrow">Mutual connections</p>
            <h2>Your Sparks</h2>
            <p>People who liked you back show up here. Open a spark to start chatting.</p>
          </div>
          <div className="sparks-count">
            <span>{totalSparks}</span>
            <small>active</small>
          </div>
        </section>

        {matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔥</div>
            <h2>No matches yet</h2>
            <p>Start liking profiles to get matches!</p>
            <Link to="/dashboard" className="btn-primary">Discover People</Link>
          </div>
        ) : (
          <>
            {pendingIncoming.length > 0 && (
              <section className="matches-section">
                <h2>Pending Requests</h2>
                <div className="matches-list">
                  {pendingIncoming.map(match => (
                    <div key={match.id} className="match-card pending spark-row">
                      <div className="match-avatar">
                        <span>{String(match.sender_id).charAt(0).toUpperCase()}</span>
                      </div>
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

            {pendingOutgoing.length > 0 && (
              <section className="matches-section">
                <h2>Waiting For Response</h2>
                <div className="matches-list">
                  {pendingOutgoing.map(match => (
                    <div key={match.id} className="match-card pending spark-row">
                      <div className="match-avatar waiting">
                        <span>⌛</span>
                      </div>
                      <div className="match-info">
                        <span className="match-name">User #{match.receiver_id}</span>
                        <span className="match-time">
                          Sent {new Date(match.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {accepted.length > 0 && (
              <section className="matches-section">
                <h2>Ready To Message</h2>
                <div className="sparks-grid">
                  {accepted.map(match => (
                    <Link 
                      key={match.id} 
                      to={`/chat/${otherUserId(match)}`}
                      className="spark-card"
                    >
                      <div className="spark-card-image">
                        <span>{otherUserId(match).charAt(0).toUpperCase()}</span>
                        <div className="spark-score">🔥</div>
                      </div>
                      <div className="spark-card-body">
                        <div>
                          <span className="match-name">User #{otherUserId(match)}</span>
                          <span className="match-status">Spark #{match.id}</span>
                        </div>
                        <span className="message-pill">Message</span>
                      </div>
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