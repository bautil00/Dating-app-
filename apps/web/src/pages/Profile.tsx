import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileService } from '../services/api'

export default function Profile() {
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    age: '',
    gender: '',
    location: '',
    profile_image_url: '',
    interests: '',
  })
  const navigate = useNavigate()

  useEffect(() => {
    profileService.getMe()
      .then(res => {
        const d = res.data
        setFormData({
          display_name: d.display_name || '',
          bio: d.bio || '',
          age: d.age || '',
          gender: d.gender || '',
          location: d.location || '',
          profile_image_url: d.profile_image_url || '',
          interests: d.interests || '',
        })
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await profileService.create(formData)
      navigate('/dashboard')
    } catch (err: any) {
      if (err.response?.status === 400) {
        await profileService.update(formData)
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="profile-page">
      <h1>Your Profile</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Display Name"
          value={formData.display_name}
          onChange={e => setFormData({ ...formData, display_name: e.target.value })}
        />
        <textarea
          placeholder="Bio"
          value={formData.bio}
          onChange={e => setFormData({ ...formData, bio: e.target.value })}
        />
        <input
          type="number"
          placeholder="Age"
          value={formData.age}
          onChange={e => setFormData({ ...formData, age: e.target.value })}
        />
        <select
          value={formData.gender}
          onChange={e => setFormData({ ...formData, gender: e.target.value })}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          placeholder="Location"
          value={formData.location}
          onChange={e => setFormData({ ...formData, location: e.target.value })}
        />
        <input
          type="url"
          placeholder="Profile Image URL"
          value={formData.profile_image_url}
          onChange={e => setFormData({ ...formData, profile_image_url: e.target.value })}
        />
        <input
          type="text"
          placeholder="Interests (comma-separated)"
          value={formData.interests}
          onChange={e => setFormData({ ...formData, interests: e.target.value })}
        />
        <button type="submit">Save Profile</button>
      </form>
    </div>
  )
}
