import React, { useState, useEffect } from 'react';
import { 
  Shield, Check, X, AlertTriangle, Users, Package, ShoppingBag, 
  Calendar, Layers, Settings, Trash2, ExternalLink, Search, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage({ onNavigate }) {
  const { user, isAdmin, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data
  const [stats, setStats] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [usersList, setUsersList] = useState([]);
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
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!isAdmin) {
      alert('Access restricted to CampusMarket administrators.');
      onNavigate('/');
      return;
    }
    loadAdminData();
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

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (!isAdmin) return null;

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
                      <th>Listings</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td style={{ fontSize: '0.8rem' }}>{u.email}<br />{u.phone || '—'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{u.college || '—'}</td>
                        <td>{u.listing_count || 0}</td>
                        <td>
                          <span className={u.status === 'active' ? 'badge badge-sell' : 'badge badge-danger'}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className={`btn btn-sm ${u.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
