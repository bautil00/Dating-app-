"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Send, Search, Phone, Video, MoreHorizontal, Flame } from "lucide-react";

type Message = { id: number; text: string; sent: boolean; time: string };
type Conversation = {
  id: number; name: string; age: number; photo: string;
  last_message: string; time: string; unread: number; online: boolean;
  messages: Message[];
};

const MOCK_CONVOS: Conversation[] = [
  {
    id: 1, name: "Alex Chen", age: 26, photo: "https://picsum.photos/seed/alex/80/80",
    last_message: "That sounds amazing! When are you free?", time: "2m", unread: 2, online: true,
    messages: [
      { id: 1, text: "Hey! I saw you're into AI too 👀", sent: false, time: "10:30 AM" },
      { id: 2, text: "Yeah! I'm actually building something with LLMs right now", sent: true, time: "10:32 AM" },
      { id: 3, text: "No way, same here! What are you working on?", sent: false, time: "10:33 AM" },
      { id: 4, text: "A personalized learning app — it adapts to how you think. Still early though", sent: true, time: "10:35 AM" },
      { id: 5, text: "That sounds amazing! When are you free?", sent: false, time: "10:36 AM" },
    ],
  },
  {
    id: 2, name: "Jordan Rivera", age: 29, photo: "https://picsum.photos/seed/jordan/80/80",
    last_message: "Haha yes exactly! Great minds 😄", time: "1h", unread: 0, online: true,
    messages: [
      { id: 1, text: "Your travel photos are incredible", sent: true, time: "Yesterday" },
      { id: 2, text: "Thank you! I just got back from Lisbon", sent: false, time: "Yesterday" },
      { id: 3, text: "I've been wanting to go there for years!", sent: true, time: "Yesterday" },
      { id: 4, text: "Haha yes exactly! Great minds 😄", sent: false, time: "Yesterday" },
    ],
  },
  {
    id: 3, name: "Sam Patel", age: 24, photo: "https://picsum.photos/seed/sam/80/80",
    last_message: "Let's plan something this weekend", time: "3h", unread: 1, online: false,
    messages: [
      { id: 1, text: "Hey Sam! Love your taste in music", sent: true, time: "Mon" },
      { id: 2, text: "Thanks! You into indie or more electronic?", sent: false, time: "Mon" },
      { id: 3, text: "Both honestly. Have you heard Bladee?", sent: true, time: "Mon" },
      { id: 4, text: "Let's plan something this weekend", sent: false, time: "Mon" },
    ],
  },
  {
    id: 4, name: "Morgan Lee", age: 27, photo: "https://picsum.photos/seed/morgan/80/80",
    last_message: "That book changed my life tbh", time: "1d", unread: 0, online: false,
    messages: [
      { id: 1, text: "You read The Alchemist?", sent: false, time: "Sun" },
      { id: 2, text: "Yes! Finished it last week", sent: true, time: "Sun" },
      { id: 3, text: "That book changed my life tbh", sent: false, time: "Sun" },
    ],
  },
];

export default function MessagesPage() {
  const [activeId, setActiveId] = useState<number>(1);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [convos, setConvos] = useState<Conversation[]>(MOCK_CONVOS);

  const filtered = convos.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const active = convos.find((c) => c.id === activeId) ?? convos[0];

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setConvos((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? {
              ...c,
              last_message: input,
              time: "now",
              messages: [...c.messages, { id: Date.now(), text: input, sent: true, time: now }],
            }
          : c
      )
    );
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* ── Left: conversation list ── */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
            {/* Header */}
            <div className="px-4 pt-5 pb-3">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                    activeId === c.id ? "bg-orange-50" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <Image src={c.photo} alt={c.name} width={48} height={48} className="object-cover" unoptimized />
                    </div>
                    {c.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm font-semibold truncate ${activeId === c.id ? "text-orange-600" : "text-gray-900"}`}>
                        {c.name}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{c.time}</span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{c.last_message}</p>
                  </div>

                  {/* Unread badge */}
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(to right,#FF7A18,#FF3D2E)" }}>
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Right: chat view ── */}
          {active ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image src={active.photo} alt={active.name} width={40} height={40} className="object-cover" unoptimized />
                    </div>
                    {active.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{active.name}, {active.age}</p>
                    <p className="text-xs text-gray-400">{active.online ? "Online now" : "Last seen recently"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[Phone, Video, MoreHorizontal].map((Icon, i) => (
                    <button key={i} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {active.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sent ? "justify-end" : "justify-start"}`}>
                    {!msg.sent && (
                      <div className="w-7 h-7 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1">
                        <Image src={active.photo} alt="" width={28} height={28} className="object-cover" unoptimized />
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-sm`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sent
                            ? "text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        }`}
                        style={msg.sent ? { background: "linear-gradient(to right,#FF7A18,#FF3D2E)" } : {}}
                      >
                        {msg.text}
                      </div>
                      <p className={`text-[10px] text-gray-400 mt-1 ${msg.sent ? "text-right" : "text-left"}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-gray-100">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-orange-400 focus-within:bg-white transition-all">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={`Message ${active.name}…`}
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(to right,#FF7A18,#FF3D2E)" }}
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Flame className="w-12 h-12 text-orange-300 mb-3" fill="currentColor" />
              <p className="text-gray-400 text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
