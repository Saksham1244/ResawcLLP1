"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Search, Plus, X, Users, Hash, Check } from "lucide-react";
import { useRole } from "@/context/RoleContext";

type MessageType = { id: string; sender: { id: string; name: string }; createdAt: string; text: string };
type Conversation = {
  id: string;
  name: string | null;
  type: "CHANNEL" | "DIRECT" | "GROUP";
  participants: { user: { id: string; name: string } }[];
  messages: { text: string; createdAt: string }[];
};

const AVATAR_COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#a78bfa", "#06b6d4"];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function renderMessageText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function ChatSystem() {
  const { user } = useRole();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newType, setNewType] = useState<"direct" | "group">("direct");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poll for conversations
  useEffect(() => {
    if (!user?.id) return;
    const fetchConvos = async () => {
      const res = await fetch(`/api/chat/conversations?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
        if (!activeId && data.data.length > 0) setActiveId(data.data[0].id);
      }
    };
    fetchConvos();
    const interval = setInterval(fetchConvos, 5000);
    return () => clearInterval(interval);
  }, [user?.id, activeId]);

  // Poll for active messages
  useEffect(() => {
    if (!activeId) return;
    const fetchMessages = async () => {
      const res = await fetch(`/api/chat/messages?conversationId=${activeId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeId]);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success) setAllUsers(data.data.filter((u: any) => u.id !== user?.id));
      } catch (err) {}
    }
    if (user?.id) loadMembers();
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getConversationName = (c: Conversation) => {
    if (c.type === "CHANNEL") return c.name || "Channel";
    if (c.type === "GROUP") return c.name || c.participants.filter(p => p.user.id !== user?.id).map(p => p.user.name).join(", ");
    if (c.type === "DIRECT") {
      const other = c.participants.find(p => p.user.id !== user?.id);
      return other?.user.name || "Unknown";
    }
    return "Chat";
  };

  const filteredContacts = conversations.filter(c => getConversationName(c).toLowerCase().includes(query.toLowerCase()));
  const activeContact = conversations.find(c => c.id === activeId);

  const sendMessage = async () => {
    if (!text.trim() || !activeId || !user?.id) return;
    
    // Optimistic UI update
    const tempMsg: MessageType = { id: Date.now().toString(), sender: { id: user.id, name: user.name }, createdAt: new Date().toISOString(), text: text.trim() };
    setMessages(prev => [...prev, tempMsg]);
    const currentText = text.trim();
    setText("");

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeId, senderId: user.id, text: currentText })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const createConversation = async () => {
    if (selectedMembers.length === 0 || !user?.id) return;
    
    const memberIds = [...selectedMembers, user.id];
    
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newType === 'group' ? groupName : null,
          type: newType.toUpperCase(),
          memberIds
        })
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => [...prev, data.data]);
        setActiveId(data.data.id);
        setShowNewModal(false);
        setSelectedMembers([]);
        setGroupName("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMember = (mId: string) => {
    setSelectedMembers(prev =>
      prev.includes(mId) ? prev.filter(x => x !== mId) : newType === "direct" ? [mId] : [...prev, mId]
    );
  };

  if (!user) return <div style={{ padding: '2rem' }}>Loading chat...</div>;

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1.25rem' }}>

      {/* Contacts Sidebar */}
      <div className="glass-card" style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem' }}>

        <div className="flex-between">
          <h2 className="font-bold" style={{ fontSize: '1rem' }}>Messages</h2>
          <button className="btn btn-primary" style={{ width: '32px', height: '32px', padding: 0, borderRadius: 'var(--radius-sm)' }} onClick={() => setShowNewModal(true)}>
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-foreground)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chats..."
            className="input" style={{ paddingLeft: '2rem', fontSize: '0.8rem', padding: '0.5rem 0.7rem 0.5rem 2rem' }} />
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {conversations.length === 0 && <p className="text-xs text-muted" style={{ padding: '1rem', textAlign: 'center' }}>No conversations yet. Start one!</p>}
          {filteredContacts.map(c => {
            const isActive = c.id === activeId;
            const name = getConversationName(c);
            const color = getAvatarColor(name);
            return (
              <div key={c.id} onClick={() => setActiveId(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: isActive ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'transparent',
                  boxShadow: isActive ? '0 4px 14px var(--primary-glow)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '36px', height: '36px', flexShrink: 0,
                    borderRadius: c.type === 'CHANNEL' ? 'var(--radius-sm)' : c.type === 'GROUP' ? '10px' : '50%',
                    background: isActive ? 'rgba(255,255,255,0.25)' : `linear-gradient(135deg, ${color}, ${color}99)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.75rem', color: '#fff',
                  }}>
                    {c.type === 'CHANNEL' ? <Hash size={16} /> : c.type === 'GROUP' ? <Users size={16} /> : getInitials(name)}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-sm font-semibold" style={{ color: isActive ? '#fff' : 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                  <p style={{ fontSize: '0.7rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--secondary-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.messages?.[0] ? c.messages[0].text : c.type}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      {activeContact && (
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: activeContact.type === 'CHANNEL' ? 'var(--radius-sm)' : activeContact.type === 'GROUP' ? '12px' : '50%',
              background: `linear-gradient(135deg, ${getAvatarColor(getConversationName(activeContact))}, var(--primary))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {activeContact.type === 'CHANNEL' ? <Hash size={18} /> : activeContact.type === 'GROUP' ? <Users size={18} /> : getInitials(getConversationName(activeContact))}
            </div>
            <div>
              <h3 className="font-bold text-sm">{getConversationName(activeContact)}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                {activeContact.type === 'CHANNEL' ? 'All Team' : activeContact.type === 'GROUP' ? `${activeContact.participants.length} members` : 'Direct Message'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--secondary-foreground)', marginTop: '4rem' }}>
                <p className="text-sm">No messages yet. Say hello! 👋</p>
              </div>
            )}
            {messages.map(m => {
              const isMe = m.sender.id === user.id;
              const color = getAvatarColor(m.sender.name);
              const timeString = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isMe && (
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {getInitials(m.sender.name)}
                      </div>
                    )}
                    <span className="text-xs font-semibold">{isMe ? "You" : m.sender.name}</span>
                    <span className="text-xs text-muted">{timeString}</span>
                  </div>
                  <div style={{
                    background: isMe ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'var(--secondary)',
                    color: isMe ? '#fff' : 'var(--foreground)',
                    padding: '0.6rem 1rem', borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                    maxWidth: '65%', lineHeight: 1.5, fontSize: '0.875rem',
                    boxShadow: isMe ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)',
                    wordBreak: 'break-word'
                  }}>
                    {renderMessageText(m.text)}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--surface-border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--overlay-bg)', padding: '0.4rem 0.4rem 0.4rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--surface-border)', transition: 'border-color var(--transition-fast)' }}>
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder={`Message ${getConversationName(activeContact)}...`}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', fontSize: '0.875rem' }} />
              <button onClick={sendMessage} disabled={!text.trim()} className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', width: '38px', height: '38px', padding: 0, flexShrink: 0, opacity: !text.trim() ? 0.5 : 1 }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowNewModal(false)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <h2 className="font-bold">New Conversation</h2>
              <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={() => setShowNewModal(false)}><X size={18} /></button>
            </div>
            
            {/* Type Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--secondary)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
              {(["direct", "group"] as const).map(t => (
                <button key={t} onClick={() => { setNewType(t); setSelectedMembers([]); }}
                  className={newType === t ? "btn btn-primary" : "btn btn-ghost"}
                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', textTransform: 'capitalize', gap: '0.4rem' }}>
                  {t === 'direct' ? <><Users size={14} /> Direct Message</> : <><Users size={14} /> Group Chat</>}
                </button>
              ))}
            </div>

            {newType === 'group' && (
              <input className="input" placeholder="Group name (optional)" value={groupName} onChange={e => setGroupName(e.target.value)} style={{ marginBottom: '1rem' }} />
            )}

            <p className="text-xs text-muted font-semibold" style={{ marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {newType === 'direct' ? 'Select a person' : 'Select members'}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem', maxHeight: '200px', overflowY: 'auto' }}>
              {allUsers.length === 0 && <p className="text-xs text-muted">Loading team members...</p>}
              {allUsers.map(m => {
                const selected = selectedMembers.includes(m.id);
                return (
                  <div key={m.id} onClick={() => toggleMember(m.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: selected ? 'var(--primary-glow)' : 'var(--secondary)',
                    border: `1px solid ${selected ? 'var(--primary)' : 'transparent'}`,
                    transition: 'all var(--transition-fast)',
                  }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${getAvatarColor(m.name)}, ${getAvatarColor(m.name)}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                      {getInitials(m.name)}
                    </div>
                    <span className="text-sm font-medium" style={{ flex: 1, color: selected ? 'var(--primary-2)' : 'var(--foreground)' }}>{m.name}</span>
                    {selected && <Check size={16} color="var(--primary-2)" />}
                  </div>
                );
              })}
            </div>

            <button onClick={createConversation} disabled={selectedMembers.length === 0} className="btn btn-primary" style={{ width: '100%', opacity: selectedMembers.length === 0 ? 0.5 : 1 }}>
              {newType === 'direct' ? 'Start Direct Message' : `Create Group (${selectedMembers.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
