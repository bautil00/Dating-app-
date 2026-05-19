import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

type Conversation = {
  user_id: string;
  last_message?: string | null;
  last_timestamp?: string | null;
  unread_count?: number;
};

type ProfileSummary = {
  user_id?: string;
  name?: string;
  Name?: string;
  display_name?: string;
  age?: number;
  Age?: number;
  interests?: string[] | string;
};

type ConversationView = Conversation & {
  profile?: ProfileSummary | null;
};

const profileName = (profile?: ProfileSummary | null) =>
  profile?.Name || profile?.name || profile?.display_name || '';

const shortUserId = (userId: string) => (userId ? userId.slice(0, 8) : 'unknown');

const profileInterests = (profile?: ProfileSummary | null) => {
  const interests = profile?.interests;
  if (Array.isArray(interests)) return interests;
  if (typeof interests === 'string') {
    return interests
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export default function Messages() {
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadConversations();
  }, [navigate]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      const rows: Conversation[] = res.data || [];
      const enriched = await Promise.all(
        rows.map(async (conversation) => {
          const profileRes = await api
            .get(`/profiles/${conversation.user_id}`)
            .catch(() => ({ data: null }));
          return { ...conversation, profile: profileRes.data };
        }),
      );
      setConversations(enriched);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = conversations.filter((conversation) => {
    const name = profileName(conversation.profile) || shortUserId(conversation.user_id);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="logo-text">🔥</span>
          <span className="brand-name">BLOWTORCH</span>
        </div>
        <div className="nav-links">
          <Link to="/discover">Discover</Link>
          <Link to="/matches">Sparks</Link>
          <Link to="/messages" className="active">
            Messages
          </Link>
          <Link to="/profile">Profile</Link>
        </div>
      </nav>

      <main className="messages-content">
        <section className="messages-hero">
          <div>
            <p className="eyebrow">Conversations</p>
            <h1>Messages</h1>
            <p>Pick up chats with your sparks and keep the conversation moving.</p>
          </div>
          <div className="messages-search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
            />
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h2>No conversations yet</h2>
            <p>Start from a mutual spark to send the first message.</p>
            <Link to="/matches" className="btn-primary">
              View Sparks
            </Link>
          </div>
        ) : (
          <section className="conversation-list" aria-label="Conversations">
            {filtered.map((conversation) => {
              const name =
                profileName(conversation.profile) || `User ${shortUserId(conversation.user_id)}`;
              const interests = profileInterests(conversation.profile);
              return (
                <Link
                  key={conversation.user_id}
                  to={`/chat/${conversation.user_id}`}
                  className="conversation-card"
                >
                  <div className="conversation-avatar">
                    <span>{name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="conversation-main">
                    <div className="conversation-title-row">
                      <h2>{name}</h2>
                      {conversation.last_timestamp && (
                        <time>
                          {new Date(conversation.last_timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      )}
                    </div>
                    <p>{conversation.last_message || 'No messages yet'}</p>
                    {interests.length > 0 && (
                      <div className="conversation-tags">
                        {interests.slice(0, 3).map((interest) => (
                          <span key={interest}>{interest}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {Boolean(conversation.unread_count) && (
                    <span className="unread-badge">{conversation.unread_count}</span>
                  )}
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
