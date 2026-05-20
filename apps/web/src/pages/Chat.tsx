import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Flame, Lightbulb, Send, Smile } from 'lucide-react';
import { aiService, authService, messageService, profileService } from '../services/api';
import Navbar from '../components/Navbar';
import { profileAge, profileInterests, profileName } from '../lib/profile';

type MessageRecord = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
};

export default function Chat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [icebreaker, setIcebreaker] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (userId) loadMessages();
  }, [userId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [messagesRes, profileRes, userRes] = await Promise.all([
        messageService.getConversation(userId),
        profileService.getById(userId).catch(() => ({ data: null })),
        authService.getMe().catch(() => ({ data: null })),
      ]);
      setMessages(messagesRes.data || []);
      setProfile(profileRes.data);
      setCurrentUserId(String(userRes.data?.id || ''));
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    try {
      const res = await messageService.send(userId, newMessage.trim());
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const handleIcebreaker = async () => {
    if (!userId) return;
    try {
      const res = await aiService.getIcebreaker(userId);
      setIcebreaker(res.data.icebreaker || res.data.message || '');
    } catch (err) {
      console.error('Failed to get icebreaker:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
      </div>
    );
  }

  const name = profileName(profile, 'Chat');
  const age = profileAge(profile);
  const interests = profileInterests(profile).slice(0, 3).join(', ');

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="mx-auto flex h-[calc(100vh-140px)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <Link
              to="/messages"
              className="text-sm font-semibold text-orange-500 hover:text-orange-600"
            >
              Messages
            </Link>
            <div className="text-center">
              <h1 className="text-sm font-bold text-gray-900">
                {name}
                {age ? `, ${age}` : ''}
              </h1>
              <p className="text-xs text-gray-400">{interests || 'Ready to chat'}</p>
            </div>
            <button
              type="button"
              onClick={handleIcebreaker}
              className="rounded-xl p-2 text-orange-500 transition-all hover:bg-orange-50"
              aria-label="Get icebreaker"
            >
              <Lightbulb className="h-4 w-4" />
            </button>
          </div>

          {icebreaker && (
            <div className="border-b border-orange-100 bg-orange-50 px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-orange-800">{icebreaker}</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewMessage(icebreaker);
                    setIcebreaker('');
                  }}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-orange-600 shadow-sm"
                >
                  Use
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Flame className="mb-3 h-12 w-12 text-orange-300" fill="currentColor" />
                <p className="text-sm text-gray-400">No messages yet. Say hello to start.</p>
              </div>
            ) : (
              messages.map((message) => {
                const sent =
                  currentUserId && String(message.sender_id) === currentUserId
                    ? true
                    : String(message.sender_id) !== String(userId);
                return (
                  <div
                    key={message.id}
                    className={`flex ${sent ? 'justify-end' : 'justify-start'}`}
                  >
                    {!sent && <Avatar name={name} />}
                    <div className="max-w-xs lg:max-w-sm">
                      <div
                        className={`px-4 py-2.5 text-sm leading-relaxed ${
                          sent
                            ? 'rounded-2xl rounded-br-sm text-white btn-ignite'
                            : 'rounded-2xl rounded-bl-sm bg-gray-100 text-gray-800'
                        }`}
                      >
                        {message.content}
                      </div>
                      <p
                        className={`mt-1 text-[10px] text-gray-400 ${sent ? 'text-right' : 'text-left'}`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 transition-all focus-within:border-orange-400 focus-within:bg-white">
              <Smile className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <input
                type="text"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder={`Message ${name}...`}
                disabled={sending}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40 btn-ignite"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white">
      {name.charAt(0).toUpperCase() || 'B'}
    </div>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
