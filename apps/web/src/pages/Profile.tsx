import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Profile() {
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    age: '',
    gender: '',
    location: '',
    profile_image_url: '',
    interests: '',
    seeking_gender: '',
    max_distance_km: '50'
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    loadProfile()
  }, [navigate])

  const loadProfile = async () => {
    try {
      const res = await api.get('/profiles/me')
      if (res.data && res.data.is_complete !== false) {
        setFormData({
          display_name: res.data.Name || res.data.display_name || '',
          bio: res.data.bio || '',
          age: res.data.Age || res.data.age || '',
          gender: res.data.gender || '',
          location: res.data.Location || res.data.location || '',
          profile_image_url: res.data.profile_image_url || '',
          interests: res.data.interests || '',
          seeking_gender: res.data.seeking_gender || '',
          max_distance_km: res.data.max_distance_km || '50'
        })
      }
    } catch (err) {
      console.log('No profile yet')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const dataToSend = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        max_distance_km: formData.max_distance_km ? parseInt(formData.max_distance_km) : 50,
        interests: formData.interests,
      }

      await api.post('/profiles/', dataToSend)
      setMessage('Profile saved!')
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-page">
      <nav className="navbar">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>Your Profile</h1>
        <div></div>
      </nav>

      <main className="profile-content">
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h2>Basic Info</h2>
            
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="What should we call you?"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Your age"
                  min="18"
                  max="100"
                />
              </div>
              
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State"
              />
            </div>

            <div className="form-group">
              <label>Profile Image URL</label>
              <input
                type="url"
                name="profile_image_url"
                value={formData.profile_image_url}
                onChange={handleChange}
                placeholder="https://example.com/your-photo.jpg"
              />
              {formData.profile_image_url && (
                <img 
                  src={formData.profile_image_url} 
                  alt="Preview" 
                  className="image-preview"
                />
              )}
            </div>
          </div>

          <div className="form-section">
            <h2>About You</h2>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Interests (comma separated)</label>
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="hiking, cooking, photography, music"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Preferences</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Interested in</label>
                <select name="seeking_gender" value={formData.seeking_gender} onChange={handleChange}>
                  <option value="everyone">Everyone</option>
                  <option value="male">Men</option>
                  <option value="female">Women</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Max Distance (km)</label>
                <input
                  type="number"
                  name="max_distance_km"
                  value={formData.max_distance_km}
                  onChange={handleChange}
                  min="1"
                  max="500"
                />
              </div>
            </div>
          </div>

          {message && <p className="form-message">{message}</p>}
          
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </main>
    </div>
  )
}