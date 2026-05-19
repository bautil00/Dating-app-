import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
    bio?: string;
    age?: number;
    gender?: string;
    location?: string;
    profile_image_url?: string;
  };
}

type CandidateProfile = {
  id?: string;
  user_id?: string;
  Name?: string;
  display_name?: string;
  Age?: number;
  age?: number;
  Location?: string;
  location?: string;
  bio?: string;
  compatibility_score?: number;
  interests?: string | string[];
  profile_image_url?: string;
  photo_url?: string;
  image_url?: string;
  Picture?: string;
};

const getCandidateId = (candidate: CandidateProfile) =>
  String(candidate.user_id ?? candidate.id ?? '');

const getCandidateName = (candidate: CandidateProfile) =>
  candidate.Name || candidate.display_name || 'New User';

const getCandidateAge = (candidate: CandidateProfile) => candidate.Age || candidate.age;

const getCandidateLocation = (candidate: CandidateProfile) =>
  candidate.Location || candidate.location;

const getCandidateInterests = (candidate: CandidateProfile) => {
  if (typeof candidate.interests === 'string') {
    return candidate.interests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return Array.isArray(candidate.interests) ? candidate.interests : [];
};

const getCandidateImage = (candidate: CandidateProfile) =>
  candidate.profile_image_url ||
  candidate.photo_url ||
  candidate.image_url ||
  candidate.Picture ||
  '';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [matches, setMatches] = useState<
    { id?: number; sender_id?: string; receiver_id?: string; status?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [userRes, profileRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/profiles/me').catch(() => ({ data: null })),
      ]);
      setUser(userRes.data);
      setProfile(profileRes.data);

      if (profileRes.data) {
        const [candidatesRes, matchesRes] = await Promise.all([
          api.get('/profiles/candidates?limit=20'),
          api.get('/matches/').catch(() => ({ data: [] })),
        ]);
        setCandidates(candidatesRes.data || []);
        setMatches(matchesRes.data || []);
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      console.error('Failed to load data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (candidateId: string) => {
    if (!candidateId) return;

    try {
      const result = await api.post('/matches/', {
        receiver_id: candidateId,
      });

      if (result.data.matched) {
        alert(`It's a MATCH! You can now chat! 🎉`);
      }

      setCandidates((prev) =>
        prev.filter((c) => String(c.user_id ?? c.id) !== String(candidateId)),
      );

      setMatches((prev) => {
        const exists = prev.some(
          (m) =>
            String(m.sender_id) === String(result.data.sender_id) &&
            String(m.receiver_id) === String(result.data.receiver_id),
        );
        if (exists) {
          return prev.map((m) =>
            String(m.sender_id) === String(result.data.sender_id) &&
            String(m.receiver_id) === String(result.data.receiver_id)
              ? { ...m, ...result.data }
              : m,
          );
        }
        return [result.data, ...prev];
      });
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handlePass = (candidateId: string) => {
    if (!candidateId) return;

    setCandidates((prev) => prev.filter((c) => getCandidateId(c) !== String(candidateId)));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Finding your matches...</p>
      </div>
    );
  }

  const displayName = String(
    profile?.Name ||
      profile?.display_name ||
      user?.user_metadata?.display_name ||
      user?.email?.split('@')[0] ||
      'There',
  );
  const uniqueMatchCount = user?.id
    ? new Set(
        matches.map((m) =>
          String(m.sender_id) === String(user.id) ? String(m.receiver_id) : String(m.sender_id),
        ),
      ).size
    : matches.length;

  const currentCandidate = candidates[0];
  const currentCandidateId = currentCandidate ? getCandidateId(currentCandidate) : '';
  const currentName = currentCandidate ? getCandidateName(currentCandidate) : '';
  const currentAge = currentCandidate ? getCandidateAge(currentCandidate) : undefined;
  const currentLocation = currentCandidate ? getCandidateLocation(currentCandidate) : '';
  const currentInterests = currentCandidate ? getCandidateInterests(currentCandidate) : [];
  const currentImage = currentCandidate ? getCandidateImage(currentCandidate) : '';
  const currentScore = currentCandidate?.compatibility_score;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="logo-text">🔥</span>
          <span className="brand-name">BLOWTORCH</span>
        </div>
        <div className="nav-links">
          <Link to="/discover" className="active">
            Discover
          </Link>
          <Link to="/matches">Sparks ({uniqueMatchCount})</Link>
          <Link to="/messages">Messages</Link>
          <Link to="/profile">Profile</Link>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <section className="welcome-section discover-hero">
          <div>
            <p className="eyebrow">AI-powered discovery</p>
            <h2>Hey, {displayName}.</h2>
            <p>
              Review your best match recommendation and ignite the connection when it feels right.
            </p>
          </div>
          {Boolean(profile?.is_complete) && (
            <span className="queue-pill">
              {candidates.length} {candidates.length === 1 ? 'person' : 'people'} left
            </span>
          )}
        </section>

        {!profile || !profile.is_complete ? (
          <div className="profile-prompt">
            <div className="prompt-card">
              <h3>Complete Your Profile</h3>
              <p>Add your details to start matching with people</p>
              <Link to="/profile" className="btn-primary">
                Create Profile
              </Link>
            </div>
          </div>
        ) : (
          <section className="candidates-section discover-section">
            {!currentCandidate ? (
              <div className="empty-state">
                <div className="empty-icon">🔥</div>
                <h2>You're all caught up!</h2>
                <p className="sub">Check back later for new matches!</p>
              </div>
            ) : (
              <div className="discover-layout">
                <article className="spotlight-card">
                  <div className="spotlight-image">
                    {currentImage ? (
                      <img src={currentImage} alt={currentName} />
                    ) : (
                      <div className="card-image-placeholder">
                        <span className="avatar-initial">
                          {currentName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="spotlight-overlay">
                      <div>
                        <h3>
                          {currentName}
                          {currentAge ? `, ${currentAge}` : ''}
                        </h3>
                        {currentLocation && <p>{currentLocation}</p>}
                      </div>
                      {currentScore != null && (
                        <div className="spark-badge">
                          <span>{Math.round(currentScore)}%</span>
                          <small>Spark</small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="spotlight-content">
                    {currentCandidate.bio && <p className="bio">{currentCandidate.bio}</p>}
                    {currentInterests.length > 0 && (
                      <div className="interests">
                        {currentInterests.slice(0, 5).map((interest, index) => (
                          <span key={`${interest}-${index}`} className="interest-tag">
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="swipe-actions">
                      <button onClick={() => handlePass(currentCandidateId)} className="pass-btn">
                        Pass
                      </button>
                      <button onClick={() => handleLike(currentCandidateId)} className="ignite-btn">
                        Ignite 🔥
                      </button>
                    </div>
                  </div>
                </article>

                <aside className="match-insight-card">
                  <span className="insight-icon">🔥</span>
                  <p className="eyebrow">AI match insight</p>
                  <h3>{currentName} could be a strong spark.</h3>
                  <p>
                    {currentScore != null
                      ? `The compatibility model ranks this match at ${Math.round(currentScore)}%.`
                      : 'This profile is surfaced from your current matching preferences.'}
                    {currentInterests.length > 0
                      ? ` You share signals around ${currentInterests.slice(0, 3).join(', ')}.`
                      : ''}
                  </p>
                  <div className="insight-list">
                    <span>{currentInterests.length || 'No'} shared interest signals</span>
                    <span>Real backend match scoring</span>
                    <span>Ignite saves through your matches API</span>
                  </div>
                </aside>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
