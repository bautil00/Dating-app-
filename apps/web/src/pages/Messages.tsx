import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Search, Send, ShieldOff, Smile, UserX } from 'lucide-react';
import { authService, messageService, profileService } from '../services/api';
import Navbar from '../components/Navbar';
import { profileAge, profileInterests, profileName, shortUserId } from '../lib/profile';

type Conversation = {
  user_id: string;
  last_message?: string | null;
  last_timestamp?: string | null;
  unread_count?: number;
};

type ConversationView = Conversation & {
  profile?: Record<string, unknown> | null;
  messages?: MessageRecord[];
};

type MessageRecord = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id?: string;
};

const EMOJI_CATEGORIES = [
  { label: 'Smileys', emojis: ['😀', '😄', '😂', '😊', '😍', '😎', '🤔', '😌'] },
  { label: 'Hearts', emojis: ['❤️', '🧡', '💛', '💕', '💖', '💘', '❤️‍🔥', '💯'] },
  { label: 'Gestures', emojis: ['👋', '👌', '✌️', '🤙', '👍', '👏', '🙌', '🫶'] },
  { label: 'Hot', emojis: ['🔥', '✨', '⭐', '🎉', '🏆', '💎', '⚡', '🚀'] },
];

export default function Messages() {
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [activeId, setActiveId] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState<{ type: 'unmatch' | 'block'; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const emojiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadConversations();
  }, [navigate]);

  useEffect(() => {
    const closeEmoji = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener('mousedown', closeEmoji);
    return () => document.removeEventListener('mousedown', closeEmoji);
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const [conversationRes, userRes] = await Promise.all([
        messageService.getConversations(),
        authService.getMe().catch(() => ({ data: null })),
      ]);
      setCurrentUserId(String(userRes.data?.id || ''));
      const rows: Conversation[] = conversationRes.data || [];
      const enriched = await Promise.all(
        rows.map(async (conversation) => {
          const profileRes = await profileService
            .getById(conversation.user_id)
            .catch(() => ({ data: null }));
          return { ...conversation, profile: profileRes.data };
        }),
      );
      setConversations(enriched);
      setActiveId((active) => active || enriched[0]?.user_id || '');
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const res = await messageService.getConversation(userId);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user_id === userId
            ? { ...conversation, messages: res.data || [] }
            : conversation,
        ),
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeId) return;
    try {
      const res = await messageService.send(activeId, input.trim());
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.user_id === activeId
            ? {
                ...conversation,
                last_message: input.trim(),
                last_timestamp: new Date().toISOString(),
                messages: [...(conversation.messages || []), res.data],
              }
            : conversation,
        ),
      );
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setToast('Message failed to send.');
      window.setTimeout(() => setToast(''), 2400);
    }
  };

  const filtered = conversations.filter((conversation) => {
    const name = profileName(conversation.profile, `User ${shortUserId(conversation.user_id)}`);
    return name.toLowerCase().includes(search.toLowerCase());
  });
  const active =
    conversations.find((conversation) => conversation.user_id === activeId) || filtered[0];
  const unreadCount = conversations.reduce(
    (total, conversation) => total + (conversation.unread_count || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      <Navbar unreadCount={unreadCount} />

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex w-72 flex-shrink-0 flex-col border-r border-gray-100">
            <div className="px-4 pb-3 pt-5">
              <h2 className="mb-3 text-lg font-bold text-gray-900">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 transition-all focus:border-orange-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.map((conversation) => (
                <button
                  type="button"
                  key={conversation.user_id}
                  onClick={() => setActiveId(conversation.user_id)}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all ${
                    active?.user_id === conversation.user_id ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <Avatar name={profileName(conversation.profile, conversation.user_id)} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between">
                      <p
                        className={`truncate text-sm font-semibold ${
                          active?.user_id === conversation.user_id
                            ? 'text-orange-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {profileName(
                          conversation.profile,
                          `User ${shortUserId(conversation.user_id)}`,
                        )}
                      </p>
                      {conversation.last_timestamp && (
                        <span className="ml-1 flex-shrink-0 text-xs text-gray-400">
                          {formatTime(conversation.last_timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-400">
                      {conversation.last_message || 'No messages yet'}
                    </p>
                  </div>
                  {Boolean(conversation.unread_count) && (
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white btn-ignite">
                      {conversation.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {active ? (
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={profileName(active.profile, active.user_id)} size="sm" />
                  <div>
                    <h1 className="text-sm font-bold text-gray-900">
                      {profileName(active.profile, `User ${shortUserId(active.user_id)}`)}
                      {profileAge(active.profile) ? `, ${profileAge(active.profile)}` : ''}
                    </h1>
                    <p className="text-xs text-gray-400">
                      {profileInterests(active.profile).slice(0, 3).join(', ') || 'Ready to chat'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        type: 'unmatch',
                        name: profileName(active.profile, active.user_id),
                      })
                    }
                    className="rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-50 hover:text-orange-500"
                    aria-label="Unmatch"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        type: 'block',
                        name: profileName(active.profile, active.user_id),
                      })
                    }
                    className="rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-50 hover:text-red-500"
                    aria-label="Hide conversation"
                  >
                    <ShieldOff className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {(active.messages || []).length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <Flame className="mb-3 h-12 w-12 text-orange-300" fill="currentColor" />
                    <p className="text-sm text-gray-400">
                      No messages yet. Start the conversation.
                    </p>
                  </div>
                ) : (
                  (active.messages || []).map((message) => {
                    const sent = String(message.sender_id) === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${sent ? 'justify-end' : 'justify-start'}`}
                      >
                        {!sent && (
                          <Avatar name={profileName(active.profile, active.user_id)} size="xs" />
                        )}
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
              </div>

              <div className="border-t border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 transition-all focus-within:border-orange-400 focus-within:bg-white">
                  <div ref={emojiRef} className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEmojiOpen((open) => !open)}
                      className="text-gray-400 transition-colors hover:text-orange-400"
                      aria-label="Open emoji picker"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    {emojiOpen && (
                      <div className="absolute bottom-full left-0 z-50 mb-3 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                        <div className="flex border-b border-gray-100 bg-gray-50">
                          {EMOJI_CATEGORIES.map((category, index) => (
                            <button
                              type="button"
                              key={category.label}
                              onClick={() => setEmojiTab(index)}
                              title={category.label}
                              className={`flex-1 py-2 text-base ${
                                emojiTab === index
                                  ? 'border-b-2 border-orange-400 bg-white'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {category.emojis[0]}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-8 gap-0.5 px-2 py-3">
                          {EMOJI_CATEGORIES[emojiTab].emojis.map((emoji) => (
                            <button
                              type="button"
                              key={emoji}
                              onClick={() => {
                                setInput((value) => value + emoji);
                                inputRef.current?.focus();
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:bg-orange-50"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                    placeholder={`Message ${profileName(active.profile, active.user_id)}...`}
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40 btn-ignite"
                    aria-label="Send message"
                  >
                    <Send className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <Flame className="mb-3 h-12 w-12 text-orange-300" fill="currentColor" />
              <p className="text-sm text-gray-400">Select a conversation to start chatting</p>
              <Link
                to="/sparks"
                className="mt-4 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white btn-ignite"
              >
                View Sparks
              </Link>
            </div>
          )}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                confirm.type === 'block' ? 'bg-red-100' : 'bg-orange-100'
              }`}
            >
              {confirm.type === 'block' ? (
                <ShieldOff className="h-6 w-6 text-red-500" />
              ) : (
                <UserX className="h-6 w-6 text-orange-500" />
              )}
            </div>
            <h3 className="mb-1 text-center text-lg font-bold text-gray-900">
              {confirm.type === 'unmatch' ? `Unmatch ${confirm.name}?` : `Hide ${confirm.name}?`}
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500">
              This hides the conversation from the current view. Backend messages remain intact.
            </p>
            <button
              type="button"
              onClick={() => {
                if (active) {
                  setConversations((prev) =>
                    prev.filter((conversation) => conversation.user_id !== active.user_id),
                  );
                  setActiveId('');
                }
                setConfirm(null);
              }}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white btn-ignite"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'xs' | 'sm' | 'md' }) {
  const className =
    size === 'xs'
      ? 'mr-2 mt-1 h-7 w-7 text-xs'
      : size === 'sm'
        ? 'h-10 w-10 text-sm'
        : 'h-12 w-12 text-base';
  return (
    <div
      className={`${className} flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 font-bold text-white`}
    >
      {name.charAt(0).toUpperCase() || 'B'}
    </div>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
