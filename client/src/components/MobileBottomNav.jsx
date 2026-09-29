import React from 'react';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav({ onNavigate, currentPath }) {
  const { user, counts, openAuthModal } = useAuth();

  const handleSellClick = () => {
    if (!user) {
      openAuthModal('login', () => onNavigate('/sell'));
    } else {
      onNavigate('/sell');
    }
  };

  const handleProfileClick = () => {
    if (!user) {
      openAuthModal('login');
    } else {
      onNavigate('/dashboard');
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-items">
        {/* Home */}
        <button 
          onClick={() => onNavigate('/')}
          className={`mobile-nav-btn ${currentPath === '/' ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>Home</span>
        </button>

        {/* Browse */}
        <button 
          onClick={() => onNavigate('/browse')}
          className={`mobile-nav-btn ${currentPath === '/browse' ? 'active' : ''}`}
        >
          <Compass size={20} />
          <span>Browse</span>
        </button>

        {/* Sell / Rent (Center Raised) */}
        <button 
          onClick={handleSellClick}
          className="mobile-sell-btn"
          title="Sell or Rent Item"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* Messages */}
        <button 
          onClick={() => {
            if (!user) openAuthModal('login', () => onNavigate('/messages'));
            else onNavigate('/messages');
          }}
          className={`mobile-nav-btn ${currentPath === '/messages' ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <MessageSquare size={20} />
          {counts.unreadMessages > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '25%',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '0.6rem',
              fontWeight: 700,
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {counts.unreadMessages}
            </span>
          )}
          <span>Chat</span>
        </button>

        {/* Profile */}
        <button 
          onClick={handleProfileClick}
          className={`mobile-nav-btn ${currentPath.startsWith('/dashboard') || currentPath === '/profile' ? 'active' : ''}`}
        >
          <User size={20} />
          <span>{user ? 'Account' : 'Login'}</span>
        </button>
      </div>
    </nav>
  );
}
