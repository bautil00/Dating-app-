import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Flame, Pencil } from 'lucide-react';
import { profileService } from '../services/api';
import Navbar from '../components/Navbar';

const ENUMS = {
  gender: ['Male', 'Female', 'Non-Binary', 'Mtf', 'Ftm'],
  interests: [
    'Cars',
    'Music',
    'Art',
    'Movie',
    'Nature',
    'Gaming',
    'Drinking',
    'Smoking',
    'Gym',
    'Partying',
    'Swimming',
    'Sports',
    'Education',
    'Singing',
    'Photography',
    'Writing',
    'Programming',
    'Instruments',
    'Books/Reading',
  ],
  job: [
    'Programmer',
    'Security',
    'Actor',
    'Retail',
    'Business',
    'Entertainer',
    'Athlete',
    'Gamer',
    'Police',
    'Medical',
    'Military',
  ],
  sexual_pref: ['Straight', 'Gay', 'Bisexual', 'Pansexual'],
  pronouns: ['He/Him', 'She/Her', 'They/Them'],
  zodiac: [
    'Capricorn',
    'Aquarius',
    'Pisces',
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
  ],
  education: ['None', 'Diploma', 'Associates', 'Bachelors', 'Masters', 'PhD'],
  relationship_status: ['single', 'taken', 'married'],
  living_status: ['Homeless', 'Alone', 'Parents', 'Family'],
  seeking_gender: ['everyone', 'Male', 'Female', 'Non-Binary'],
};

type FormData = {
  display_name: string;
  age: string;
  gender: string;
  interests: string;
  job: string;
  sexual_pref: string;
  pronouns: string;
  zodiac: string;
  education: string;
  relationship_status: string;
  living_status: string;
  location: string;
  seeking_gender: string;
  max_distance_km: string;
};

const initialForm: FormData = {
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
  seeking_gender: 'everyone',
  max_distance_km: '50',
};

export default function Profile() {
  const [formData, setFormData] = useState<FormData>(initialForm);
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
      const res = await profileService.getMe();
      if (res.data && res.data.is_complete !== false) {
        setFormData({
          display_name: String(res.data.Name || res.data.display_name || ''),
          age: String(res.data.Age || res.data.age || ''),
          gender: String(res.data.gender || ''),
          interests: Array.isArray(res.data.interests)
            ? String(res.data.interests[0] || '')
            : String(res.data.interests || ''),
          job: String(res.data.Job || res.data.job || ''),
          sexual_pref: String(res.data['sexual pref'] || res.data.sexual_pref || ''),
          pronouns: String(res.data['pro-nouns'] || res.data.pronouns || ''),
          zodiac: String(res.data.Zodiac || res.data.zodiac || ''),
          education: String(res.data.education || ''),
          relationship_status: String(res.data.relationship || res.data.relationship_status || ''),
          living_status: String(res.data.living || res.data.living_status || ''),
          location: String(res.data.Location || res.data.location || ''),
          seeking_gender: String(res.data.seeking_gender || 'everyone'),
          max_distance_km: String(res.data.max_distance_km || '50'),
        });
      }
    } catch {
      setFormData(initialForm);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await profileService.create({
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
        max_distance_km: formData.max_distance_km ? parseInt(formData.max_distance_km, 10) : 50,
      });
      setMessage('Profile saved.');
      window.setTimeout(() => navigate('/discover'), 1000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setMessage(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const renderSelect = (
    name: keyof FormData,
    label: string,
    options: string[],
    required = false,
  ) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <select
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required={required}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  const initial = formData.display_name.charAt(0).toUpperCase() || 'B';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar profileName={formData.display_name || 'Your profile'} />

      <main className="mx-auto flex max-w-5xl gap-5 px-6 py-8">
        <aside className="hidden w-52 flex-shrink-0 md:block">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {['Basic Info', 'About You', 'Preferences'].map((section, index) => (
              <button
                type="button"
                key={section}
                className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium ${
                  index === 0 ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs shadow-sm">
                  {index + 1}
                </span>
                {section}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your Profile</h1>
              <p className="text-sm text-gray-400">These fields feed discovery and matching.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-xl border border-gray-200 p-2 text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700"
                aria-label="Edit profile"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6">
            <section className="space-y-5">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-3xl font-bold text-white shadow-lg">
                    {initial}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-500 shadow-md"
                    aria-label="Profile photo"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h2 className="text-lg font-bold text-gray-900">Basic Info</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FieldText
                  label="Display Name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="What should we call you?"
                  required
                />
                <FieldText
                  label="Age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Age"
                  required
                  min="18"
                  max="100"
                />
                {renderSelect('gender', 'Gender', ENUMS.gender, true)}
                {renderSelect('pronouns', 'Pronouns', ENUMS.pronouns)}
                {renderSelect('zodiac', 'Zodiac', ENUMS.zodiac)}
                <FieldText
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City or latitude"
                />
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">About You</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {renderSelect('interests', 'Interest', ENUMS.interests, true)}
                {renderSelect('job', 'Job', ENUMS.job)}
                {renderSelect('education', 'Education', ENUMS.education)}
                {renderSelect('relationship_status', 'Relationship', ENUMS.relationship_status)}
                {renderSelect('living_status', 'Living Status', ENUMS.living_status)}
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {renderSelect('sexual_pref', 'Orientation', ENUMS.sexual_pref)}
                {renderSelect('seeking_gender', 'Interested in', ENUMS.seeking_gender)}
                <FieldText
                  label="Max Distance (km)"
                  name="max_distance_km"
                  type="number"
                  value={formData.max_distance_km}
                  onChange={handleChange}
                  min="1"
                  max="500"
                />
              </div>
            </section>

            {message && (
              <p
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  message.includes('Failed')
                    ? 'bg-red-50 text-red-600'
                    : 'bg-orange-50 text-orange-700'
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-60 btn-ignite"
            >
              <Check className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        <aside className="hidden w-60 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" fill="currentColor" />
              <h3 className="text-sm font-bold text-gray-900">Matching Data</h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Profile values are saved to Supabase through the API and used by candidate scoring,
              compatibility, and matching.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

function FieldText({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  min,
  max,
}: {
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50"
      />
    </div>
  );
}
