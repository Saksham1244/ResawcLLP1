"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Search, Plus, X, Users, Hash, Check } from "lucide-react";

type MessageType = { id: number; sender: string; time: string; text: string };
type Contact = {
  id: number;
  name: string;
  type: "channel" | "direct" | "group";
  status?: string;
  unread?: number;
  members?: string[];
  avatar?: string;
};

const AVATAR_COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#a78bfa", "#06b6d4"];

const INITIAL_CONTACTS: Contact[] = [
  { id: 1, name: "General Channel", type: "channel", unread: 0 },
];

const INITIAL_MESSAGES: Record<number, MessageType[]> = {
  1: [],
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ChatSystem() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [messages, setMessages] = useState<Record<number, MessageType[]>>(INITIAL_MESSAGES);
  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newType, setNewType] = useState<"direct" | "group">("direct");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [allMembers, setAllMembers] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data.success) {
          setAllMembers(data.data.map((u: any) => u.name));
        }
      } catch (err) {}
    }
    loadMembers();
  }, []);

  const activeContact = contacts.find(c => c.id === activeId)!;
  const activeMessages = messages[activeId] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

  const sendMessage = () => {
    if (!text.trim()) return;
    const newMsg: MessageType = { id: Date.now(), sender: "You", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: text.trim() };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMsg] }));
    setText("");
  };

  const createConversation = () => {
    if (selectedMembers.length === 0) return;
    const newId = Date.now();
    let newContact: Contact;

    if (newType === "direct") {
      newContact = { id: newId, name: selectedMembers[0], type: "direct", status: "online", unread: 0 };
    } else {
      const name = groupName.trim() || selectedMembers.slice(0, 2).join(", ");
      newContact = { id: newId, name, type: "group", members: selectedMembers, unread: 0 };
    }

    setContacts(prev => [...prev, newContact]);
    setMessages(prev => ({ ...prev, [newId]: [] }));
    setActiveId(newId);
    setShowNewModal(false);
    setSelectedMembers([]);
    setGroupName("");
  };

  const toggleMember = (m: string) => {
    setSelectedMembers(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : newType === "direct" ? [m] : [...prev, m]
    );
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', gap: '1.25rem' }}>

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
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
            className="input" style={{ paddingLeft: '2rem', fontSize: '0.8rem', padding: '0.5rem 0.7rem 0.5rem 2rem' }} />
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {filteredContacts.map(c => {
            const isActive = c.id === activeId;
            const color = getAvatarColor(c.name);
            return (
              <div key={c.id} onClick={() => { setActiveId(c.id); setContacts(prev => prev.map(x => x.id === c.id ? { ...x, unread: 0 } : x)); }}
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
                    borderRadius: c.type === 'channel' ? 'var(--radius-sm)' : c.type === 'group' ? '10px' : '50%',
                    background: isActive ? 'rgba(255,255,255,0.25)' : `linear-gradient(135deg, ${color}, ${color}99)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.75rem', color: '#fff',
                  }}>
                    {c.type === 'channel' ? <Hash size={16} /> : c.type === 'group' ? <Users size={16} /> : getInitials(c.name)}
                  </div>
                  {c.type === 'direct' && (
                    <div style={{
                      position: 'absolute', bottom: '-1px', right: '-1px',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: c.status === 'online' ? '#10b981' : '#6b7280',
                      border: '2px solid var(--glass-bg)',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-sm font-semibold" style={{ color: isActive ? '#fff' : 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                  {c.type === 'direct' && <p style={{ fontSize: '0.7rem', color: isActive ? 'rgba(255,255,255,0.7)' : c.status === 'online' ? '#10b981' : 'var(--secondary-foreground)' }}>{c.status}</p>}
                  {c.type === 'group' && <p style={{ fontSize: '0.7rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--secondary-foreground)' }}>{c.members?.length} members</p>}
                </div>
                {(c.unread ?? 0) > 0 && !isActive && (
                  <div style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', flexShrink: 0 }}>{c.unread}</div>
                )}
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
              width: '40px', height: '40px', borderRadius: activeContact.type === 'channel' ? 'var(--radius-sm)' : activeContact.type === 'group' ? '12px' : '50%',
              background: `linear-gradient(135deg, ${getAvatarColor(activeContact.name)}, var(--primary))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {activeContact.type === 'channel' ? <Hash size={18} /> : activeContact.type === 'group' ? <Users size={18} /> : getInitials(activeContact.name)}
            </div>
            <div>
              <h3 className="font-bold text-sm">{activeContact.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary-foreground)' }}>
                {activeContact.type === 'channel' ? 'All Team' : activeContact.type === 'group' ? `${activeContact.members?.join(', ')}` : activeContact.status}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activeMessages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--secondary-foreground)', marginTop: '4rem' }}>
                <p className="text-sm">No messages yet. Say hello! 👋</p>
              </div>
            )}
            {activeMessages.map(m => {
              const isMe = m.sender === "You";
              const color = getAvatarColor(m.sender);
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isMe && (
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {getInitials(m.sender)}
                      </div>
                    )}
                    <span className="text-xs font-semibold">{m.sender}</span>
                    <span className="text-xs text-muted">{m.time}</span>
                  </div>
                  <div style={{
                    background: isMe ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'var(--secondary)',
                    color: isMe ? '#fff' : 'var(--foreground)',
                    padding: '0.6rem 1rem', borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                    maxWidth: '65%', lineHeight: 1.5, fontSize: '0.875rem',
                    boxShadow: isMe ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)',
                  }}>
                    {m.text}
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
                placeholder={`Message ${activeContact.name}...`}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', fontSize: '0.875rem' }} />
              <button onClick={sendMessage} className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', width: '38px', height: '38px', padding: 0, flexShrink: 0 }}>
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
              {allMembers.length === 0 && <p className="text-xs text-muted">Loading team members...</p>}
              {allMembers.map(m => {
                const selected = selectedMembers.includes(m);
                return (
                  <div key={m} onClick={() => toggleMember(m)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: selected ? 'var(--primary-glow)' : 'var(--secondary)',
                    border: `1px solid ${selected ? 'var(--primary)' : 'transparent'}`,
                    transition: 'all var(--transition-fast)',
                  }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${getAvatarColor(m)}, ${getAvatarColor(m)}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>
                      {getInitials(m)}
                    </div>
                    <span className="text-sm font-medium" style={{ flex: 1, color: selected ? 'var(--primary-2)' : 'var(--foreground)' }}>{m}</span>
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
