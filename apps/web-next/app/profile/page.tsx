"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Camera, X, Pencil, Check } from "lucide-react";

/* ── Enum options from DB ─────────────────────────── */
const ENUMS = {
  pronouns:      ["he/him", "she/her", "they/them"],
  sexual_pref:   ["Straight", "Gay", "Bisexual", "Pansexual"],
  gender:        ["Male", "Female", "Non-binary", "MTF", "FTM"],
  body_type:     ["Slim", "Average", "Large", "Muscular"],
  relationship:  ["Single", "Taken", "Married"],
  ethnicity:     ["Asian", "Black", "White", "Latino", "Middle Eastern", "Mixed", "Native American", "South Asian"],
  interests:     ["Cars", "Music", "Art", "Movie", "Nature", "Gaming", "Drinking", "Smoking", "Gym", "Partying", "Swimming", "Sports", "Education", "Singing", "Photography", "Writing", "Programming", "Instruments", "Books & Reading"],
  job_type:      ["Programmer", "Security", "Actor", "Retail", "Business", "Entertainer", "Athlete", "Gamer", "Police", "Medical", "Military"],
  zodiac:        ["Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"],
  language_type: ["English", "Spanish", "French", "German", "Chinese", "Japanese", "Russian", "Italian", "Hebrew", "ASL", "Other"],
  color_type:    ["Black", "White", "Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Grey", "Brown"],
  nationality:   ["British", "American", "German", "French", "Mexican", "Canadian", "Chinese", "Japanese", "Polish", "Russian", "Brazilian", "Cuban", "Other"],
  education_type:["None", "Diploma", "Associates", "Bachelors", "Masters", "PhD"],
  cosmetics:     ["None", "Makeup", "Scars", "Piercings", "Freckles", "Facial Hair"],
  social_platform:["Discord", "Facebook", "Instagram", "WhatsApp", "Messenger", "Twitter", "Snapchat"],
  living_status: ["Homeless", "Alone", "Parents", "Family"],
  day_type:      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  mbti:          ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESFJ","ESTJ","ISTP","ISFP","ESTP","ESFP"],
  seeking_gender:["Male", "Female", "Non-binary", "Everyone"],
};

/* ── Profile data shape ───────────────────────────── */
type ProfileData = {
  name: string; age: string; bio: string; location: string;
  interests: string[]; job: string; education: string;
  gender: string; pronouns: string; sexual_pref: string;
  relationship: string; nationality: string; ethnicity: string;
  mbti: string; zodiac: string;
  living: string; availability: string[]; kids: boolean; pets: boolean; drives: boolean;
  seeking_gender: string; max_distance_km: string;
  height: string; weight: string; body: string;
  hair_color: string; eye_color: string; glasses: boolean; body_modification: string[];
  socials: string[]; languages: string[];
};

const DEFAULT: ProfileData = {
  name: "Alex Rivera", age: "26", bio: "", location: "",
  interests: ["Music", "AI", "Travel"], job: "Programmer", education: "Bachelors",
  gender: "Male", pronouns: "he/him", sexual_pref: "Straight",
  relationship: "Single", nationality: "American", ethnicity: "Mixed",
  mbti: "ENTP", zodiac: "Leo",
  living: "Alone", availability: [], kids: false, pets: true, drives: true,
  seeking_gender: "Everyone", max_distance_km: "50",
  height: "", weight: "", body: "Average",
  hair_color: "Brown", eye_color: "Brown", glasses: false, body_modification: [],
  socials: ["Instagram"], languages: ["English"],
};

/* ── Sidebar sections ─────────────────────────────── */
const SECTIONS = [
  { key: "about",       label: "About You",   emoji: "👤" },
  { key: "identity",    label: "Identity",    emoji: "🏳️‍🌈" },
  { key: "lifestyle",   label: "Lifestyle",   emoji: "🌤️" },
  { key: "preferences", label: "Preferences", emoji: "❤️" },
  { key: "personality", label: "Personality", emoji: "🧠" },
  { key: "appearance",  label: "Appearance",  emoji: "✨" },
  { key: "socials",     label: "Socials",     emoji: "🔗" },
  { key: "account",     label: "Account",     emoji: "⚙️" },
];

