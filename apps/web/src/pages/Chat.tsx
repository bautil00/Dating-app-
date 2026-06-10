import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Flame, Lightbulb, Send, Smile } from 'lucide-react';
import { aiService, authService, messageService, profileService } from '../services/api';
import Navbar from '../components/Navbar';
import {
  markIncomingMessagesRead,
  mergeMessages,
  type LiveMessageRecord,
  useChatPolling,
} from '../hooks/useChatPolling';
import { profileAge, profileImage, profileInterests, profileName } from '../lib/profile';

export default function Chat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState<LiveMessageRecord[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const navigate = useNavigate();

  const updateAutoScroll = () => {
    const element = messageListRef.current;
    if (!element) return;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  const markReadLocally = useCallback(
    (nextMessages: LiveMessageRecord[]) =>
      nextMessages.map((message) =>
        currentUserId && String(message.sender_id) !== currentUserId
          ? { ...message, is_read: true }
          : message,
      ),
    [currentUserId],
  );

  const loadMessages = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [messagesRes, profileRes, userRes, icebreakerRes] = await Promise.all([
        messageService.getConversation(userId),
        profileService.getById(userId).catch(() => ({ data: null })),
        authService.getMe().catch(() => ({ data: null })),
        aiService.getIcebreakers(userId).catch(() => ({ data: { suggestions: [] } })),
      ]);
      const userIdentifier = String(userRes.data?.id || '');
      const loadedMessages = messagesRes.data || [];
      const suggestions = Array.isArray(icebreakerRes.data?.suggestions)
        ? icebreakerRes.data.suggestions.filter((value: unknown) => typeof value === 'string')
        : [];
      if (userIdentifier) await markIncomingMessagesRead(loadedMessages, userIdentifier);
      setMessages(
        userIdentifier
          ? loadedMessages.map((message: LiveMessageRecord) =>
              String(message.sender_id) !== userIdentifier
                ? { ...message, is_read: true }
                : message,
            )
          : loadedMessages,
      );
      setProfile(profileRes.data);
      setCurrentUserId(userIdentifier);
      setIcebreakers(suggestions.slice(0, 3));
      shouldAutoScrollRef.current = true;
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshMessages = useCallback(async () => {
    if (!userId || !currentUserId) return;
    try {
      const res = await messageService.getConversationFresh(userId);
      const freshMessages = (res.data || []) as LiveMessageRecord[];
      await markIncomingMessagesRead(freshMessages, currentUserId);
      setMessages((prev) => markReadLocally(mergeMessages(prev, freshMessages)));
    } catch (err) {
      console.error('Failed to refresh chat:', err);
    }
  }, [currentUserId, markReadLocally, userId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (userId) loadMessages();
  }, [loadMessages, navigate, userId]);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
    }
  }, [messages]);

  useChatPolling({
    enabled: Boolean(userId && currentUserId),
    intervalMs: 3_000,
    onPoll: refreshMessages,
  });

  const handleSend = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    try {
      const res = await messageService.send(userId, newMessage.trim());
      shouldAutoScrollRef.current = true;
      setMessages((prev) => mergeMessages(prev, [res.data]));
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
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
  const imageUrl = profileImage(profile);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] pb-24 md:pb-0">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-3 sm:px-6 sm:py-8">
        <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:h-[calc(100vh-140px)]">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4">
            <Link
              to="/messages"
              className="text-sm font-semibold text-orange-500 hover:text-orange-600"
            >
              Back
            </Link>
            <div className="flex min-w-0 items-center justify-center gap-3 text-center">
              <Avatar name={name} imageUrl={imageUrl} compact />
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-gray-900">
                  {name}
                  {age ? `, ${age}` : ''}
                </h1>
                <p className="truncate text-xs text-gray-400">{interests || 'Ready to chat'}</p>
              </div>
            </div>
            <div className="rounded-xl p-2 text-orange-500" aria-hidden="true">
              <Lightbulb className="h-4 w-4" />
            </div>
          </div>

          {icebreakers.length > 0 && (
            <div className="border-b border-orange-100 bg-orange-50 px-4 py-3 sm:px-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-700">
                <Lightbulb className="h-3.5 w-3.5" />
                Conversation starters
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {icebreakers.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setNewMessage(suggestion)}
                    className="min-w-[12rem] rounded-xl bg-white px-3 py-2 text-left text-sm text-orange-800 shadow-sm transition hover:bg-orange-100 sm:min-w-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            ref={messageListRef}
            onScroll={updateAutoScroll}
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5"
          >
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
                    {!sent && <Avatar name={name} imageUrl={imageUrl} />}
                    <div className="max-w-[min(78vw,20rem)] lg:max-w-sm">
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

          <form
            onSubmit={handleSend}
            className="border-t border-gray-100 px-3 py-3 sm:px-5 sm:py-4"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 transition-all focus-within:border-orange-400 focus-within:bg-white sm:gap-3 sm:px-4">
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

function Avatar({
  name,
  imageUrl,
  compact = false,
}: {
  name: string;
  imageUrl?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white ${
        compact ? 'h-9 w-9' : 'mr-2 mt-1 h-7 w-7'
      }`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase() || 'B'
      )}
    </div>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
