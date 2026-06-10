import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Flame, Pencil, Trash2, X } from 'lucide-react';
import { authService, clearApiCache, profileService, userFacingError } from '../services/api';
import Navbar from '../components/Navbar';
import LocationSearch from '../components/LocationSearch';
import { dataUrlForFile } from '../lib/images';
import {
  convertDistanceInput,
  convertHeightInput,
  convertWeightInput,
  distanceFromKm,
  distanceInputToKm,
  heightFromInches,
  heightInputToInches,
  weightFromPounds,
  weightInputToPounds,
  type DistanceUnit,
  type HeightUnit,
  type WeightUnit,
} from '../lib/units';

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
  any: 'Any',
  'non binary': 'Non-Binary',
  mtf: 'Mtf',
  ftm: 'Ftm',
  'he him': 'He/Him',
  'she her': 'She/Her',
  'they them': 'They/Them',
  'books reading': 'Books/Reading',
  phd: 'PhD',
  in: 'in',
  cm: 'cm',
  lb: 'lb',
  kg: 'kg',
  km: 'km',
  mi: 'mi',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thur: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const HEIGHT_UNIT_OPTIONS = [
  { value: 'in', label: 'in' },
  { value: 'cm', label: 'cm' },
] as const;

const WEIGHT_UNIT_OPTIONS = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
] as const;

const DISTANCE_UNIT_OPTIONS = [
  { value: 'km', label: 'km' },
  { value: 'mi', label: 'mi' },
] as const;

type UnitPreferences = {
  height: HeightUnit;
  weight: WeightUnit;
  distance: DistanceUnit;
};

const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  height: 'in',
  weight: 'lb',
  distance: 'km',
};

const PROFILE_UNIT_STORAGE_KEY = 'blowtorch.profile.units';

function readStoredUnitPreferences(): UnitPreferences {
  try {
    const raw = localStorage.getItem(PROFILE_UNIT_STORAGE_KEY);
    if (!raw) return DEFAULT_UNIT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UnitPreferences>;
    return {
      height: parsed.height === 'cm' || parsed.height === 'in' ? parsed.height : 'in',
      weight: parsed.weight === 'kg' || parsed.weight === 'lb' ? parsed.weight : 'lb',
      distance: parsed.distance === 'mi' || parsed.distance === 'km' ? parsed.distance : 'km',
    };
  } catch {
    return DEFAULT_UNIT_PREFERENCES;
  }
}

