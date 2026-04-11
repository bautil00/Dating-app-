import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { matchService } from '../services/api'

export default function Matches() {
  const [matches, setMatches] = useState<any[]>([])

  useEffect(() => {
    matchService.getAll()
      .then(res => setMatches(res.data))
      .catch(console.error)
  }, [])

  const handleAccept = async (id: number) => {
    try {
      await matchService.accept(id)
      setMatches(matches.map(m => m.id === id ? { ...m, status: 'accepted' } : m))
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (id: number) => {
    try {
      await matchService.reject(id)
      setMatches(matches.map(m => m.id === id ? { ...m, status: 'rejected' } : m))
    } catch (err) {
      console.error(err)
    }
  }

  const pending = matches.filter(m => m.status === 'pending')
  const accepted = matches.filter(m => m.status === 'accepted')

  return (
    <div className="matches-page">
      <h1>Your Matches</h1>

      {pending.length > 0 && (
        <section>
          <h2>Pending</h2>
          {pending.map(match => (
            <div key={match.id} className="match-card pending">
              <span>User #{match.sender_id === match.receiver_id ? 'you' : match.sender_id}</span>
              <div className="actions">
                <button onClick={() => handleAccept(match.id)}>Accept</button>
                <button onClick={() => handleReject(match.id)}>Reject</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {accepted.length > 0 && (
        <section>
          <h2>Active Matches</h2>
          {accepted.map(match => (
            <Link key={match.id} to={`/chat/${match.sender_id === match.receiver_id ? match.sender_id : match.sender_id}`} className="match-card">
              <span>Match #{match.id}</span>
              <span>Chat →</span>
            </Link>
          ))}
        </section>
      )}

      {matches.length === 0 && <p>No matches yet. Keep swiping!</p>}
    </div>
  )
}
