import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const ENUMS = {
  gender: ['Male', 'Female', 'Non-Binary', 'Mtf', 'Ftm'],
  interests: ['Cars', 'Music', 'Art', 'Movie', 'Nature', 'Gaming', 'Drinking', 'Smoking', 'Gym', 'Partying', 'Swimming', 'Sports', 'Education', 'Singing', 'Photography', 'Writing', 'Programming', 'Instruments', 'Books/Reading'],
  job: ['Programmer', 'Security', 'Actor', 'Retail', 'Business', 'Entertainer', 'Athlete', 'Gamer', 'Police', 'Medical', 'Military'],
  sexual_pref: ['Straight', 'Gay', 'Bisexual', 'Pansexual'],
  pronouns: ['He/Him', 'She/Her', 'They/Them'],
  zodiac: ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'],
  education: ['None', 'Diploma', 'Associates', 'Bachelors', 'Masters', 'PhD'],
  relationship_status: ['single', 'taken', 'married'],
  living_status: ['Homeless', 'Alone', 'Parents', 'Family'],
}

export default function Profile() {
  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    gender: '',
    interests: '',
    job: '',
    sexual_pref: '',
    pronouns: '',
    zodiac: '',
    education: '',
    relationship_status: '',
    living_status: '',
    location: '',
    seeking_gender: '',
    max_distance_km: '50',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    loadProfile()
  }, [navigate])

  const loadProfile = async () => {
    try {
      const res = await api.get('/profiles/me')
      if (res.data && res.data.is_complete !== false) {
        setFormData({
          display_name: res.data.Name || res.data.display_name || '',
          age: res.data.Age || res.data.age || '',
          gender: res.data.gender || '',
          interests: res.data.interests || '',
          job: res.data.Job || '',
          sexual_pref: res.data['sexual pref'] || res.data.sexual_pref || '',
          pronouns: res.data['pro-nouns'] || res.data.pronouns || '',
          zodiac: res.data.Zodiac || '',
          education: res.data.education || '',
          relationship_status: res.data.relationship || res.data.relationship_status || '',
          living_status: res.data.living || res.data.living_status || '',
          location: res.data.Location || res.data.location || '',
          seeking_gender: res.data.seeking_gender || '',
          max_distance_km: res.data.max_distance_km || '50',
        })
      }
    } catch (err) {
      console.log('No profile yet')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await api.post('/profiles/', {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        max_distance_km: formData.max_distance_km ? parseInt(formData.max_distance_km) : 50,
      })
      setMessage('Profile saved!')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      setMessage(err.response?.data?.detail || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const renderSelect = (name: string, label: string, options: string[], required = false) => (
    <div className="form-group">
      <label>{label}</label>
      <select name={name} value={(formData as Record<string, string | number>)[name]} onChange={handleChange} required={required}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <div className="profile-page">
      <nav className="navbar">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <h1>Your Profile</h1>
        <div></div>
      </nav>

      <main className="profile-content">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h2>Basic Info</h2>
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} placeholder="What should we call you?" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" min="18" max="100" required />
              </div>
              {renderSelect('gender', 'Gender', ENUMS.gender, true)}
            </div>
            <div className="form-row">
              {renderSelect('pronouns', 'Pronouns', ENUMS.pronouns)}
              {renderSelect('zodiac', 'Zodiac', ENUMS.zodiac)}
            </div>
          </div>

          <div className="form-section">
            <h2>About You</h2>
            <div className="form-row">
              {renderSelect('interests', 'Interest', ENUMS.interests, true)}
              {renderSelect('job', 'Job', ENUMS.job)}
            </div>
            <div className="form-row">
              {renderSelect('education', 'Education', ENUMS.education)}
              {renderSelect('relationship_status', 'Relationship', ENUMS.relationship_status)}
            </div>
            {renderSelect('living_status', 'Living Status', ENUMS.living_status)}
          </div>

          <div className="form-section">
            <h2>Preferences</h2>
            <div className="form-row">
              {renderSelect('sexual_pref', 'Orientation', ENUMS.sexual_pref)}
              <div className="form-group">
                <label>Interested in</label>
                <select name="seeking_gender" value={formData.seeking_gender} onChange={handleChange}>
                  <option value="everyone">Everyone</option>
                  <option value="Male">Men</option>
                  <option value="Female">Women</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location (latitude)</label>
                <input type="number" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. 47.6" step="0.0001" />
              </div>
              <div className="form-group">
                <label>Max Distance (km)</label>
                <input type="number" name="max_distance_km" value={formData.max_distance_km} onChange={handleChange} min="1" max="500" />
              </div>
            </div>
          </div>

          {message && <p className={`form-message ${message.includes('Failed') ? 'error' : ''}`}>{message}</p>}
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </main>
    </div>
  )
}
