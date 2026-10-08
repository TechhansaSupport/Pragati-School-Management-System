import React, { useState } from 'react';
import { Search, Send, Bell, MessageSquare, Megaphone, MoreVertical, Plus, User, FileText, Image as ImageIcon } from 'lucide-react';

const mockMessages = [
  { id: 1, sender: 'Mrs. Sharma', role: 'Teacher', avatar: 'S', preview: 'The math assignment is due tomorrow.', time: '10:42 AM', unread: 2 },
  { id: 2, sender: 'Rajesh Kumar', role: 'Parent', avatar: 'R', preview: 'Can we schedule a meeting next week?', time: 'Yesterday', unread: 0 },
  { id: 3, sender: 'Admin Office', role: 'System', avatar: 'A', preview: 'Holiday notice for upcoming festival.', time: 'Monday', unread: 0 },
  { id: 4, sender: 'Dr. Desai', role: 'Principal', avatar: 'D', preview: 'Staff meeting at 4 PM today.', time: 'Oct 2', unread: 0 },
];

const mockChatHistory = [
  { id: 1, sender: 'Mrs. Sharma', text: 'Hello! I wanted to update you on Rahul\'s progress in Mathematics.', time: '10:30 AM', isMine: false },
  { id: 2, sender: 'Me', text: 'Hi Mrs. Sharma, thank you for reaching out. How is he doing?', time: '10:35 AM', isMine: true },
  { id: 3, sender: 'Mrs. Sharma', text: 'He has improved significantly! The extra practice sheets are helping. The new assignment is due tomorrow.', time: '10:42 AM', isMine: false },
];

const Communication = () => {
  const [activeTab, setActiveTab] = useState('messages'); // 'messages', 'announcements'
  const [selectedChat, setSelectedChat] = useState(mockMessages[0]);
  const [replyText, setReplyText] = useState('');

  return (
    <div style={{ display: 'flex', gap: '24px', width: '100%', height: '100%' }}>
      {/* Left Sidebar - Contacts/Channels */}
      <div className="card" style={{ width: '320px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Communication</h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button 
              onClick={() => setActiveTab('messages')}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', backgroundColor: activeTab === 'messages' ? 'var(--color-primary)' : 'var(--color-bg)', color: activeTab === 'messages' ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s' }}
            >
              Messages
            </button>
            <button 
              onClick={() => setActiveTab('announcements')}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', backgroundColor: activeTab === 'announcements' ? 'var(--color-primary)' : 'var(--color-bg)', color: activeTab === 'announcements' ? 'white' : 'var(--color-text-muted)', transition: 'all 0.2s' }}
            >
              Notice Board
            </button>
          </div>
          <div className="table-search" style={{ margin: 0, width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748B' }} />
            <input type="text" placeholder="Search..." style={{ outline: 'none', width: '100%' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'messages' ? (
            <div>
              {mockMessages.map(msg => (
                <div 
                  key={msg.id} 
                  onClick={() => setSelectedChat(msg)}
                  style={{ padding: '16px 20px', display: 'flex', gap: '12px', cursor: 'pointer', borderBottom: '1px solid var(--color-bg)', backgroundColor: selectedChat?.id === msg.id ? 'var(--color-bg)' : 'transparent', transition: 'background-color 0.2s' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 }}>
                    {msg.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{msg.sender}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{msg.time}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500, marginBottom: '4px' }}>{msg.role}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.preview}
                    </div>
                  </div>
                  {msg.unread > 0 && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '10px', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, marginTop: '2px' }}>
                      {msg.unread}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px' }}>
              <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '12px', border: '1px solid #BFDBFE', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E3A8A', fontWeight: 600, marginBottom: '8px' }}>
                  <Megaphone size={16} /> Annual Sports Day
                </div>
                <p style={{ fontSize: '0.85rem', color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
                  The Annual Sports meet is scheduled for Nov 15. All participants must submit their forms by Friday.
                </p>
                <div style={{ fontSize: '0.75rem', color: '#60A5FA', marginTop: '12px' }}>Posted 2 hours ago</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontWeight: 600, marginBottom: '8px' }}>
                  <Bell size={16} /> Fee Payment Deadline
                </div>
                <p style={{ fontSize: '0.85rem', color: '#B91C1C', margin: 0, lineHeight: 1.5 }}>
                  Reminder: Term 2 fee payment deadline is approaching on Oct 10th. Please ignore if already paid.
                </p>
                <div style={{ fontSize: '0.75rem', color: '#F87171', marginTop: '12px' }}>Posted Yesterday</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {activeTab === 'messages' && selectedChat ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.2rem' }}>
                  {selectedChat.avatar}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>{selectedChat.sender}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{selectedChat.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)' }}>
                <Search size={20} style={{ cursor: 'pointer' }} />
                <MoreVertical size={20} style={{ cursor: 'pointer' }} />
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--color-bg)' }}>
              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                <span style={{ padding: '4px 12px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Today
                </span>
              </div>
              
              {mockChatHistory.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '70%', 
                    padding: '12px 16px', 
                    borderRadius: '16px', 
                    backgroundColor: msg.isMine ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: msg.isMine ? 'white' : 'var(--color-text-main)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    borderBottomRightRadius: msg.isMine ? '4px' : '16px',
                    borderBottomLeftRadius: msg.isMine ? '16px' : '4px',
                    lineHeight: 1.5,
                    fontSize: '0.95rem'
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px', padding: '0 4px' }}>
                    {msg.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div style={{ padding: '20px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button style={{ padding: '10px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-bg)', borderRadius: '24px', padding: '8px 16px', border: '1px solid var(--color-border)' }}>
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.95rem', color: 'var(--color-text-main)' }}
                  />
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--color-text-muted)', marginLeft: '12px' }}>
                    <ImageIcon size={20} style={{ cursor: 'pointer' }} />
                    <FileText size={20} style={{ cursor: 'pointer' }} />
                  </div>
                </div>
                <button 
                  style={{ 
                    padding: '12px', 
                    borderRadius: '50%', 
                    border: 'none', 
                    backgroundColor: replyText.trim() ? 'var(--color-primary)' : 'var(--color-border)', 
                    color: 'white', 
                    cursor: replyText.trim() ? 'pointer' : 'not-allowed', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <Send size={18} style={{ marginLeft: '2px', marginTop: '2px' }} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <MessageSquare size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '8px' }}>Your Messages</h3>
            <p style={{ fontSize: '0.95rem' }}>Select a conversation or start a new one.</p>
            <button className="btn-outline" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
              <Plus size={16} /> New Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Communication;