/* ── Reusable field components ────────────────────── */
function ViewField({ label, value }: { label: string; value: string | boolean | string[] }) {
  const display = Array.isArray(value)
    ? value.join(", ") || "—"
    : typeof value === "boolean"
    ? value ? "Yes" : "No"
    : value || "—";
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <div className="px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-800">{display}</div>
    </div>
  );
}

function FieldSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FieldText({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
      />
    </div>
  );
}

function FieldToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700 font-medium">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-6 rounded-full transition-all duration-200 ${value ? "bg-orange-500" : "bg-gray-200"}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${value ? "left-5" : "left-1"}`} />
      </button>
    </div>
  );
}

function FieldMultiPill({ label, value, options, onChange }: {
  label: string; value: string[]; options: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => toggle(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              value.includes(o)
                ? "border-orange-400 bg-orange-50 text-orange-600"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ViewInterestTags({ interests }: { interests: string[] }) {
  if (!interests.length) return <span className="text-sm text-gray-400">No interests added</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {interests.map((t) => (
        <span key={t} className="px-3 py-1.5 rounded-full text-xs font-medium border border-orange-200 bg-orange-50 text-orange-600">
          {t}
        </span>
      ))}
    </div>
  );
}

/* ── Main page ────────────────────────────────────── */
export default function ProfilePage() {
  const [active, setActive] = useState("about");
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<ProfileData>(DEFAULT);
  const [draft, setDraft] = useState<ProfileData>(DEFAULT);
  const [photos, setPhotos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof ProfileData, value: ProfileData[keyof ProfileData]) =>
    setDraft((p) => ({ ...p, [field]: value }));

  const startEdit = () => { setDraft(data); setEditing(true); };
  const saveEdit  = () => { setData(draft); setEditing(false); };
  const cancelEdit = () => setEditing(false);

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).slice(0, 6 - photos.length)
      .forEach((f) => setPhotos((p) => [...p, URL.createObjectURL(f)]));
    if (inputRef.current) inputRef.current.value = "";
  };
  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const current = editing ? draft : data;
  const initial = current.name?.charAt(0).toUpperCase() || "A";

  /* ── Section content ─────────────────────────────── */
  const renderSection = () => {
    if (!editing) {
      // VIEW mode
      switch (active) {
        case "about": return (
          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex justify-center mb-2">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">{initial}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ViewField label="Name" value={current.name} />
              <ViewField label="Age" value={current.age} />
            </div>
            <ViewField label="Bio" value={current.bio} />
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Your Interests</p>
              <ViewInterestTags interests={current.interests} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ViewField label="Job" value={current.job} />
              <ViewField label="Education" value={current.education} />
            </div>
            <ViewField label="Location" value={current.location} />
          </div>
        );
        case "identity": return (
          <div className="grid grid-cols-2 gap-4">
            <ViewField label="Gender" value={current.gender} />
            <ViewField label="Pronouns" value={current.pronouns} />
            <ViewField label="Sexual Preference" value={current.sexual_pref} />
            <ViewField label="Relationship Status" value={current.relationship} />
            <ViewField label="Nationality" value={current.nationality} />
            <ViewField label="Ethnicity" value={current.ethnicity} />
            <ViewField label="MBTI" value={current.mbti} />
            <ViewField label="Zodiac" value={current.zodiac} />
          </div>
        );
        case "lifestyle": return (
          <div className="space-y-4">
            <ViewField label="Living Situation" value={current.living} />
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Availability</p>
              <ViewInterestTags interests={current.availability} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <ViewField label="Has Kids" value={current.kids} />
              <ViewField label="Has Pets" value={current.pets} />
              <ViewField label="Drives" value={current.drives} />
            </div>
          </div>
        );
        case "preferences": return (
          <div className="grid grid-cols-2 gap-4">
            <ViewField label="Seeking" value={current.seeking_gender} />
            <ViewField label="Max Distance (km)" value={current.max_distance_km} />
          </div>
        );
        case "personality": return (
          <div className="grid grid-cols-2 gap-4">
            <ViewField label="MBTI" value={current.mbti} />
            <ViewField label="Zodiac" value={current.zodiac} />
          </div>
        );
        case "appearance": return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ViewField label="Height (cm)" value={current.height} />
              <ViewField label="Weight (kg)" value={current.weight} />
              <ViewField label="Body Type" value={current.body} />
              <ViewField label="Hair Color" value={current.hair_color} />
              <ViewField label="Eye Color" value={current.eye_color} />
              <ViewField label="Glasses" value={current.glasses} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Body Modifications</p>
              <ViewInterestTags interests={current.body_modification} />
            </div>
          </div>
        );
        case "socials": return (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Platforms</p>
              <ViewInterestTags interests={current.socials} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Languages</p>
              <ViewInterestTags interests={current.languages} />
            </div>
          </div>
        );
        case "account": return (
          <div className="space-y-4">
            <ViewField label="Display Name" value={current.name} />
            <ViewField label="Location" value={current.location} />
          </div>
        );
        default: return null;
      }
    }

    // EDIT mode
    switch (active) {
      case "about": return (
        <div className="space-y-4">
          <div className="flex justify-center mb-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">{initial}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldText label="Name" value={draft.name} onChange={(v) => set("name", v)} />
            <FieldText label="Age" value={draft.age} onChange={(v) => set("age", v)} type="number" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</label>
            <textarea
              rows={3}
              maxLength={300}
              value={draft.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="Tell others what makes you unique…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition-all"
            />
            <p className="text-right text-xs text-gray-400">{draft.bio.length}/300</p>
          </div>
          <FieldMultiPill label="Your Interests" value={draft.interests} options={ENUMS.interests} onChange={(v) => set("interests", v)} />
          <div className="grid grid-cols-2 gap-4">
            <FieldSelect label="Job" value={draft.job} options={ENUMS.job_type} onChange={(v) => set("job", v)} />
            <FieldSelect label="Education" value={draft.education} options={ENUMS.education_type} onChange={(v) => set("education", v)} />
          </div>
          <FieldText label="Location" value={draft.location} onChange={(v) => set("location", v)} placeholder="e.g. New York, NY" />
        </div>
      );
      case "identity": return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldSelect label="Gender" value={draft.gender} options={ENUMS.gender} onChange={(v) => set("gender", v)} />
            <FieldSelect label="Pronouns" value={draft.pronouns} options={ENUMS.pronouns} onChange={(v) => set("pronouns", v)} />
            <FieldSelect label="Sexual Preference" value={draft.sexual_pref} options={ENUMS.sexual_pref} onChange={(v) => set("sexual_pref", v)} />
            <FieldSelect label="Relationship Status" value={draft.relationship} options={ENUMS.relationship} onChange={(v) => set("relationship", v)} />
            <FieldSelect label="Nationality" value={draft.nationality} options={ENUMS.nationality} onChange={(v) => set("nationality", v)} />
            <FieldSelect label="Ethnicity" value={draft.ethnicity} options={ENUMS.ethnicity} onChange={(v) => set("ethnicity", v)} />
            <FieldSelect label="MBTI" value={draft.mbti} options={ENUMS.mbti} onChange={(v) => set("mbti", v)} />
            <FieldSelect label="Zodiac" value={draft.zodiac} options={ENUMS.zodiac} onChange={(v) => set("zodiac", v)} />
          </div>
        </div>
      );
      case "lifestyle": return (
        <div className="space-y-4">
          <FieldSelect label="Living Situation" value={draft.living} options={ENUMS.living_status} onChange={(v) => set("living", v)} />
          <FieldMultiPill label="Availability" value={draft.availability} options={ENUMS.day_type} onChange={(v) => set("availability", v)} />
          <div className="bg-gray-50 rounded-xl px-4 py-2 space-y-1 divide-y divide-gray-100">
            <FieldToggle label="Has Kids" value={draft.kids} onChange={(v) => set("kids", v)} />
            <FieldToggle label="Has Pets" value={draft.pets} onChange={(v) => set("pets", v)} />
            <FieldToggle label="Drives" value={draft.drives} onChange={(v) => set("drives", v)} />
          </div>
        </div>
      );
      case "preferences": return (
        <div className="space-y-4">
          <FieldSelect label="Seeking" value={draft.seeking_gender} options={ENUMS.seeking_gender} onChange={(v) => set("seeking_gender", v)} />
          <FieldText label="Max Distance (km)" value={draft.max_distance_km} onChange={(v) => set("max_distance_km", v)} type="number" placeholder="50" />
        </div>
      );
      case "personality": return (
        <div className="grid grid-cols-2 gap-4">
          <FieldSelect label="MBTI" value={draft.mbti} options={ENUMS.mbti} onChange={(v) => set("mbti", v)} />
          <FieldSelect label="Zodiac" value={draft.zodiac} options={ENUMS.zodiac} onChange={(v) => set("zodiac", v)} />
        </div>
      );
      case "appearance": return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldText label="Height (cm)" value={draft.height} onChange={(v) => set("height", v)} type="number" placeholder="175" />
            <FieldText label="Weight (kg)" value={draft.weight} onChange={(v) => set("weight", v)} type="number" placeholder="70" />
            <FieldSelect label="Body Type" value={draft.body} options={ENUMS.body_type} onChange={(v) => set("body", v)} />
            <FieldSelect label="Hair Color" value={draft.hair_color} options={ENUMS.color_type} onChange={(v) => set("hair_color", v)} />
            <FieldSelect label="Eye Color" value={draft.eye_color} options={ENUMS.color_type} onChange={(v) => set("eye_color", v)} />
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-2">
            <FieldToggle label="Wears Glasses" value={draft.glasses} onChange={(v) => set("glasses", v)} />
          </div>
          <FieldMultiPill label="Body Modifications" value={draft.body_modification} options={ENUMS.cosmetics} onChange={(v) => set("body_modification", v)} />
        </div>
      );
      case "socials": return (
        <div className="space-y-4">
          <FieldMultiPill label="Social Platforms" value={draft.socials} options={ENUMS.social_platform} onChange={(v) => set("socials", v)} />
          <FieldMultiPill label="Languages" value={draft.languages} options={ENUMS.language_type} onChange={(v) => set("languages", v)} />
        </div>
      );
      case "account": return (
        <div className="space-y-4">
          <FieldText label="Display Name" value={draft.name} onChange={(v) => set("name", v)} />
          <FieldText label="Location" value={draft.location} onChange={(v) => set("location", v)} placeholder="City, Country" />
        </div>
      );
      default: return null;
    }
  };

  const activeSection = SECTIONS.find((s) => s.key === active);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-5">
        {/* ── Left sidebar ── */}
        <aside className="w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {SECTIONS.map(({ key, label, emoji }) => {
              const isActive = active === key;
              return (
                <button
                  key={key}
                  onClick={() => { setActive(key); setEditing(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "text-orange-500 bg-orange-50 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{activeSection?.label}</h2>
                <p className="text-sm text-gray-400 mt-0.5">Tell others what makes you unique</p>
              </div>
              {!editing ? (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-4 py-2 border-2 border-orange-400 text-orange-500 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "linear-gradient(to right,#FF7A18,#FF3D2E)" }}
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              )}
            </div>

            {renderSection()}
          </div>
        </main>

        {/* ── Right sidebar: Photos ── */}
        <aside className="w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Your Photos</h3>
            <div className="space-y-3">
              {[0, 1].map((i) => {
                const photo = photos[i];
                return (
                  <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-orange-200 bg-orange-50/40">
                    {photo ? (
                      <>
                        <Image src={photo} alt="" fill className="object-cover" unoptimized />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-orange-400 transition-colors"
                      >
                        <Camera className="w-8 h-8" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhoto} />
          </div>
        </aside>
      </div>
    </div>
  );
}
