import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Pencil, X } from 'lucide-react';
import { profileService, userFacingError } from '../services/api';
import Navbar from '../components/Navbar';

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
  seeking_gender: ['male', 'female', 'non binary', 'everyone'],
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
  languages: [
    'english',
    'spanish',
    'french',
    'german',
    'chinese',
    'japanese',
    'russian',
    'italian',
    'hebrew',
    'asl',
    'other',
  ],
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
  body: ['slim', 'average', 'large', 'muscular'],
  color: ['black', 'white', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'grey', 'brown'],
  race: [
    'asian',
    'black',
    'white',
    'latino',
    'middle eastern',
    'mixed',
    'native american',
    'south asian',
  ],
  nationality: [
    'british',
    'american',
    'german',
    'french',
    'mexican',
    'canadian',
    'chinese',
    'japanese',
    'polish',
    'russian',
    'brazilian',
    'cuban',
    'other',
  ],
  body_modification: ['none', 'makeup', 'scars', 'piercings', 'freckles', 'facial hair'],
  socials: ['discord', 'facebook', 'instagram', 'whatsapp', 'messenger', 'twitter', 'snapchat'],
};

const LABELS: Record<string, string> = {
  'non binary': 'Non-binary',
  mtf: 'MTF',
  ftm: 'FTM',
  'he him': 'he/him',
  'she her': 'she/her',
  'they them': 'they/them',
  'books reading': 'Books & Reading',
  phd: 'PhD',
  mbti: 'MBTI',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thur: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
  asl: 'ASL',
};

const ENUM_VALUES = new Set(Object.values(ENUMS).flat());

const SECTIONS = [
  { key: 'about', label: 'About You', emoji: '👤', subtitle: 'Tell others what makes you unique' },
  { key: 'identity', label: 'Identity', emoji: '🏳️‍🌈', subtitle: 'How you show up on Blowtorch' },
  { key: 'lifestyle', label: 'Lifestyle', emoji: '🌤️', subtitle: 'Daily life and availability' },
  { key: 'preferences', label: 'Preferences', emoji: '❤️', subtitle: 'Who you want to meet' },
  { key: 'personality', label: 'Personality', emoji: '🧠', subtitle: 'Compatibility signals' },
  { key: 'appearance', label: 'Appearance', emoji: '✨', subtitle: 'Optional profile details' },
  { key: 'socials', label: 'Socials', emoji: '🔗', subtitle: 'Languages and social platforms' },
  { key: 'account', label: 'Account', emoji: '⚙️', subtitle: 'Core account information' },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

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
  location: string;
  height: string;
  weight: string;
  body: string;
  hair_color: string;
  eye_color: string;
  race: string;
  nationality: string;
  glasses: boolean;
  body_modification: string[];
  mbti: string;
  languages: string[];
  socials: string[];
  availability: string[];
  time_availability: string[];
  kids: boolean;
  pets: boolean;
  drives: boolean;
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
  location: '',
  height: '',
  weight: '',
  body: '',
  hair_color: '',
  eye_color: '',
  race: '',
  nationality: '',
  glasses: false,
  body_modification: [],
  mbti: '',
  languages: [],
  socials: [],
  availability: [],
  time_availability: [],
  kids: false,
  pets: false,
  drives: false,
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
  if (normalized === 'books & reading') return 'books reading';
  return normalized;
}

function normalizeOptionArray(value: unknown) {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return values.map(normalizeOption).filter(Boolean);
}

function boolValue(value: unknown) {
  if (value === true || value === 'true' || value === 'yes') return true;
  return false;
}

