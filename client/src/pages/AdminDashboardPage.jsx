import React, { useState, useEffect } from 'react';
import { 
  Shield, Check, X, AlertTriangle, Users, Package, ShoppingBag, 
  Calendar, Layers, Settings, Trash2, ExternalLink, Search, RefreshCw,
  ShieldCheck, CheckCircle2, XCircle, Clock, Mail, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function AdminLoginPortal({ user, onNavigate, onAdminSuccess }) {
  const { login } = useAuth();
  const [adminEmail, setAdminEmail] = useState('admin@campusmarket.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(adminEmail.trim(), adminPassword);
      if (onAdminSuccess) onAdminSuccess();
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setError('');
    setLoading(true);
    try {
      await login('admin@campusmarket.com', 'admin123');
      if (onAdminSuccess) onAdminSuccess();
    } catch (err) {
      setError(err.message || 'Admin sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '1.25rem',
        padding: '2.25rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Portal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.4)',
            marginBottom: '1rem'
          }}>
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.4rem 0' }}>
            CampusMarket Admin Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Dedicated Moderator & Campus Administration Sign-In
          </p>
        </div>

        {/* Notice if currently signed in as non-admin */}
        {user && user.role !== 'admin' && (
          <div style={{
            background: 'rgba(234, 88, 12, 0.15)',
            border: '1px solid rgba(234, 88, 12, 0.4)',
            borderRadius: '0.75rem',
            padding: '0.85rem',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            color: '#fdba74'
          }}>
            <strong>Student Account Active:</strong> You are currently signed in as <strong>{user.name}</strong> ({user.email}). Sign in below with your Moderator credentials to enter Admin mode.
          </div>
        )}

        {/* 1-Click Fast Admin Sign-In */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '0.75rem',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
              ⚡ Quick Admin Access
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
              admin@campusmarket.com
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickAdmin}
            disabled={loading}
            style={{
              padding: '0.45rem 0.85rem',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.775rem',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Entering...' : 'Instant 1-Click'}
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.825rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Admin Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@campusmarket.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Moderator Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Moderator Console →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.825rem',
              cursor: 'pointer'
            }}
          >
            ← Return to Student Campus Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage({ onNavigate }) {
  const { user, isAdmin, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data
  const [stats, setStats] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [verificationsList, setVerificationsList] = useState([]);
  const [verificationFilter, setVerificationFilter] = useState('pending');
  const [ordersList, setOrdersList] = useState([]);
  const [rentalsList, setRentalsList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [requireApproval, setRequireApproval] = useState(false);

  // Rejection modal
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('Does not meet campus student guidelines');

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isAdmin) {
      loadAdminData();
    }
  }, [user, isAdmin, activeTab]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.getAdminStats();
      setStats(statsRes.stats);
      setRequireApproval(statsRes.stats?.requireApproval || false);

      if (activeTab === 'overview' || activeTab === 'moderation') {
        const prodRes = await api.getAdminProducts({ status: 'pending_approval' });
        setPendingProducts(prodRes.products || []);
      }
      if (activeTab === 'overview' || activeTab === 'verifications') {
        const verifRes = await api.getAdminVerifications();
        setVerificationsList(verifRes.students || []);
      }
      if (activeTab === 'products') {
        const allRes = await api.getAdminProducts({ status: 'all' });
        setAllProducts(allRes.products || []);
      }
      if (activeTab === 'users') {
        const usersRes = await api.getAdminUsers();
        setUsersList(usersRes.users || []);
      }
      if (activeTab === 'orders') {
        const ordRes = await api.getAdminOrders();
        setOrdersList(ordRes.orders || []);
      }
      if (activeTab === 'rentals') {
        const rntRes = await api.getAdminRentals();
        setRentalsList(rntRes.rentals || []);
      }
      if (activeTab === 'reports') {
        const repRes = await api.getAdminReports();
        setReportsList(repRes.reports || []);
      }
      if (activeTab === 'categories') {
        const catRes = await api.getCategories();
        setCategoriesList(catRes.categories || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStudent = async (studentId, status, reason = '') => {
    try {
      await api.verifyStudent(studentId, { verification_status: status, reason });
      setVerificationsList(prev => prev.map(s => s.id === studentId ? { ...s, verification_status: status, verification_reason: reason } : s));
      setUsersList(prev => prev.map(u => u.id === studentId ? { ...u, verification_status: status, verification_reason: reason } : u));
      if (stats) {
        const remainingPending = verificationsList.filter(s => s.id !== studentId && s.verification_status === 'pending').length;
        setStats(prev => ({ ...prev, pendingVerifications: remainingPending }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update student verification status');
    }
  };

  const handleApproveProduct = async (id) => {
    try {
      await api.approveProduct(id);
      setPendingProducts(prev => prev.filter(p => p.id !== id));
      if (stats) setStats(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }));
      alert('Product approved and live!');
    } catch (e) {
      alert('Failed to approve');
    }
  };

  const handleRejectProduct = async () => {
    if (!rejectModalItem) return;
    try {
      await api.rejectProduct(rejectModalItem.id, rejectReason);
      setPendingProducts(prev => prev.filter(p => p.id !== rejectModalItem.id));
      if (stats) setStats(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }));
      setRejectModalItem(null);
    } catch (e) {
      alert('Failed to reject');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.updateUserStatus(userId, nextStatus);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    } catch (e) {
      alert('Failed to update user');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await api.updateReportStatus(reportId, { status: 'resolved', admin_action: 'Reviewed and action taken.' });
      setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (e) {
      alert('Failed to update report');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      setNewCatName('');
      setNewCatDesc('');
      const catRes = await api.getCategories();
      setCategoriesList(catRes.categories || []);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(id);
      setCategoriesList(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleRequireApproval = async () => {
    const nextVal = !requireApproval;
    try {
      await api.updateSettings({ require_approval: nextVal });
      setRequireApproval(nextVal);
    } catch (e) {
      alert('Failed to update setting');
    }
  };

  const handleReleaseEscrow = async (orderId) => {
    if (!window.confirm('Release escrow funds to the seller for this order?')) return;
    try {
      await api.adminReleaseEscrow(orderId);
      setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, escrow_status: 'released', payment_status: 'paid' } : o));
      alert('Escrow payout released! Seller has been notified.');
    } catch (e) {
      alert(e.message || 'Failed to release escrow');
    }
  };

  const handleNotifySeller = async (orderId) => {
    try {
      await api.adminNotifySeller(orderId);
      alert('Verified payment details and buyer contacts sent to seller!');
    } catch (e) {
      alert(e.message || 'Failed to notify seller');
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (!user || !isAdmin) {
    return (
      <AdminLoginPortal 
        user={user} 
        onNavigate={onNavigate} 
        onAdminSuccess={loadAdminData} 
      />
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Admin Header */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>CampusMarket Administration & Moderation</h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Moderation Panel • Student Safety & Marketplace Quality Control
            </div>
          </div>
        </div>

        <button onClick={loadAdminData} className="btn btn-secondary btn-sm" style={{ gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      <div className="dashboard-layout">
        {/* SIDEBAR NAVIGATION */}
        <aside className="dashboard-nav">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`dash-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <Shield size={18} /> Overview & Metrics
          </button>

          <button 
            onClick={() => setActiveTab('moderation')}
            className={`dash-nav-item ${activeTab === 'moderation' ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <Check size={18} /> Product Approval
            {stats?.pendingApprovals > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--warning)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)'
              }}>
                {stats.pendingApprovals}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('verifications')}
            className={`dash-nav-item ${activeTab === 'verifications' ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <ShieldCheck size={18} /> Student Verifications
            {stats?.pendingVerifications > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#059669',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)'
              }}>
                {stats.pendingVerifications}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('products')}
            className={`dash-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          >
            <Package size={18} /> All Listings ({stats?.totalListings || 0})
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`dash-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users size={18} /> User Management ({stats?.totalUsers || 0})
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`dash-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <ShoppingBag size={18} /> Orders ({stats?.totalOrders || 0})
          </button>

          <button 
            onClick={() => setActiveTab('rentals')}
            className={`dash-nav-item ${activeTab === 'rentals' ? 'active' : ''}`}
          >
            <Calendar size={18} /> Rentals ({stats?.totalRentals || 0})
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`dash-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          >
            <AlertTriangle size={18} /> Reported Items ({stats?.pendingReports || 0})
          </button>

          <button 
            onClick={() => setActiveTab('categories')}
            className={`dash-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
          >
            <Layers size={18} /> Categories
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`dash-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} /> Moderation Policy
          </button>
        </aside>

        {/* MAIN ADMIN TAB CONTENT */}
        <main>
          {/* TAB 1: OVERVIEW METRICS */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Platform Overview</h2>

              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>STUDENT USERS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{stats.totalUsers}</div>
                  </div>

                  <div 
                    onClick={() => setActiveTab('verifications')}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING VERIFICATIONS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
                      {stats.pendingVerifications || 0}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>LIVE LISTINGS</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>{stats.totalListings}</div>
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PENDING MODERATION</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)', marginTop: '0.25rem' }}>{stats.pendingApprovals}</div>
                  </div>

                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MARKETPLACE VOLUME</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{formatPrice(stats.marketplaceVolume)}</div>
                  </div>
                </div>
              )}

              {/* Pending Student Verifications Alert */}
              {stats?.pendingVerifications > 0 && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', color: '#047857', margin: 0 }}>
                      🎓 {stats.pendingVerifications} Student Account(s) Awaiting Identity & College Verification
                    </h3>
                    <button 
                      onClick={() => setActiveTab('verifications')} 
                      className="btn btn-primary btn-sm" 
                      style={{ background: '#059669', borderColor: '#059669' }}
                    >
                      Review Student Verifications →
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#065f46', margin: 0 }}>
                    Newly registered students have joined CampusMarket. Review their college details, name, and face photo to approve their official student status.
                  </p>
                </div>
              )}

              {/* Pending approval notice if any */}
              {pendingProducts.length > 0 && (
                <div style={{
                  background: 'var(--warning-bg)',
                  border: '1px solid #fed7aa',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--warning)' }}>
                      ⚠️ {pendingProducts.length} Listing(s) Awaiting Review
                    </h3>
                    <button onClick={() => setActiveTab('moderation')} className="btn btn-secondary btn-sm">
                      Go to Approval Queue
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#9a3412', margin: 0 }}>
                    Students have listed new academic items that require quick moderator approval.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCT MODERATION APPROVAL */}
          {activeTab === 'moderation' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem' }}>Product Approval Queue</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Review newly submitted listings before they appear on the marketplace.</p>
                </div>
              </div>

              {pendingProducts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingProducts.map(prod => (
                    <div 
                      key={prod.id} 
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img 
                          src={prod.primary_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80'} 
                          alt="" 
                          style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                        />
                        <div>
                          <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{prod.title}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Listed by: <strong>{prod.seller_name}</strong> ({prod.seller_college || 'Student'}) • Price: {formatPrice(prod.price)}
                          </div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                            {prod.college} {prod.course ? `• ${prod.course}` : ''} {prod.semester ? `• Sem ${prod.semester}` : ''}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleApproveProduct(prod.id)}
                          className="btn btn-primary btn-sm"
                          style={{ gap: '0.35rem' }}
                        >
                          <Check size={14} /> Approve Listing
                        </button>
                        <button 
                          onClick={() => setRejectModalItem(prod)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)', gap: '0.35rem' }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <Check size={36} color="var(--success)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>Approval queue is clear!</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    All student product listings have been reviewed and approved.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2B: STUDENT VERIFICATIONS & IDENTITY APPROVAL */}
          {activeTab === 'verifications' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Student Identity & College Verifications</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                    Review newly registered student accounts, verify their college details & photo, and accept them onto CampusMarket.
                  </p>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setVerificationFilter('pending')}
                    className={`btn btn-sm ${verificationFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                    style={verificationFilter === 'pending' ? { background: '#059669', borderColor: '#059669' } : {}}
                  >
                    Pending Review ({verificationsList.filter(s => s.verification_status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setVerificationFilter('verified')}
                    className={`btn btn-sm ${verificationFilter === 'verified' ? 'btn-primary' : 'btn-secondary'}`}
                    style={verificationFilter === 'verified' ? { background: '#059669', borderColor: '#059669' } : {}}
                  >
                    Verified ({verificationsList.filter(s => s.verification_status === 'verified').length})
                  </button>
                  <button
                    onClick={() => setVerificationFilter('all')}
                    className={`btn btn-sm ${verificationFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    style={verificationFilter === 'all' ? { background: '#059669', borderColor: '#059669' } : {}}
                  >
                    All Students ({verificationsList.length})
                  </button>
                </div>
              </div>

              {/* Student Verification Cards */}
              {(() => {
                const list = verificationsList.filter(s => {
                  if (verificationFilter === 'pending') return s.verification_status === 'pending';
                  if (verificationFilter === 'verified') return s.verification_status === 'verified';
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div style={{
                      padding: '3.5rem 1rem',
                      textAlign: 'center',
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border)'
                    }}>
                      <ShieldCheck size={48} color="#059669" style={{ opacity: 0.6, margin: '0 auto 0.75rem auto' }} />
                      <h3 style={{ margin: '0 0 0.4rem 0' }}>No student accounts in this queue</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                        {verificationFilter === 'pending' ? 'All student registrations have been reviewed and verified!' : 'No student accounts match the selected filter.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {list.map(student => (
                      <div
                        key={student.id}
                        style={{
                          background: 'var(--surface)',
                          border: student.verification_status === 'pending' ? '2px solid #f59e0b' : '1px solid var(--border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem',
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          gap: '1.25rem',
                          alignItems: 'center'
                        }}
                      >
                        {/* Student Photo / Face Avatar */}
                        <div style={{ textAlign: 'center' }}>
                          <img
                            src={student.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`}
                            alt={student.name}
                            style={{
                              width: '70px',
                              height: '70px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--border)',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          />
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
                            ID #{student.id}
                          </div>
                        </div>

                        {/* Student Details */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {student.name}
                            </span>
                            <span className={`badge ${
                              student.verification_status === 'verified' ? 'badge-sell' :
                              student.verification_status === 'pending' ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {student.verification_status === 'verified' ? '✓ Verified Student' :
                               student.verification_status === 'pending' ? '⏳ Pending Admin Review' : '✕ Verification Rejected'}
                            </span>
                            {student.status === 'suspended' && (
                              <span className="badge badge-danger">Suspended</span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            <div>🎓 <strong>College:</strong> {student.college || 'Not specified'}</div>
                            <div>📚 <strong>Course:</strong> {student.course || '—'} {student.branch ? `• ${student.branch}` : ''} {student.semester ? `• Semester ${student.semester}` : ''}</div>
                            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                              <span>✉️ {student.email}</span>
                              {student.phone && <span>📞 {student.phone}</span>}
                              <span>📍 {student.location || 'Campus'}</span>
                              <span>📅 Joined: {new Date(student.created_at).toLocaleDateString()}</span>
                            </div>
                            {student.verification_reason && (
                              <div style={{ marginTop: '0.4rem', fontSize: '0.775rem', color: 'var(--danger)', background: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                                <strong>Admin Note:</strong> {student.verification_reason}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                          {student.verification_status !== 'verified' && (
                            <button
                              onClick={() => handleVerifyStudent(student.id, 'verified')}
                              className="btn btn-primary btn-sm"
                              style={{ gap: '0.4rem', justifyContent: 'center', background: '#059669', borderColor: '#059669' }}
                            >
                              <CheckCircle2 size={15} />
                              Accept & Verify
                            </button>
                          )}

                          {student.verification_status === 'verified' && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              fontSize: '0.8rem',
                              color: '#059669',
                              fontWeight: 700,
                              padding: '0.45rem',
                              background: '#ecfdf5',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid #a7f3d0'
                            }}>
                              <CheckCircle2 size={16} /> Verified Active
                            </div>
                          )}

                          {student.verification_status !== 'rejected' && (
                            <button
                              onClick={() => {
                                const reason = window.prompt('Specify reason for rejecting or requesting student college ID card:', 'Please update your college name or provide student ID');
                                if (reason) handleVerifyStudent(student.id, 'rejected', reason);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ gap: '0.4rem', justifyContent: 'center' }}
                            >
                              <XCircle size={15} />
                              Reject / Request ID
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleUserStatus(student.id, student.status === 'active' ? 'suspended' : 'active')}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '0.75rem',
                              color: student.status === 'active' ? 'var(--danger)' : 'var(--primary)',
                              justifyContent: 'center'
                            }}
                          >
                            {student.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: ALL PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>All Marketplace Listings</h2>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Seller</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.title}</td>
                        <td>{p.category_name}</td>
                        <td>{formatPrice(p.price)}</td>
                        <td>{p.seller_name}</td>
                        <td>
                          <span className={p.status === 'active' ? 'badge badge-sell' : 'badge badge-warning'}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => onNavigate(`/products/${p.id}`)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Student Accounts</h2>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email / Phone</th>
                      <th>College</th>
                      <th>Verification</th>
                      <th>Listings</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <img 
                              src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                              alt=""
                              style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                            />
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{u.email}<br />{u.phone || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{u.college || '—'}</td>
                        <td>
                          <span className={`badge ${
                            u.verification_status === 'verified' ? 'badge-sell' :
                            u.verification_status === 'pending' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {u.verification_status === 'verified' ? '✓ Verified' :
                             u.verification_status === 'pending' ? '⏳ Pending' : '✕ Rejected'}
                          </span>
                        </td>
                        <td>{u.listing_count || 0}</td>
                        <td>
                          <span className={u.status === 'active' ? 'badge badge-sell' : 'badge badge-danger'}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            {u.verification_status !== 'verified' && (
                              <button
                                onClick={() => handleVerifyStudent(u.id, 'verified')}
                                className="btn btn-sm"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#059669', color: '#fff', border: 'none' }}
                                title="Approve Student Verification"
                              >
                                Verify
                              </button>
                            )}
                            <button 
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              className={`btn btn-sm ${u.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', margin: 0 }}>Campus Orders & Escrow Management</h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Admin acts as middleman: funds held safely until buyer confirms receipt, then released to seller.
                  </div>
                </div>
              </div>

              {ordersList.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Product</th>
                        <th>Buyer</th>
                        <th>Seller</th>
                        <th>Amount</th>
                        <th>Escrow / Payment</th>
                        <th>UTR Ref</th>
                        <th>Status</th>
                        <th>Escrow Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.map(ord => (
                        <tr key={ord.id}>
                          <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{ord.order_number}</td>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ord.product_title}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            <strong>{ord.buyer_name}</strong>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              {ord.buyer_phone || ord.buyer_email}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>
                            <strong>{ord.seller_name}</strong>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              {ord.seller_phone || ord.seller_email}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                            ₹{ord.amount}
                          </td>
                          <td>
                            <span className={`badge ${
                              ord.escrow_status === 'held' ? 'badge-warning' :
                              ord.escrow_status === 'released' || ord.payment_status === 'paid' ? 'badge-sell' : 'badge-rent'
                            }`}>
                              {ord.escrow_status === 'held' 
                                ? '🛡️ Held by Admin' 
                                : (ord.escrow_status === 'released' || ord.payment_status === 'paid' ? '✓ Released to Seller' : '⏳ COD on Handover')}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.775rem' }}>
                            {ord.utr_number ? (
                              <code style={{ fontSize: '0.75rem', color: '#065f46', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                {ord.utr_number}
                              </code>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>{ord.payment_method || 'COD'}</span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
                              {ord.order_status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <button
                                onClick={() => handleNotifySeller(ord.id)}
                                className="btn btn-sm"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', cursor: 'pointer' }}
                                title="Send verified payment notice to seller"
                              >
                                📩 Notify Seller
                              </button>

                              {ord.escrow_status === 'held' && (
                                <button
                                  onClick={() => handleReleaseEscrow(ord.id)}
                                  className="btn btn-sm"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem', background: '#059669', color: '#fff', border: 'none', cursor: 'pointer' }}
                                  title="Release payment from admin escrow to seller"
                                >
                                  💸 Release Payout
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <ShoppingBag size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>No campus orders placed yet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Orders will appear here as students buy items.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: RENTALS MANAGEMENT */}
          {activeTab === 'rentals' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Campus Item Rentals & Deposits</h2>
              {rentalsList.length > 0 ? (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rental #</th>
                        <th>Product</th>
                        <th>Renter / Owner</th>
                        <th>Rent & Deposit</th>
                        <th>Period</th>
                        <th>Payment Status</th>
                        <th>Payment Method / Txn</th>
                        <th>Rental Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentalsList.map(rnt => (
                        <tr key={rnt.id}>
                          <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{rnt.rental_number}</td>
                          <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rnt.product_title}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            <div>Renter: <strong>{rnt.renter_name}</strong></div>
                            <div style={{ color: 'var(--text-muted)' }}>Owner: {rnt.owner_name}</div>
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>
                            <div>Rent: <strong>₹{rnt.total_amount - rnt.security_deposit}</strong></div>
                            <div style={{ color: 'var(--primary)' }}>Deposit: ₹{rnt.security_deposit}</div>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {rnt.duration_months} mo ({rnt.start_date} to {rnt.end_date})
                          </td>
                          <td>
                            <span className={`badge ${rnt.payment_status === 'paid' ? 'badge-sell' : 'badge-warning'}`}>
                              {rnt.payment_status === 'paid' ? '✓ Paid Online' : '⏳ Pay on Handover'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.775rem' }}>
                            <div>{rnt.payment_method || 'UPI / Gateway'}</div>
                            {rnt.transaction_id && (
                              <code style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {rnt.transaction_id}
                              </code>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-rent" style={{ textTransform: 'capitalize' }}>
                              {rnt.rental_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <Calendar size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>No campus rentals recorded</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active student rentals will show up here.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REPORTS */}
          {activeTab === 'reports' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Reported Items & Users</h2>
              {reportsList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reportsList.map(rep => (
                    <div 
                      key={rep.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span className="badge badge-danger">
                          Reason: {rep.reason}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Status: {rep.status}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Target: {rep.target_title || `ID #${rep.target_id}`}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginBottom: '0.75rem' }}>
                        Details: {rep.details || 'No additional details provided.'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Reported by: {rep.reporter_name} ({rep.reporter_email})
                        </span>
                        {rep.status !== 'resolved' && (
                          <button 
                            onClick={() => handleResolveReport(rep.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <Shield size={36} color="var(--success)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>No pending reports</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Marketplace reports are clean.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CATEGORIES */}
          {activeTab === 'categories' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Category Management</h2>
              
              {/* Add Category Form */}
              <form onSubmit={handleCreateCategory} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="New Category Name (e.g. Sports Equipment)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="filter-input"
                  style={{ flex: 1 }}
                />
                <input 
                  type="text" 
                  placeholder="Brief description"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="filter-input"
                  style={{ flex: 1.5 }}
                />
                <button type="submit" className="btn btn-primary">
                  Add Category
                </button>
              </form>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {categoriesList.map(cat => (
                  <div 
                    key={cat.id} 
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{cat.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.active_count || 0} items</div>
                    </div>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      style={{ color: 'var(--danger)', opacity: 0.8 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS & POLICIES */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Moderation & Platform Settings</h2>
              
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Pre-Approval for New Product Listings</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      When enabled, newly created student listings enter "Pending Review" status until an admin clicks Approve.
                    </p>
                  </div>

                  <button 
                    onClick={handleToggleRequireApproval}
                    className={`btn ${requireApproval ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {requireApproval ? '✓ Pre-Approval ENABLED' : 'Pre-Approval DISABLED (Instant Live)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* REJECT MODAL */}
      {rejectModalItem && (
        <div className="modal-overlay" onClick={() => setRejectModalItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Reject Listing</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Specify the reason why "{rejectModalItem.title}" cannot be published. The student will be notified.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Rejection Reason
              </label>
              <textarea 
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="filter-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setRejectModalItem(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleRejectProduct} className="btn btn-danger">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
