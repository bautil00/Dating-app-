import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Chat() {
  const { userId } = useParams();
  const [messages, setMessages] = useState<
    { id: number; content: string; created_at: string; sender_id: string }[]
  >([]);
  const [targetName, setTargetName] = useState('');
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
    if (userId) {
      loadMessages();
    }
  }, [userId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!userId) return;
    try {
      const [messagesRes, profileRes] = await Promise.all([
        api.get(`/messages/conversations/${userId}`),
        api.get(`/profiles/${userId}`).catch(() => ({ data: null })),
      ]);
      setMessages(messagesRes.data || []);
      setTargetName(
        profileRes.data?.Name || profileRes.data?.name || profileRes.data?.display_name || '',
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    try {
      const res = await api.post('/messages/', {
        receiver_id: userId,
        content: newMessage,
      });
      setMessages([...messages, res.data]);
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
      const res = await api.get(`/ai/icebreaker/${userId}`);
      setIcebreaker(res.data.icebreaker);
    } catch (err) {
      console.error('Failed to get icebreaker:', err);
    }
  };

  const useIcebreaker = () => {
    if (icebreaker) {
      setNewMessage(icebreaker);
      setIcebreaker('');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <nav className="chat-navbar">
        <Link to="/messages" className="back-btn">
          ← Messages
        </Link>
        <h2>{targetName || 'Chat'}</h2>
        <div></div>
      </nav>

      <div className="icebreaker-section">
        <button onClick={handleIcebreaker} className="icebreaker-btn">
          💡 Get Icebreaker
        </button>
        {icebreaker && (
          <div className="icebreaker-tip">
            <p>{icebreaker}</p>
            <button onClick={useIcebreaker}>Use This</button>
            <button onClick={() => setIcebreaker('')} className="dismiss">
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet</p>
            <p className="sub">Say hello to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.sender_id === userId ? 'received' : 'sent'}`}
            >
              <p>{msg.content}</p>
              <span className="time">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
