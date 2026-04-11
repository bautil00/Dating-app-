import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { messageService, aiService } from '../services/api'

export default function Chat() {
  const { userId } = useParams()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [icebreaker, setIcebreaker] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (userId) {
      messageService.getConversation(parseInt(userId))
        .then(res => setMessages(res.data))
        .catch(console.error)
    }
  }, [userId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      const res = await messageService.send(parseInt(userId!), newMessage)
      setMessages([...messages, res.data])
      setNewMessage('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleIcebreaker = async () => {
    try {
      const res = await aiService.getIcebreaker(parseInt(userId!))
      setIcebreaker(res.data.icebreaker)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="chat-page">
      <header>
        <h2>Chat</h2>
        <button onClick={handleIcebreaker}>Get Icebreaker</button>
      </header>

      {icebreaker && (
        <div className="icebreaker-tip">
          <p>💡 {icebreaker}</p>
          <button onClick={() => { setNewMessage(icebreaker); setIcebreaker('') }}>Use this</button>
        </div>
      )}

      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender_id === parseInt(userId!) ? 'sent' : 'received'}`}>
            <p>{msg.content}</p>
            <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