function storeUnitPreferences(units: UnitPreferences) {
  try {
    localStorage.setItem(PROFILE_UNIT_STORAGE_KEY, JSON.stringify(units));
  } catch {
    // Unit preferences are a client convenience; saving the profile should not depend on them.
  }
}

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
  preferred_min_height: string;
  preferred_max_height: string;
  preferred_kids: string;
  profile_image_url: string;
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
  preferred_min_height: '',
  preferred_max_height: '',
  preferred_kids: 'any',
  profile_image_url: '',
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
  const [units, setUnits] = useState<UnitPreferences>(readStoredUnitPreferences);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [navigate]);

  useEffect(() => {
    storeUnitPreferences(units);
  }, [units]);

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
          height: heightFromInches(res.data.height, units.height),
          weight: weightFromPounds(res.data.weight, units.weight),
          mbti: normalizeOption(res.data.mbti || res.data.personality_type),
          languages: normalizeOptionArray(res.data.languages),
          availability: normalizeOptionArray(res.data.availability),
          time_availability: normalizeOptionArray(res.data.time_availability),
          kids: boolField(res.data.kids),
          pets: boolField(res.data.pets),
          drives: boolField(res.data.drives),
          seeking_gender: normalizeOption(res.data.seeking_gender || 'everyone'),
          max_distance_km: distanceFromKm(res.data.max_distance_km ?? 50, units.distance),
          preferred_min_height: heightFromInches(res.data.preferred_min_height, units.height),
          preferred_max_height: heightFromInches(res.data.preferred_max_height, units.height),
          preferred_kids: normalizeOption(res.data.preferred_kids || 'any'),
          profile_image_url: String(
            res.data.profile_image_url ||
              res.data.avatar_url ||
              res.data.photo_url ||
              res.data.image_url ||
              '',
          ),
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

  const handleHeightUnitChange = (nextUnit: HeightUnit) => {
    if (nextUnit === units.height) return;
    setFormData((prev) => ({
      ...prev,
      height: convertHeightInput(prev.height, units.height, nextUnit),
      preferred_min_height: convertHeightInput(prev.preferred_min_height, units.height, nextUnit),
      preferred_max_height: convertHeightInput(prev.preferred_max_height, units.height, nextUnit),
    }));
    setUnits((prev) => ({ ...prev, height: nextUnit }));
  };

  const handleWeightUnitChange = (nextUnit: WeightUnit) => {
    if (nextUnit === units.weight) return;
    setFormData((prev) => ({
      ...prev,
      weight: convertWeightInput(prev.weight, units.weight, nextUnit),
    }));
    setUnits((prev) => ({ ...prev, weight: nextUnit }));
  };

  const handleDistanceUnitChange = (nextUnit: DistanceUnit) => {
    if (nextUnit === units.distance) return;
    setFormData((prev) => ({
      ...prev,
      max_distance_km: convertDistanceInput(prev.max_distance_km, units.distance, nextUnit),
    }));
    setUnits((prev) => ({ ...prev, distance: nextUnit }));
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

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('');
    try {
      const imageUrl = await dataUrlForFile(file);
      setFormData((prev) => ({ ...prev, profile_image_url: imageUrl }));
      setMessage('Profile photo ready. Save profile to keep it.');
    } catch {
      setMessage('Failed to load profile photo. Try a different image.');
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
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
        height: heightInputToInches(formData.height, units.height),
        weight: weightInputToPounds(formData.weight, units.weight),
        kids: boolPayload(formData.kids),
        pets: boolPayload(formData.pets),
        drives: boolPayload(formData.drives),
        max_distance_km: distanceInputToKm(formData.max_distance_km, units.distance) ?? 50,
        preferred_min_height: heightInputToInches(formData.preferred_min_height, units.height),
        preferred_max_height: heightInputToInches(formData.preferred_max_height, units.height),
        preferred_kids: formData.preferred_kids || 'any',
      });
      setMessage('Profile saved.');
      window.setTimeout(() => navigate('/discover'), 1000);
    } catch (error: unknown) {
      setMessage(userFacingError(error, 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'This permanently deletes your account, profile, matches, and messages. Continue?',
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessage('');
    try {
      await authService.deleteAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      clearApiCache();
      navigate('/register');
    } catch (error: unknown) {
      setMessage(userFacingError(error, 'Failed to delete account'));
    } finally {
      setDeleting(false);
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
  const profileImageUrl = formData.profile_image_url;
  const errorMessage = /failed|could not|try again/i.test(message);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar
        profileName={formData.display_name || 'Your profile'}
        profileImageUrl={profileImageUrl}
      />

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
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-3xl font-bold text-white shadow-lg">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-500 shadow-md"
                    aria-label={profileImageUrl ? 'Change profile photo' : 'Upload profile photo'}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  {profileImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, profile_image_url: '' }))}
                      className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/80 text-white shadow-md"
                      aria-label="Remove profile photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
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
                  step="any"
                  unitOptions={HEIGHT_UNIT_OPTIONS}
                  unitValue={units.height}
                  onUnitChange={(value) => handleHeightUnitChange(value as HeightUnit)}
                />
                <FieldText
                  label="Weight"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Weight"
                  step="any"
                  unitOptions={WEIGHT_UNIT_OPTIONS}
                  unitValue={units.weight}
                  onUnitChange={(value) => handleWeightUnitChange(value as WeightUnit)}
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
                {renderSelect('kids', 'Has Kids', ['yes', 'no'])}
                {renderSelect('pets', 'Has Pets', ['yes', 'no'])}
                {renderSelect('drives', 'Drives', ['yes', 'no'])}
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
                {renderSelect('preferred_kids', 'Partner Kids', ['any', 'yes', 'no'])}
                <FieldText
                  label="Max Distance"
                  name="max_distance_km"
                  type="number"
                  value={formData.max_distance_km}
                  onChange={handleChange}
                  min="1"
                  max={units.distance === 'mi' ? '311' : '500'}
                  step="any"
                  unitOptions={DISTANCE_UNIT_OPTIONS}
                  unitValue={units.distance}
                  onUnitChange={(value) => handleDistanceUnitChange(value as DistanceUnit)}
                />
                <FieldText
                  label="Preferred Min Height"
                  name="preferred_min_height"
                  type="number"
                  value={formData.preferred_min_height}
                  onChange={handleChange}
                  placeholder="No minimum"
                  step="any"
                  unitOptions={HEIGHT_UNIT_OPTIONS}
                  unitValue={units.height}
                  onUnitChange={(value) => handleHeightUnitChange(value as HeightUnit)}
                />
                <FieldText
                  label="Preferred Max Height"
                  name="preferred_max_height"
                  type="number"
                  value={formData.preferred_max_height}
                  onChange={handleChange}
                  placeholder="No maximum"
                  step="any"
                  unitOptions={HEIGHT_UNIT_OPTIONS}
                  unitValue={units.height}
                  onUnitChange={(value) => handleHeightUnitChange(value as HeightUnit)}
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
                  errorMessage ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-700'
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || deleting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white disabled:opacity-60 btn-ignite"
            >
              <Check className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>

            <div className="border-t border-gray-100 pt-5">
              <button
                type="button"
                disabled={saving || deleting}
                onClick={handleDeleteAccount}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
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
  step,
  unitOptions,
  unitValue,
  onUnitChange,
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
  step?: string;
  unitOptions?: readonly { value: string; label: string }[];
  unitValue?: string;
  onUnitChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-all focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-50">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        {unitOptions && unitValue && onUnitChange && (
          <select
            aria-label={`${label} unit`}
            value={unitValue}
            onChange={(event) => onUnitChange(event.target.value)}
            className="border-l border-gray-100 bg-gray-50 px-2 text-xs font-semibold text-gray-600 outline-none transition-colors hover:bg-gray-100 focus:bg-white"
          >
            {unitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
