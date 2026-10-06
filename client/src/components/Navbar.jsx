import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ShoppingBag, Search, PlusCircle, Heart, MessageSquare, Bell, 
  User, LogOut, Shield, ChevronDown, Menu, X, BookOpen, Layers,
  ExternalLink, Check
} from 'lucide-react';

export default function Navbar({ onNavigate, currentPath, searchParams, setSearchParams }) {
  const { user, isAdmin, counts, logout, openAuthModal } = useAuth();
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams?.search || '');
  const [selectedCat, setSelectedCat] = useState(searchParams?.category || 'All');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  // Fetch categories for search select
  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories || [])).catch(() => {});
  }, []);

  // Sync search input if changed externally
  useEffect(() => {
    if (searchParams?.search !== undefined) {
      setSearchInput(searchParams.search);
    }
  }, [searchParams?.search]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('/browse', {
      search: searchInput.trim(),
      category: selectedCat === 'All' ? '' : selectedCat
    });
  };

  const handleOpenNotifications = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && user) {
      try {
        const res = await api.getNotifications();
        setNotifications(res.notifications || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkNotifRead = async (id, link) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setIsNotifOpen(false);
      if (link) {
        onNavigate(link);
      }
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {}
  };

  // Only show categories that have available products
  const availableCategories = categories.filter(cat => cat.active_count === undefined || cat.active_count > 0);

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-top">
          {/* Brand Logo */}
          <a 
            href="/" 
            onClick={(e) => { e.preventDefault(); onNavigate('/'); }} 
            className="brand-logo"
            title="CampusMarket — Student Marketplace"
          >
            <div className="logo-icon">
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
            <span>CampusMarket</span>
          </a>

          {/* Desktop Search Bar */}
          <div className="header-search">
            <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
              <div className="search-icon-left">
                <Search size={18} />
              </div>
              <input 
                type="text"
                placeholder="Search books, notes, calculators, electronics, hostel items..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-main-input"
              />
              <select 
                value={selectedCat} 
                onChange={(e) => setSelectedCat(e.target.value)}
                className="search-category-select"
              >
                <option value="All">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <button type="submit" className="search-btn-submit">
                Search
              </button>
            </form>
          </div>

          {/* Navigation Actions */}
          <div className="header-actions">
            <a 
              href="/browse" 
              onClick={(e) => { e.preventDefault(); onNavigate('/browse'); }} 
              className={`nav-link ${currentPath === '/browse' ? 'active' : ''}`}
            >
              <Layers size={17} />
              <span className="hide-mobile">Browse</span>
            </a>

            <a 
              href="/requests" 
              onClick={(e) => { e.preventDefault(); onNavigate('/requests'); }} 
              className={`nav-link ${currentPath === '/requests' ? 'active' : ''}`}
            >
              <BookOpen size={17} />
              <span className="hide-mobile">Requests</span>
            </a>

            {user ? (
              <>
                {/* Wishlist */}
                <button 
                  onClick={() => onNavigate('/dashboard', { tab: 'wishlist' })} 
                  className="btn-icon" 
                  title="Saved Items"
                  style={{ position: 'relative' }}
                >
                  <Heart size={19} />
                  {counts.wishlistCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--danger)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {counts.wishlistCount}
                    </span>
                  )}
                </button>

                {/* Messages */}
                <button 
                  onClick={() => onNavigate('/messages')} 
                  className="btn-icon" 
                  title="Messages"
                  style={{ position: 'relative' }}
                >
                  <MessageSquare size={19} />
                  {counts.unreadMessages > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--primary)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {counts.unreadMessages}
                    </span>
                  )}
                </button>

                {/* Notifications */}
                <div style={{ position: 'relative' }} ref={notifRef}>
                  <button 
                    onClick={handleOpenNotifications} 
                    className="btn-icon" 
                    title="Notifications"
                    style={{ position: 'relative' }}
                  >
                    <Bell size={19} />
                    {counts.unreadNotifications > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {counts.unreadNotifications}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotifOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '46px',
                      width: '320px',
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 60,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--surface-alt)'
                      }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Notifications</span>
                        <button 
                          onClick={handleMarkAllRead} 
                          style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}
                        >
                          Mark all read
                        </button>
                      </div>
                      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id}
                              onClick={() => handleMarkNotifRead(n.id, n.link)}
                              style={{
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid var(--border-light)',
                                background: n.is_read ? '#fff' : 'var(--primary-light)',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                                {n.title}
                              </div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-body)', lineHeight: 1.4 }}>
                                {n.message}
                              </div>
                              <div style={{ fontSize: '0.675rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div style={{ position: 'relative' }} ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.35rem 0.6rem',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface)'
                    }}
                  >
                    <img 
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                      alt={user.name} 
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} color="var(--text-muted)" />
                  </button>

                  {isUserMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '46px',
                      width: '230px',
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 60,
                      overflow: 'hidden',
                      padding: '0.5rem 0'
                    }}>
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                        {user.college && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                            {user.college}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '0.25rem 0' }}>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); onNavigate('/dashboard', { tab: 'listings' }); }}
                          className="nav-link"
                          style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          My Listings ({counts.activeListings || 0})
                        </button>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); onNavigate('/dashboard', { tab: 'orders' }); }}
                          className="nav-link"
                          style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          My Orders & Purchases
                        </button>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); onNavigate('/dashboard', { tab: 'rentals' }); }}
                          className="nav-link"
                          style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          My Rentals & Lent Items
                        </button>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); onNavigate('/dashboard', { tab: 'requests' }); }}
                          className="nav-link"
                          style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          My Item Requests
                        </button>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); onNavigate('/profile'); }}
                          className="nav-link"
                          style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          Profile Settings
                        </button>
                      </div>

                      {isAdmin && (
                        <div style={{ borderTop: '1px solid var(--border-light)', padding: '0.25rem 0' }}>
                          <button 
                            onClick={() => { setIsUserMenuOpen(false); onNavigate('/admin'); }}
                            className="nav-link"
                            style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}
                          >
                            <Shield size={15} /> Admin Dashboard
                          </button>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-light)', padding: '0.25rem 0' }}>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); logout(); onNavigate('/'); }}
                          className="nav-link"
                          style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--danger)' }}
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sell / Rent CTA Button */}
                <button 
                  onClick={() => onNavigate('/sell')} 
                  className="btn btn-primary"
                  style={{ gap: '0.4rem' }}
                >
                  <PlusCircle size={16} />
                  <span>Sell / Rent</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => openAuthModal('login')} 
                  className="btn btn-secondary"
                >
                  Log In
                </button>
                <button 
                  onClick={() => openAuthModal('register')} 
                  className="btn btn-primary"
                >
                  Register
                </button>
                <button 
                  onClick={() => openAuthModal('login', () => onNavigate('/sell'))} 
                  className="btn btn-accent"
                  style={{ gap: '0.4rem' }}
                >
                  <PlusCircle size={16} />
                  <span>Sell / Rent</span>
                </button>
              </>
            )}

            {/* Mobile Hamburger */}
            <button 
              className="btn-icon" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ display: 'none' }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Category Strip */}
      <div className="header-category-bar">
        <div className="container">
          <div className="category-bar-list">
            <button 
              onClick={() => onNavigate('/browse', { category: '' })}
              className={`category-chip ${!searchParams?.category || searchParams?.category === 'All' ? 'active' : ''}`}
            >
              All Categories
            </button>
            {availableCategories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => onNavigate('/browse', { category: cat.name })}
                className={`category-chip ${searchParams?.category === cat.name ? 'active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
