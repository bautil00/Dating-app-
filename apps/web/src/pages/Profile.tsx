import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Flame, Pencil } from 'lucide-react';
import { profileService, userFacingError } from '../services/api';
import Navbar from '../components/Navbar';
import LocationSearch from '../components/LocationSearch';

const ENUMS = {
  gender: ['male', 'female', 'non binary', 'mtf', 'ftm'],
  interests: [
    'cars',
    'music',
    'art',
    'movie',
    'nature',
    'gaming',
    'drinking',
    'smoking',
    'gym',
    'partying',
    'swimming',
    'sports',
    'education',
    'singing',
    'photography',
    'writing',
    'programming',
    'instruments',
    'books reading',
  ],
  job: [
    'programmer',
    'security',
    'actor',
    'retail',
    'business',
    'entertainer',
    'athlete',
    'gamer',
    'police',
    'medical',
    'military',
  ],
  sexual_pref: ['straight', 'gay', 'bisexual', 'pansexual'],
  pronouns: ['he him', 'she her', 'they them'],
  zodiac: [
    'capricorn',
    'aquarius',
    'pisces',
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
  ],
  education: ['none', 'diploma', 'associates', 'bachelors', 'masters', 'phd'],
  relationship_status: ['single', 'taken', 'married'],
  living_status: ['homeless', 'alone', 'parents', 'family'],
  seeking_gender: ['everyone', 'male', 'female', 'non binary'],
  mbti: [
    'intj',
    'intp',
    'entj',
    'entp',
    'infj',
    'infp',
    'enfj',
    'enfp',
    'istj',
    'isfj',
    'estj',
    'esfj',
    'istp',
    'isfp',
    'estp',
    'esfp',
  ],
  languages: ['english', 'spanish', 'chinese', 'korean', 'japanese', 'french', 'german'],
  availability: ['mon', 'tue', 'wed', 'thur', 'fri', 'sat', 'sun'],
  time_availability: [
    '1-3am',
    '3-5am',
    '5-7am',
    '7-9am',
    '9-11am',
    '11am-1pm',
    '1-3pm',
    '3-5pm',
    '5-7pm',
    '7-9pm',
    '9-11pm',
    '11pm-1am',
  ],
};

const LABELS: Record<string, string> = {
  'non binary': 'Non-Binary',
  mtf: 'Mtf',
  ftm: 'Ftm',
  'he him': 'He/Him',
  'she her': 'She/Her',
  'they them': 'They/Them',
  'books reading': 'Books/Reading',
  phd: 'PhD',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thur: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

type FormData = {
  display_name: string;
  bio: string;
  age: string;
  gender: string;
  interests: string[];
  job: string;
  sexual_pref: string;
  pronouns: string;
  zodiac: string;
  education: string;
  relationship_status: string;
  living_status: string;
  location_name: string;
  latitude: string;
  longitude: string;
  height: string;
  weight: string;
  mbti: string;
  languages: string[];
  availability: string[];
  time_availability: string[];
  kids: string;
  pets: string;
  drives: string;
  seeking_gender: string;
  max_distance_km: string;
};

const initialForm: FormData = {
  display_name: '',
  bio: '',
  age: '',
  gender: '',
  interests: [],
  job: '',
  sexual_pref: '',
  pronouns: '',
  zodiac: '',
  education: '',
  relationship_status: '',
  living_status: '',
  location_name: '',
  latitude: '',
  longitude: '',
  height: '',
  weight: '',
  mbti: '',
  languages: [],
  availability: [],
  time_availability: [],
  kids: '',
  pets: '',
  drives: '',
  seeking_gender: 'everyone',
  max_distance_km: '50',
};

function optionLabel(value: string) {
  if (LABELS[value]) return LABELS[value];
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeOption(value: unknown) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\//g, ' ');
  if (normalized === 'swmiming') return 'swimming';
  if (normalized === 'thu') return 'thur';
  return normalized;
}

function normalizeOptionArray(value: unknown) {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return values.map(normalizeOption).filter(Boolean);
}

function boolField(value: unknown) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  if (value === 'yes' || value === 'no') return value;
  return '';
}