function fieldValue(profile: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = profile[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function profileToForm(profile: Record<string, unknown>): FormData {
  return {
    display_name: String(fieldValue(profile, 'Name', 'name', 'display_name')),
    bio: String(fieldValue(profile, 'bio', 'Bio')),
    age: String(fieldValue(profile, 'Age', 'age')),
    gender: normalizeOption(fieldValue(profile, 'gender')),
    interests: normalizeOptionArray(fieldValue(profile, 'interests')),
    job: normalizeOption(fieldValue(profile, 'Job', 'job')),
    sexual_pref: normalizeOption(fieldValue(profile, 'sexual pref', 'sexual_pref')),
    pronouns: normalizeOption(fieldValue(profile, 'pro-nouns', 'pronouns')),
    zodiac: normalizeOption(fieldValue(profile, 'Zodiac', 'zodiac')),
    education: normalizeOption(fieldValue(profile, 'education')),
    relationship_status: normalizeOption(
      fieldValue(profile, 'relationship', 'relationship_status'),
    ),
    living_status: normalizeOption(fieldValue(profile, 'living', 'living_status')),
    location: String(fieldValue(profile, 'Location', 'location')),
    height: String(fieldValue(profile, 'height')),
    weight: String(fieldValue(profile, 'weight')),
    body: normalizeOption(fieldValue(profile, 'body')),
    hair_color: normalizeOption(fieldValue(profile, 'hair_color')),
    eye_color: normalizeOption(fieldValue(profile, 'eye_color')),
    race: normalizeOption(fieldValue(profile, 'race', 'ethnicity')),
    nationality: normalizeOption(fieldValue(profile, 'nationality')),
    glasses: boolValue(fieldValue(profile, 'glasses')),
    body_modification: normalizeOptionArray(fieldValue(profile, 'body_modification')),
    mbti: normalizeOption(fieldValue(profile, 'mbti', 'personality_type')),
    languages: normalizeOptionArray(fieldValue(profile, 'languages')),
    socials: normalizeOptionArray(fieldValue(profile, 'socials')),
    availability: normalizeOptionArray(fieldValue(profile, 'availability')),
    time_availability: normalizeOptionArray(fieldValue(profile, 'time_availability')),
    kids: boolValue(fieldValue(profile, 'kids')),
    pets: boolValue(fieldValue(profile, 'pets')),
    drives: boolValue(fieldValue(profile, 'drives')),
    seeking_gender: normalizeOption(fieldValue(profile, 'seeking_gender')) || 'everyone',
    max_distance_km: String(fieldValue(profile, 'max_distance_km') || '50'),
  };
}

function toPayload(data: FormData) {
  return {
    ...data,
    age: data.age ? parseInt(data.age, 10) : null,
    height: data.height ? parseFloat(data.height) : null,
    weight: data.weight ? parseFloat(data.weight) : null,
    max_distance_km: data.max_distance_km ? parseInt(data.max_distance_km, 10) : 50,
  };
}

function displayValue(value: string | boolean | string[]) {
  if (Array.isArray(value)) return value.length ? value.map(optionLabel).join(', ') : '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value ? (ENUM_VALUES.has(value) ? optionLabel(value) : value) : '—';
}

export default function Profile() {
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [draft, setDraft] = useState<FormData>(initialForm);
  const [active, setActive] = useState<SectionKey>('about');
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
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
        const loaded = profileToForm(res.data);
        setFormData(loaded);
        setDraft(loaded);
        setEditing(false);
      } else {
        setEditing(true);
      }
    } catch {
      setFormData(initialForm);
      setDraft(initialForm);
      setEditing(true);
    }
  };

  const setDraftField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const startEdit = () => {
    setDraft(formData);
    setMessage('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(formData);
    setMessage('');
    setEditing(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await profileService.create(toPayload(draft));
      setFormData(draft);
      setEditing(false);
      setMessage('Profile saved.');
    } catch (error: unknown) {
      setMessage(userFacingError(error, 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(event.target.files ?? [])
      .slice(0, 6 - photos.length)
      .forEach((file) => setPhotos((prev) => [...prev, URL.createObjectURL(file)]));
    if (inputRef.current) inputRef.current.value = '';
  };

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  const current = editing ? draft : formData;
  const activeSection = SECTIONS.find((section) => section.key === active) || SECTIONS[0];
  const initial = current.display_name.charAt(0).toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar profileName={formData.display_name || 'Your profile'} />

      <div className="mx-auto flex max-w-5xl gap-5 px-6 py-8">
        <aside className="hidden w-52 flex-shrink-0 md:block">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {SECTIONS.map(({ key, label, emoji }) => {
              const isActive = active === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    setActive(key);
                    setEditing(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 font-semibold text-orange-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{activeSection.label}</h2>
                <p className="mt-0.5 text-sm text-gray-400">{activeSection.subtitle}</p>
              </div>
              {!editing ? (
                <button
                  type="button"
                  onClick={startEdit}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-orange-400 px-4 py-2 text-sm font-semibold text-orange-500 transition-all hover:bg-orange-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-60 btn-ignite"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <EditSection active={active} data={draft} setField={setDraftField} />
            ) : (
              <ViewSection active={active} data={formData} initial={initial} />
            )}

            {message && (
              <p
                className={`mt-5 break-words rounded-xl px-3 py-2 text-sm font-medium leading-relaxed ${
                  message.includes('Failed')
                    ? 'bg-red-50 text-red-600'
                    : 'bg-orange-50 text-orange-700'
                }`}
              >
                {message}
              </p>
            )}
          </form>
        </main>

        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-gray-900">Your Photos</h3>
            <div className="space-y-3">
              {[0, 1].map((index) => {
                const photo = photos[index];
                return (
                  <div
                    key={index}
                    className="relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40"
                  >
                    {photo ? (
                      <>
                        <img src={photo} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 transition-colors hover:text-orange-400"
                      >
                        <Camera className="h-8 w-8" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={addPhoto}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ViewSection({
  active,
  data,
  initial,
}: {
  active: SectionKey;
  data: FormData;
  initial: string;
}) {
  if (active === 'about') {
    return (
      <div className="space-y-5">
        <div className="mb-2 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
            <span className="text-3xl font-bold text-white">{initial}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ViewField label="Name" value={data.display_name} />
          <ViewField label="Age" value={data.age} />
        </div>
        <ViewField label="Bio" value={data.bio} />
        <PillView label="Your Interests" values={data.interests} />
        <div className="grid grid-cols-2 gap-4">
          <ViewField label="Job" value={data.job} />
          <ViewField label="Education" value={data.education} />
        </div>
        <ViewField label="Location" value={data.location} />
      </div>
    );
  }

  if (active === 'identity') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <ViewField label="Gender" value={data.gender} />
        <ViewField label="Pronouns" value={data.pronouns} />
        <ViewField label="Sexual Preference" value={data.sexual_pref} />
        <ViewField label="Relationship Status" value={data.relationship_status} />
        <ViewField label="Nationality" value={data.nationality} />
        <ViewField label="Ethnicity" value={data.race} />
        <ViewField label="MBTI" value={data.mbti} />
        <ViewField label="Zodiac" value={data.zodiac} />
      </div>
    );
  }

  if (active === 'lifestyle') {
    return (
      <div className="space-y-4">
        <ViewField label="Living Situation" value={data.living_status} />
        <PillView label="Availability" values={data.availability} />
        <PillView label="Time Availability" values={data.time_availability} />
        <div className="grid grid-cols-3 gap-4">
          <ViewField label="Has Kids" value={data.kids} />
          <ViewField label="Has Pets" value={data.pets} />
          <ViewField label="Drives" value={data.drives} />
        </div>
      </div>
    );
  }

  if (active === 'preferences') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <ViewField label="Seeking" value={data.seeking_gender} />
        <ViewField label="Max Distance (km)" value={data.max_distance_km} />
      </div>
    );
  }

  if (active === 'personality') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <ViewField label="MBTI" value={data.mbti} />
        <ViewField label="Zodiac" value={data.zodiac} />
      </div>
    );
  }

  if (active === 'appearance') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <ViewField label="Height (cm)" value={data.height} />
          <ViewField label="Weight (kg)" value={data.weight} />
          <ViewField label="Body Type" value={data.body} />
          <ViewField label="Hair Color" value={data.hair_color} />
          <ViewField label="Eye Color" value={data.eye_color} />
          <ViewField label="Glasses" value={data.glasses} />
        </div>
        <PillView label="Body Modifications" values={data.body_modification} />
      </div>
    );
  }

  if (active === 'socials') {
    return (
      <div className="space-y-4">
        <PillView label="Platforms" values={data.socials} />
        <PillView label="Languages" values={data.languages} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ViewField label="Display Name" value={data.display_name} />
      <ViewField label="Location" value={data.location} />
    </div>
  );
}

function EditSection({
  active,
  data,
  setField,
}: {
  active: SectionKey;
  data: FormData;
  setField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}) {
  if (active === 'about') {
    return (
      <div className="space-y-4">
        <div className="mb-2 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
            <span className="text-3xl font-bold text-white">
              {data.display_name.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FieldText
            label="Name"
            value={data.display_name}
            onChange={(v) => setField('display_name', v)}
          />
          <FieldText
            label="Age"
            value={data.age}
            onChange={(v) => setField('age', v)}
            type="number"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bio</label>
          <textarea
            rows={3}
            maxLength={300}
            value={data.bio}
            onChange={(event) => setField('bio', event.target.value)}
            placeholder="Tell others what makes you unique…"
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50"
          />
          <p className="text-right text-xs text-gray-400">{data.bio.length}/300</p>
        </div>
        <FieldMultiPill
          label="Your Interests"
          value={data.interests}
          options={ENUMS.interests}
          onChange={(v) => setField('interests', v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <FieldSelect
            label="Job"
            value={data.job}
            options={ENUMS.job}
            onChange={(v) => setField('job', v)}
          />
          <FieldSelect
            label="Education"
            value={data.education}
            options={ENUMS.education}
            onChange={(v) => setField('education', v)}
          />
        </div>
        <FieldText
          label="Location"
          value={data.location}
          onChange={(v) => setField('location', v)}
          placeholder="e.g. Seattle, WA"
        />
      </div>
    );
  }

  if (active === 'identity') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <FieldSelect
          label="Gender"
          value={data.gender}
          options={ENUMS.gender}
          onChange={(v) => setField('gender', v)}
        />
        <FieldSelect
          label="Pronouns"
          value={data.pronouns}
          options={ENUMS.pronouns}
          onChange={(v) => setField('pronouns', v)}
        />
        <FieldSelect
          label="Sexual Preference"
          value={data.sexual_pref}
          options={ENUMS.sexual_pref}
          onChange={(v) => setField('sexual_pref', v)}
        />
        <FieldSelect
          label="Relationship Status"
          value={data.relationship_status}
          options={ENUMS.relationship_status}
          onChange={(v) => setField('relationship_status', v)}
        />
        <FieldSelect
          label="Nationality"
          value={data.nationality}
          options={ENUMS.nationality}
          onChange={(v) => setField('nationality', v)}
        />
        <FieldSelect
          label="Ethnicity"
          value={data.race}
          options={ENUMS.race}
          onChange={(v) => setField('race', v)}
        />
        <FieldSelect
          label="MBTI"
          value={data.mbti}
          options={ENUMS.mbti}
          onChange={(v) => setField('mbti', v)}
        />
        <FieldSelect
          label="Zodiac"
          value={data.zodiac}
          options={ENUMS.zodiac}
          onChange={(v) => setField('zodiac', v)}
        />
      </div>
    );
  }

  if (active === 'lifestyle') {
    return (
      <div className="space-y-4">
        <FieldSelect
          label="Living Situation"
          value={data.living_status}
          options={ENUMS.living_status}
          onChange={(v) => setField('living_status', v)}
        />
        <FieldMultiPill
          label="Availability"
          value={data.availability}
          options={ENUMS.availability}
          onChange={(v) => setField('availability', v)}
        />
        <FieldMultiPill
          label="Time Availability"
          value={data.time_availability}
          options={ENUMS.time_availability}
          onChange={(v) => setField('time_availability', v)}
        />
        <div className="divide-y divide-gray-100 rounded-xl bg-gray-50 px-4 py-2">
          <FieldToggle label="Has Kids" value={data.kids} onChange={(v) => setField('kids', v)} />
          <FieldToggle label="Has Pets" value={data.pets} onChange={(v) => setField('pets', v)} />
          <FieldToggle label="Drives" value={data.drives} onChange={(v) => setField('drives', v)} />
        </div>
      </div>
    );
  }

  if (active === 'preferences') {
    return (
      <div className="space-y-4">
        <FieldSelect
          label="Seeking"
          value={data.seeking_gender}
          options={ENUMS.seeking_gender}
          onChange={(v) => setField('seeking_gender', v)}
        />
        <FieldText
          label="Max Distance (km)"
          value={data.max_distance_km}
          onChange={(v) => setField('max_distance_km', v)}
          type="number"
          placeholder="50"
        />
      </div>
    );
  }

  if (active === 'personality') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <FieldSelect
          label="MBTI"
          value={data.mbti}
          options={ENUMS.mbti}
          onChange={(v) => setField('mbti', v)}
        />
        <FieldSelect
          label="Zodiac"
          value={data.zodiac}
          options={ENUMS.zodiac}
          onChange={(v) => setField('zodiac', v)}
        />
      </div>
    );
  }

  if (active === 'appearance') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldText
            label="Height (cm)"
            value={data.height}
            onChange={(v) => setField('height', v)}
            type="number"
          />
          <FieldText
            label="Weight (kg)"
            value={data.weight}
            onChange={(v) => setField('weight', v)}
            type="number"
          />
          <FieldSelect
            label="Body Type"
            value={data.body}
            options={ENUMS.body}
            onChange={(v) => setField('body', v)}
          />
          <FieldSelect
            label="Hair Color"
            value={data.hair_color}
            options={ENUMS.color}
            onChange={(v) => setField('hair_color', v)}
          />
          <FieldSelect
            label="Eye Color"
            value={data.eye_color}
            options={ENUMS.color}
            onChange={(v) => setField('eye_color', v)}
          />
        </div>
        <div className="rounded-xl bg-gray-50 px-4 py-2">
          <FieldToggle
            label="Wears Glasses"
            value={data.glasses}
            onChange={(v) => setField('glasses', v)}
          />
        </div>
        <FieldMultiPill
          label="Body Modifications"
          value={data.body_modification}
          options={ENUMS.body_modification}
          onChange={(v) => setField('body_modification', v)}
        />
      </div>
    );
  }

  if (active === 'socials') {
    return (
      <div className="space-y-4">
        <FieldMultiPill
          label="Social Platforms"
          value={data.socials}
          options={ENUMS.socials}
          onChange={(v) => setField('socials', v)}
        />
        <FieldMultiPill
          label="Languages"
          value={data.languages}
          options={ENUMS.languages}
          onChange={(v) => setField('languages', v)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FieldText
        label="Display Name"
        value={data.display_name}
        onChange={(v) => setField('display_name', v)}
      />
      <FieldText
        label="Location"
        value={data.location}
        onChange={(v) => setField('location', v)}
        placeholder="City, Country"
      />
    </div>
  );
}

function ViewField({ label, value }: { label: string; value: string | boolean | string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-800">
        {displayValue(value)}
      </div>
    </div>
  );
}

function PillView({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600"
            >
              {optionLabel(value)}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      )}
    </div>
  );
}

function FieldText({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50"
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50"
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function FieldMultiPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option);
          return (
            <button
              type="button"
              key={option}
              onClick={() => toggle(option)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'border-orange-400 bg-orange-50 text-orange-600'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
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
}

function FieldToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-10 rounded-full transition-all duration-200 ${
          value ? 'bg-orange-500' : 'bg-gray-200'
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
            value ? 'left-5' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
