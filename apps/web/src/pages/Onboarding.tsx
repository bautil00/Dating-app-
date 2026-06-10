import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Plus, X } from 'lucide-react';
import { authService, profileService, userFacingError } from '../services/api';
import LocationSearch from '../components/LocationSearch';
import { dataUrlForFile } from '../lib/images';
import { convertHeightInput, heightInputToInches, type HeightUnit } from '../lib/units';

type Step = 'interests' | 'about' | 'story' | 'photos';

type InterestOption = {
  label: string;
  value: string;
};

const STEPS: Step[] = ['interests', 'about', 'story', 'photos'];

const INTEREST_OPTIONS: InterestOption[] = [
  { label: 'Tech / AI', value: 'programming' },
  { label: 'Music', value: 'music' },
  { label: 'Fitness', value: 'gym' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Art', value: 'art' },
  { label: 'Photography', value: 'photography' },
  { label: 'Sports', value: 'sports' },
  { label: 'Books', value: 'books reading' },
  { label: 'Movies', value: 'movie' },
  { label: 'Nature', value: 'nature' },
  { label: 'Swimming', value: 'swimming' },
  { label: 'Writing', value: 'writing' },
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non binary' },
];

const SEEKING_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Everyone', value: 'everyone' },
];

const KIDS_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const PARTNER_KIDS_OPTIONS = [
  { label: 'Any', value: 'any' },
  { label: 'Has kids', value: 'yes' },
  { label: 'No kids', value: 'no' },
];

const PROFILE_EDITOR_NUDGE_KEY = 'blowtorch.profileEditorNudge';

const HEIGHT_UNIT_OPTIONS: { label: string; value: HeightUnit }[] = [
  { label: 'in', value: 'in' },
  { label: 'cm', value: 'cm' },
];

