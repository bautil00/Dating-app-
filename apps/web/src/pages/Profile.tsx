import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

type SelectOption = {
  label: string;
  value: string;
};

const option = (label: string, value: string): SelectOption => ({ label, value });

const ENUMS = {
  gender: [
    option('Male', 'male'),
    option('Female', 'female'),
    option('Non-Binary', 'non binary'),
    option('Mtf', 'mtf'),
    option('Ftm', 'ftm'),
  ],
  interests: [
    option('Cars', 'cars'),
    option('Music', 'music'),
    option('Art', 'art'),
    option('Movie', 'movie'),
    option('Nature', 'nature'),
    option('Gaming', 'gaming'),
    option('Drinking', 'drinking'),
    option('Smoking', 'smoking'),
    option('Gym', 'gym'),
    option('Partying', 'partying'),
    option('Swimming', 'swmiming'),
    option('Sports', 'sports'),
    option('Education', 'education'),
    option('Singing', 'singing'),
    option('Photography', 'photography'),
    option('Writing', 'writing'),
    option('Programming', 'programming'),
    option('Instruments', 'instruments'),
    option('Books/Reading', 'books reading'),
  ],
  job: [
    option('Programmer', 'programmer'),
    option('Security', 'security'),
    option('Actor', 'actor'),
    option('Retail', 'retail'),
    option('Business', 'business'),
    option('Entertainer', 'entertainer'),
    option('Athlete', 'athlete'),
    option('Gamer', 'gamer'),
    option('Police', 'police'),
    option('Medical', 'medical'),
    option('Military', 'military'),
  ],
  sexual_pref: [
    option('Straight', 'straight'),
    option('Gay', 'gay'),
    option('Bisexual', 'bisexual'),
    option('Pansexual', 'pansexual'),
  ],
  pronouns: [
    option('He/Him', 'he him'),
    option('She/Her', 'she her'),
    option('They/Them', 'they them'),
  ],
  zodiac: [
    option('Capricorn', 'capricorn'),
    option('Aquarius', 'aquarius'),
    option('Pisces', 'pisces'),
    option('Aries', 'aries'),
    option('Taurus', 'taurus'),
    option('Gemini', 'gemini'),
    option('Cancer', 'cancer'),
    option('Leo', 'leo'),
    option('Virgo', 'virgo'),
    option('Libra', 'libra'),
    option('Scorpio', 'scorpio'),
    option('Sagittarius', 'sagittarius'),
  ],
  education: [
    option('None', 'none'),
    option('Diploma', 'diploma'),
    option('Associates', 'associates'),
    option('Bachelors', 'bachelors'),
    option('Masters', 'masters'),
    option('PhD', 'phd'),
  ],
  relationship_status: [
    option('Single', 'single'),
    option('Taken', 'taken'),
    option('Married', 'married'),
  ],
  living_status: [
    option('Homeless', 'homeless'),
    option('Alone', 'alone'),
    option('Parents', 'parents'),
    option('Family', 'family'),
  ],
};

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
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const res = await api.get('/profiles/me');
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
        });
      }
    } catch (err) {
      console.log('No profile yet');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/profiles/', {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        max_distance_km: formData.max_distance_km ? parseInt(formData.max_distance_km) : 50,
      });
      setMessage('Profile saved!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setMessage(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const renderSelect = (name: string, label: string, options: SelectOption[], required = false) => (
    <div className="form-group">
      <label>{label}</label>
      <select
        name={name}
        value={(formData as Record<string, string | number>)[name]}
        onChange={handleChange}
        required={required}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

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
        <section className="profile-hero">
          <div className="profile-avatar">
            <span>{(formData.display_name || 'B').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="eyebrow">Profile setup</p>
            <h2>{formData.display_name || 'Your Blowtorch profile'}</h2>
            <p>Keep your profile complete so the matching engine can rank better candidates.</p>
          </div>
        </section>

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
                required
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
                  placeholder="Age"
                  min="18"
                  max="100"
                  required
                />
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
                <select
                  name="seeking_gender"
                  value={formData.seeking_gender}
                  onChange={handleChange}
                >
                  <option value="everyone">Everyone</option>
                  <option value="Male">Men</option>
                  <option value="Female">Women</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location (latitude)</label>
                <input
                  type="number"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. 47.6"
                  step="0.0001"
                />
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

          {message && (
            <p className={`form-message ${message.includes('Failed') ? 'error' : ''}`}>{message}</p>
          )}
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </main>
    </div>
  );
}
