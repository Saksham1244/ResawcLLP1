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

  // Deduplicate DIRECT conversations to ensure no user appears multiple times
  const uniqueConversations: Conversation[] = [];
  const seenDirectUsers = new Set<string>();

  for (const c of conversations) {
    if (c.type === "DIRECT") {
      const other = c.participants.find(p => p.user.id !== user?.id);
      const otherId = other?.user.id || c.id;
      if (seenDirectUsers.has(otherId)) continue;
      seenDirectUsers.add(otherId);
    }
    uniqueConversations.push(c);
  }

  const filteredContacts = uniqueConversations.filter(c => getConversationName(c).toLowerCase().includes(query.toLowerCase()));
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

    // If starting a direct message, check if one already exists with this user
    if (newType === "direct" && selectedMembers.length === 1) {
      const targetUserId = selectedMembers[0];
      const existing = conversations.find(c =>
        c.type === "DIRECT" && c.participants.some(p => p.user.id === targetUserId)
      );
      if (existing) {
        setActiveId(existing.id);
        setShowNewModal(false);
        setSelectedMembers([]);
        return;
      }
    }

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
        setConversations(prev => {
          const exists = prev.some(c => c.id === data.data.id);
          return exists ? prev : [data.data, ...prev];
        });
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

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280', fontFamily: 'Inter, system-ui, sans-serif' }}>
      Loading chat...
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', background: '#F5F7FB', fontFamily: 'Inter, system-ui, sans-serif', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>

      {/* ── LEFT PANEL: Conversation List ── */}
      <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #E5E7EB' }}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Messages</h2>
          <button
            onClick={() => setShowNewModal(true)}
            style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#1A56DB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search chats..."
              style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', background: '#F9FAFB', color: '#111827', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 && (
            <p style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: '13px', color: '#9CA3AF' }}>No conversations yet. Start one!</p>
          )}
          {filteredContacts.map(c => {
            const isActive = c.id === activeId;
            const name = getConversationName(c);
            const color = getAvatarColor(name);
            const lastMsg = c.messages?.[0]?.text || (c.type === 'CHANNEL' ? 'Channel' : c.type === 'GROUP' ? 'Group' : 'Direct Message');

            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', cursor: 'pointer',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  borderLeft: isActive ? '3px solid #1A56DB' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {/* Avatar */}
                <div style={{
                  width: '38px', height: '38px', flexShrink: 0,
                  borderRadius: c.type === 'CHANNEL' ? '6px' : c.type === 'GROUP' ? '10px' : '50%',
                  background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '13px', color: '#fff',
                }}>
                  {c.type === 'CHANNEL' ? <Hash size={15} /> : c.type === 'GROUP' ? <Users size={15} /> : getInitials(name)}
                </div>

                {/* Name + Preview */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: isActive ? '#1A56DB' : '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                    {lastMsg}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 0 }}>

        {!activeContact ? (
          /* Empty State */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#6B7280' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={28} color="#1A56DB" />
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>Select a conversation</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>Choose from the left or start a new chat</p>
          </div>
        ) : (
          <>
            {/* Top Bar */}
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, background: '#fff' }}>
              <div style={{
                width: '38px', height: '38px', flexShrink: 0,
                borderRadius: activeContact.type === 'CHANNEL' ? '6px' : activeContact.type === 'GROUP' ? '10px' : '50%',
                background: getAvatarColor(getConversationName(activeContact)),
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '13px',
              }}>
                {activeContact.type === 'CHANNEL' ? <Hash size={16} /> : activeContact.type === 'GROUP' ? <Users size={16} /> : getInitials(getConversationName(activeContact))}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>{getConversationName(activeContact)}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                  {activeContact.type === 'CHANNEL' ? 'All Team' : activeContact.type === 'GROUP' ? `${activeContact.participants.length} members` : 'Direct Message'}
                </p>
              </div>
            </div>

            {/* Message List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#F5F7FB' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '3rem' }}>
                  <p style={{ fontSize: '14px', margin: 0 }}>No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map(m => {
                const isMe = m.sender.id === user.id;
                const color = getAvatarColor(m.sender.name);
                const dateObj = new Date(m.createdAt);
                const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateString = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '4px' }}>
                    {/* Sender name + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!isMe && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {getInitials(m.sender.name)}
                        </div>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{isMe ? 'You' : m.sender.name}</span>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{dateString} · {timeString}</span>
                    </div>

                    {/* Bubble */}
                    <div style={{
                      background: isMe ? '#1A56DB' : '#fff',
                      color: isMe ? '#fff' : '#111827',
                      padding: '0.55rem 0.9rem',
                      borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                      maxWidth: '60%', lineHeight: 1.55, fontSize: '14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      border: isMe ? 'none' : '1px solid #E5E7EB',
                      wordBreak: 'break-word',
                    }}>
                      {renderMessageText(m.text)}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid #E5E7EB', flexShrink: 0, background: '#fff' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.4rem 0.4rem 0.4rem 0.85rem' }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder={`Message ${getConversationName(activeContact)}...`}
                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#111827', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  style={{
                    width: '36px', height: '36px', borderRadius: '6px', border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
                    background: text.trim() ? '#1A56DB' : '#E5E7EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s',
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── New Conversation Modal ── */}
      {showNewModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setShowNewModal(false)}
        >
          <div
            style={{ width: '100%', maxWidth: '420px', background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>New Conversation</h2>
              <button onClick={() => setShowNewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Type Toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#F3F4F6', borderRadius: '6px', padding: '3px' }}>
              {(["direct", "group"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setNewType(t); setSelectedMembers([]); }}
                  style={{
                    flex: 1, padding: '0.45rem 0.5rem', fontSize: '13px', fontWeight: 600,
                    borderRadius: '5px', border: 'none', cursor: 'pointer',
                    background: newType === t ? '#1A56DB' : 'transparent',
                    color: newType === t ? '#fff' : '#6B7280',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontFamily: 'inherit',
                  }}
                >
                  <Users size={13} />
                  {t === 'direct' ? 'Direct Message' : 'Group Chat'}
                </button>
              ))}
            </div>

            {newType === 'group' && (
              <input
                placeholder="Group name (optional)"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none', color: '#111827', marginBottom: '1rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            )}

            <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              {newType === 'direct' ? 'Select a person' : 'Select members'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1.25rem', maxHeight: '200px', overflowY: 'auto' }}>
              {allUsers.length === 0 && <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Loading team members...</p>}
              {allUsers.map(m => {
                const selected = selectedMembers.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem',
                      borderRadius: '6px', cursor: 'pointer',
                      background: selected ? '#EFF6FF' : '#F9FAFB',
                      border: `1px solid ${selected ? '#1A56DB' : '#E5E7EB'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: getAvatarColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {getInitials(m.name)}
                    </div>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: selected ? '#1A56DB' : '#111827' }}>{m.name}</span>
                    {selected && <Check size={15} color="#1A56DB" />}
                  </div>
                );
              })}
            </div>

            <button
              onClick={createConversation}
              disabled={selectedMembers.length === 0}
              style={{
                width: '100%', padding: '0.65rem', borderRadius: '6px', border: 'none', cursor: selectedMembers.length === 0 ? 'not-allowed' : 'pointer',
                background: selectedMembers.length === 0 ? '#E5E7EB' : '#1A56DB',
                color: selectedMembers.length === 0 ? '#9CA3AF' : '#fff',
                fontWeight: 600, fontSize: '14px', fontFamily: 'inherit', transition: 'background 0.15s',
              }}
            >
              {newType === 'direct' ? 'Start Direct Message' : `Create Group (${selectedMembers.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
