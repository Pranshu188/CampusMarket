import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, ShoppingBag, ArrowLeft, Check, CheckCheck, 
  ExternalLink, User, MapPin, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MessagesPage({ params = {}, onNavigate }) {
  const { user, openAuthModal, refreshCounts } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(params.initialText || '');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations
  const loadConversations = async (autoSelectId = null) => {
    try {
      setLoading(true);
      const res = await api.getConversations();
      const list = res.conversations || [];
      setConversations(list);

      if (autoSelectId) {
        const found = list.find(c => c.id === autoSelectId);
        if (found) selectConversation(found);
      } else if (list.length > 0 && !activeConv) {
        selectConversation(list[0]);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    // If navigated with productId and sellerId, start/open conversation
    if (params.productId && params.sellerId) {
      initiateConversationWithProduct(params.productId, params.sellerId, params.initialText);
    } else if (params.recipientId) {
      initiateConversationWithUser(params.recipientId, params.initialText);
    } else {
      loadConversations();
    }
  }, [user, params.productId, params.sellerId, params.recipientId]);

  const initiateConversationWithProduct = async (prodId, sellerId, text) => {
    try {
      setLoading(true);
      const initialMsg = text || 'Hi! Is this item still available?';
      const res = await api.sendMessage({
        product_id: parseInt(prodId),
        seller_id: parseInt(sellerId),
        text: initialMsg
      });
      refreshCounts();
      await loadConversations(res.conversation_id);
    } catch (err) {
      console.error('Failed to start conversation:', err);
      loadConversations();
    }
  };

  const initiateConversationWithUser = async (recipientId, text) => {
    try {
      setLoading(true);
      const res = await api.sendMessage({
        seller_id: parseInt(recipientId),
        text: text || 'Hi! I saw your request on CampusMarket.'
      });
      refreshCounts();
      await loadConversations(res.conversation_id);
    } catch (err) {
      console.error('Failed to start chat:', err);
      loadConversations();
    }
  };

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    try {
      const res = await api.getConversationById(conv.id);
      setMessages(res.messages || []);
      refreshCounts();
    } catch (err) {
      console.error('Error fetching conversation:', err);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await api.sendMessage({
        conversation_id: activeConv.id,
        text: messageText
      });
      setMessages(prev => [...prev, res.message]);
      // Update last message in list
      setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, last_message: messageText, last_message_at: new Date().toISOString() } : c));
      refreshCounts();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="container" style={{ paddingTop: '1.25rem', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.2rem' }}>Student Messages</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Connect securely with buyers and sellers to discuss condition, editions, and arrange campus handovers.
        </p>
      </div>

      <div className="chat-container">
        {/* LEFT COLUMN: CONVERSATION LIST */}
        <div className="chat-conversations-list">
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
            Active Conversations ({conversations.length})
          </div>

          {loading && conversations.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading messages...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>No conversations yet</p>
              <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                Find an item on the marketplace and click "Chat with Seller" to start a conversation.
              </p>
            </div>
          ) : (
            conversations.map(conv => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <div 
                  key={conv.id} 
                  className={`conv-item ${isSelected ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <img 
                    src={conv.other_user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.other_user_name}`} 
                    alt={conv.other_user_name} 
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.other_user_name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {conv.product_title && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.15rem' }}>
                        📦 {conv.product_title}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.775rem', color: conv.unread_count > 0 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: conv.unread_count > 0 ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.last_message || 'Started a conversation'}
                      </span>
                      {conv.unread_count > 0 && (
                        <span style={{
                          background: 'var(--primary)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)'
                        }}>
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT PANE */}
        <div className="chat-main-pane">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img 
                    src={activeConv.other_user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${activeConv.other_user_name}`} 
                    alt="" 
                    style={{ width: '38px', height: '38px', borderRadius: '50%' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '0.975rem', margin: 0 }}>{activeConv.other_user_name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activeConv.other_user_college || 'Student Member'}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onNavigate(`/seller/${activeConv.other_user_id}`)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.775rem' }}
                >
                  View Profile
                </button>
              </div>

              {/* Product Reference Banner */}
              {activeConv.product_title && (
                <div className="chat-product-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <img 
                      src={activeConv.product_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=100&q=80'} 
                      alt="" 
                      style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {activeConv.product_title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Price: <strong>{formatPrice(activeConv.product_price || 0)}</strong> • {activeConv.product_location || 'Campus'}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onNavigate(`/products/${activeConv.product_id}`)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    View Item
                  </button>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="chat-messages-scroll">
                <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem' }}>
                  <span style={{ fontSize: '0.75rem', background: 'var(--surface-alt)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>
                    🔒 Direct conversation between student peers. Keep discussions safe and respectful.
                  </span>
                </div>

                {messages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={`msg-bubble ${isMine ? 'msg-outgoing' : 'msg-incoming'}`}
                    >
                      <div>{msg.text}</div>
                      <div className="msg-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMine && (
                          <span style={{ marginLeft: '4px' }}>
                            {msg.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box */}
              <form onSubmit={handleSendMessage} className="chat-input-area">
                <input 
                  type="text" 
                  placeholder="Type a message (e.g. Can we meet at the library after 4 PM?)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="filter-input"
                  style={{ flex: 1 }}
                />
                <button 
                  type="submit" 
                  disabled={sending || !inputText.trim()}
                  className="btn btn-primary"
                  style={{ gap: '0.4rem' }}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3>Select a Conversation</h3>
              <p style={{ fontSize: '0.875rem' }}>Pick a conversation from the left to start chatting with a buyer or seller.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