function boolPayload(value: string) {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

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
          bio: String(res.data.bio || ''),
          age: String(res.data.Age || res.data.age || ''),
          gender: normalizeOption(res.data.gender),
          interests: normalizeOptionArray(res.data.interests),
          job: normalizeOption(res.data.Job || res.data.job),
          sexual_pref: normalizeOption(res.data['sexual pref'] || res.data.sexual_pref),
          pronouns: normalizeOption(res.data['pro-nouns'] || res.data.pronouns),
          zodiac: normalizeOption(res.data.Zodiac || res.data.zodiac),
          education: normalizeOption(res.data.education),
          relationship_status: normalizeOption(
            res.data.relationship || res.data.relationship_status,
          ),
          living_status: normalizeOption(res.data.living || res.data.living_status),
          location_name: String(
            res.data.location_name || res.data.Location || res.data.location || '',
          ),
          latitude: String(res.data.latitude || ''),
          longitude: String(res.data.longitude || ''),
          height: String(res.data.height || ''),
          weight: String(res.data.weight || ''),
          mbti: normalizeOption(res.data.mbti || res.data.personality_type),
          languages: normalizeOptionArray(res.data.languages),
          availability: normalizeOptionArray(res.data.availability),
          time_availability: normalizeOptionArray(res.data.time_availability),
          kids: boolField(res.data.kids),
          pets: boolField(res.data.pets),
          drives: boolField(res.data.drives),
          seeking_gender: normalizeOption(res.data.seeking_gender || 'everyone'),
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

  const handleTextAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const toggleArrayValue = (name: keyof FormData, value: string) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[name]) ? (prev[name] as string[]) : [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [name]: next };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await profileService.create({
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
        location: formData.latitude ? parseFloat(formData.latitude) : null,
        location_name: formData.location_name || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight, 10) : null,
        kids: boolPayload(formData.kids),
        pets: boolPayload(formData.pets),
        drives: boolPayload(formData.drives),
        max_distance_km: formData.max_distance_km ? parseInt(formData.max_distance_km, 10) : 50,
      });
      setMessage('Profile saved.');
      window.setTimeout(() => navigate('/discover'), 1000);
    } catch (error: unknown) {
      setMessage(userFacingError(error, 'Failed to save profile'));
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
        value={String(formData[name] || '')}
        onChange={handleChange}
        required={required}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );

  const renderMultiSelect = (name: keyof FormData, label: string, options: string[]) => {
    const selected = Array.isArray(formData[name]) ? (formData[name] as string[]) : [];
    return (
      <div className="space-y-2 md:col-span-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </label>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                type="button"
                key={option}
                onClick={() => toggleArrayValue(name, option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-orange-200 hover:text-orange-600'
                }`}
                aria-pressed={active}
              >
                {optionLabel(option)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const initial = formData.display_name.charAt(0).toUpperCase() || 'B';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar profileName={formData.display_name || 'Your profile'} />

      <main className="mx-auto flex max-w-5xl gap-5 px-6 py-8">
        <aside className="hidden w-52 flex-shrink-0 md:block">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {['Basic Info', 'About You', 'Preferences', 'Schedule'].map((section, index) => (
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
                {renderSelect('mbti', 'MBTI', ENUMS.mbti)}
                <LocationSearch
                  value={formData.location_name}
                  onSelect={(location) =>
                    setFormData((prev) => ({
                      ...prev,
                      location_name: location.location_name,
                      latitude: location.latitude === null ? '' : String(location.latitude),
                      longitude: location.longitude === null ? '' : String(location.longitude),
                    }))
                  }
                />
                <FieldText
                  label="Height"
                  name="height"
                  type="number"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="Height"
                />
                <FieldText
                  label="Weight"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Weight"
                />
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">About You</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {renderMultiSelect('interests', 'Interests', ENUMS.interests)}
                {renderSelect('job', 'Job', ENUMS.job)}
                {renderSelect('education', 'Education', ENUMS.education)}
                {renderSelect('relationship_status', 'Relationship', ENUMS.relationship_status)}
                {renderSelect('living_status', 'Living Status', ENUMS.living_status)}
                {renderMultiSelect('languages', 'Languages', ENUMS.languages)}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleTextAreaChange}
                    rows={3}
                    placeholder="A short intro for your profile"
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Preferences</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {renderSelect('sexual_pref', 'Orientation', ENUMS.sexual_pref)}
                {renderSelect('seeking_gender', 'Interested in', ENUMS.seeking_gender)}
                {renderSelect('kids', 'Has Kids', ['yes', 'no'])}
                {renderSelect('pets', 'Has Pets', ['yes', 'no'])}
                {renderSelect('drives', 'Drives', ['yes', 'no'])}
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

            <section className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Schedule</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {renderMultiSelect('availability', 'Available Days', ENUMS.availability)}
                {renderMultiSelect(
                  'time_availability',
                  'Available Time Windows',
                  ENUMS.time_availability,
                )}
              </div>
            </section>

            {message && (
              <p
                className={`break-words rounded-xl px-3 py-2 text-sm font-medium leading-relaxed ${
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