function Logo() {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      <span className="text-2xl font-black tracking-tight text-orange-500">Blowtorch</span>
      <Flame className="h-6 w-6 text-orange-500" fill="currentColor" />
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const index = STEPS.indexOf(step);
  return (
    <div className="mb-8 w-full">
      <div className="mb-2 flex gap-2">
        {STEPS.map((item, itemIndex) => (
          <div
            key={item}
            className={`h-1 flex-1 rounded-full transition-all ${
              itemIndex <= index ? 'btn-ignite' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-gray-400">
        Step {index + 1} of {STEPS.length}
      </p>
    </div>
  );
}

function ContinueButton({
  children = 'Continue',
  disabled,
  loading,
  onClick,
}: {
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition-all duration-200 ${
        disabled || loading
          ? 'cursor-not-allowed bg-gray-200 text-gray-400'
          : 'btn-ignite text-white shadow-md hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]'
      }`}
    >
      {loading ? 'Saving...' : children}
    </button>
  );
}

function Pill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border-2 px-4 py-2 text-sm font-medium transition-all ${
        selected
          ? 'border-orange-500 bg-orange-50 text-orange-600'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function QuizShell({ step, children }: { step: Step; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo />
        <Progress step={step} />
        {children}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState<Step>('interests');
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [seekingGender, setSeekingGender] = useState('');
  const [kids, setKids] = useState('');
  const [preferredKids, setPreferredKids] = useState('any');
  const [preferredMinHeight, setPreferredMinHeight] = useState('');
  const [preferredMaxHeight, setPreferredMaxHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('in');
  const [age, setAge] = useState(25);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    authService
      .getMe()
      .then((res) => setEmail(String(res.data?.email || '')))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const toggleInterest = (value: string) => {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const addPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = Array.from(event.target.files || []).slice(0, 3 - photos.length);
    try {
      const dataUrls = await Promise.all(files.map(dataUrlForFile));
      setPhotos((prev) => [...prev, ...dataUrls].slice(0, 3));
    } catch {
      setError('Could not load that photo. Try a different image.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const changeHeightUnit = (nextUnit: HeightUnit) => {
    if (nextUnit === heightUnit) return;
    setPreferredMinHeight((prev) => convertHeightInput(prev, heightUnit, nextUnit));
    setPreferredMaxHeight((prev) => convertHeightInput(prev, heightUnit, nextUnit));
    setHeightUnit(nextUnit);
  };

  const saveProfile = async () => {
    if (!photos.length) return;
    setSaving(true);
    setError('');
    try {
      const fallbackName = email ? email.split('@')[0] : 'New User';
      await profileService.create({
        display_name: fallbackName,
        age,
        gender,
        interests,
        seeking_gender: seekingGender,
        bio,
        kids: kids === 'yes' ? true : kids === 'no' ? false : null,
        preferred_kids: preferredKids,
        preferred_min_height: heightInputToInches(preferredMinHeight, heightUnit),
        preferred_max_height: heightInputToInches(preferredMaxHeight, heightUnit),
        location: latitude,
        location_name: locationName,
        latitude,
        longitude,
        profile_image_url: photos[0],
        max_distance_km: 50,
      });
      localStorage.setItem(PROFILE_EDITOR_NUDGE_KEY, '1');
      navigate('/discover');
    } catch (err: unknown) {
      setError(userFacingError(err, 'Could not finish onboarding. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (step === 'interests') {
    return (
      <QuizShell step={step}>
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Spark your connections</h1>
          <p className="mt-1 text-sm text-orange-500">
            Find people who share your interests instantly
          </p>
        </div>

        <p className="mb-1 font-semibold text-gray-800">What ignites your passion?</p>
        <p className="mb-4 text-xs text-gray-400">Select at least 3 interests</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={interests.includes(option.value)}
              onClick={() => toggleInterest(option.value)}
            />
          ))}
        </div>

        <p className="mb-6 text-center text-sm text-gray-400">{interests.length}/3 selected</p>

        <ContinueButton disabled={interests.length < 3} onClick={() => setStep('about')} />
      </QuizShell>
    );
  }

  if (step === 'about') {
    const canContinue = Boolean(
      gender && seekingGender && locationName && latitude !== null && longitude !== null,
    );
    return (
      <QuizShell step={step}>
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">About you</h1>
          <p className="mt-1 text-sm text-orange-500">Help us find your perfect match</p>
        </div>

        <p className="mb-2 text-sm font-semibold text-gray-700">I am</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={gender === option.value}
              onClick={() => setGender(option.value)}
            />
          ))}
        </div>

        <p className="mb-2 text-sm font-semibold text-gray-700">Interested in</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {SEEKING_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={seekingGender === option.value}
              onClick={() => setSeekingGender(option.value)}
            />
          ))}
        </div>

        <p className="mb-2 text-sm font-semibold text-gray-700">Age: {age}</p>
        <input
          type="range"
          min={18}
          max={60}
          value={age}
          onChange={(event) => setAge(Number(event.target.value))}
          className="mb-5 w-full accent-orange-500"
        />

        <p className="mb-2 text-sm font-semibold text-gray-700">I have kids</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {KIDS_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={kids === option.value}
              onClick={() => setKids(option.value)}
            />
          ))}
        </div>

        <p className="mb-2 text-sm font-semibold text-gray-700">Partner kids</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {PARTNER_KIDS_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              label={option.label}
              selected={preferredKids === option.value}
              onClick={() => setPreferredKids(option.value)}
            />
          ))}
        </div>

        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-700">Preferred height range</p>
          <select
            aria-label="Preferred height unit"
            value={heightUnit}
            onChange={(event) => changeHeightUnit(event.target.value as HeightUnit)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600 outline-none transition-colors hover:bg-gray-100 focus:border-orange-400 focus:bg-white"
          >
            {HEIGHT_UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={preferredMinHeight}
            onChange={(event) => setPreferredMinHeight(event.target.value)}
            placeholder="Min"
            aria-label="Preferred minimum height"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
          />
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={preferredMaxHeight}
            onChange={(event) => setPreferredMaxHeight(event.target.value)}
            placeholder="Max"
            aria-label="Preferred maximum height"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
          />
        </div>

        <LocationSearch
          value={locationName}
          className="mb-6"
          onSelect={(location) => {
            setLocationName(location.location_name);
            setLatitude(location.latitude);
            setLongitude(location.longitude);
          }}
        />

        <ContinueButton disabled={!canContinue} onClick={() => setStep('story')} />
      </QuizShell>
    );
  }

  if (step === 'story') {
    return (
      <QuizShell step={step}>
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Tell your story</h1>
          <p className="mt-1 text-sm text-orange-500">Share what makes you unique</p>
        </div>

        <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          rows={6}
          placeholder="I'm passionate about building things that matter..."
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="mb-2 w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none"
        />
        <p className="mb-6 text-xs text-gray-400">This helps AI find better matches for you</p>

        <ContinueButton onClick={() => setStep('photos')}>Ignite Your Journey</ContinueButton>
      </QuizShell>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4 py-10">
      <div className="w-full max-w-lg text-center">
        <Logo />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Add up to 3 photos</h1>
        <p className="mb-8 text-sm text-gray-400">
          Great photos help AI find your{' '}
          <span className="font-semibold text-gray-600">best matches</span>
        </p>

        <div className="mb-6 grid grid-cols-3 gap-4">
          {[0, 1, 2].map((index) => {
            const photo = photos[index];
            const first = index === 0;
            return (
              <div key={index} className="aspect-[3/4]">
                {photo ? (
                  <div className="relative h-full w-full overflow-hidden rounded-2xl">
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-all hover:bg-black"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className={`flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-all ${
                      first
                        ? 'border-orange-400 bg-orange-50/70 hover:bg-orange-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                    aria-label={first ? 'Add photo (3 max)' : 'Add photo'}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        first ? 'bg-orange-100' : 'bg-gray-100'
                      }`}
                    >
                      <Plus className={`h-5 w-5 ${first ? 'text-orange-500' : 'text-gray-400'}`} />
                    </span>
                    <span
                      className={`text-xs font-medium ${first ? 'text-orange-500' : 'text-gray-400'}`}
                    >
                      Add photo
                      {first && <span className="block text-[10px] opacity-75">(3 max)</span>}
                    </span>
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
          onChange={addPhotos}
        />

        {error && (
          <p className="mb-3 break-words rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <ContinueButton disabled={photos.length === 0} loading={saving} onClick={saveProfile}>
          Continue
        </ContinueButton>
        {photos.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">Add at least one photo to continue</p>
        )}
        <Link
          to="/profile"
          className="mt-5 inline-flex text-sm font-semibold text-gray-500 hover:text-orange-600"
        >
          Use the detailed profile editor instead
        </Link>
      </div>
    </div>
  );
}
