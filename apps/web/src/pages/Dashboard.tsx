import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { profileService, matchService } from '../services/api'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])

  useEffect(() => {
    profileService.getMe()
      .then(res => setProfile(res.data))
      .catch(() => setProfile(null))

    matchService.getAll()
      .then(res => setMatches(res.data))
  }, [])

  const handleLike = async (userId: number) => {
    try {
      await matchService.create(userId)
      setCandidates(candidates.filter(c => c.user_id !== userId))
    } catch (err) {
      console.error('Match failed', err)
    }
  }

  if (!profile) {
    return (
      <div className="dashboard">
        <h1>Welcome to BLOWTORCH</h1>
        <p>Create your profile to get started.</p>
        <Link to="/profile" className="btn-primary">Create Profile</Link>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <nav>
        <span>BLOWTORCH</span>
        <Link to="/profile">Profile</Link>
        <Link to="/matches">Matches ({matches.length})</Link>
      </nav>

      <main>
        <section className="candidates-section">
          <h2>Find Your Match</h2>
          <div className="card-grid">
            {candidates.map(candidate => (
              <div key={candidate.id} className="card">
                <img src={candidate.profile_image_url || '/default-avatar.png'} alt="" />
                <h3>{candidate.display_name}</h3>
                <p>{candidate.age} • {candidate.location}</p>
                <p className="bio">{candidate.bio}</p>
                <button onClick={() => handleLike(candidate.user_id)}>Like</button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
