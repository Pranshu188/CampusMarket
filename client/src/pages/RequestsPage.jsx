import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, BookOpen, MapPin, Calendar, DollarSign, MessageCircle, 
  CheckCircle2, X, Filter, Sparkles, User 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RequestsPage({ onNavigate }) {
  const { user, openAuthModal } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  // Filter state
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('Textbooks');
  const [newCollege, setNewCollege] = useState(user?.college || '');
  const [newCourse, setNewCourse] = useState(user?.course || '');
  const [newSemester, setNewSemester] = useState(user?.semester?.toString() || '1');
  const [newSubject, setNewSubject] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newType, setNewType] = useState('Buy'); // 'Buy', 'Rent', 'Any'
  const [newLocation, setNewLocation] = useState(user?.location || 'Campus');
  const [newDate, setNewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await api.getRequests({
        search,
        category: selectedCat === 'All' ? '' : selectedCat,
        type: filterType === 'All' ? '' : filterType
      });
      setRequests(res.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadRequests();
  }, [search, selectedCat, filterType]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!newTitle.trim() || !newDesc.trim() || !newLocation.trim()) {
      setError('Please fill in title, description and location.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await api.createRequest({
        title: newTitle.trim(),
        description: newDesc.trim(),
        category_name: newCat,
        college: newCollege.trim() || null,
        course: newCourse.trim() || null,
        semester: newSemester ? parseInt(newSemester) : null,
        subject: newSubject.trim() || null,
        budget: newBudget ? parseFloat(newBudget) : null,
        preferred_type: newType,
        location: newLocation.trim(),
        required_by_date: newDate || null
      });

      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewBudget('');
      loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactRequester = (req) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (user.id === req.user_id) {
      alert('This is your own item request.');
      return;
    }
    // Navigate to messages
    onNavigate('/messages', {
      recipientId: req.user_id,
      initialText: `Hi ${req.requester_name}! I saw your request for "${req.title}" on CampusMarket. I have this item available!`
    });
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Top Banner */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.825rem', marginBottom: '0.35rem' }}>
            <Sparkles size={16} /> Campus Wanted Board
          </div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>Student Item Requests</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.5 }}>
            Can't find a specific textbook, calculator, or hostel study item at GOVERNMENT POLITECNIC COLLAGE PALANPUR? Post what you need and let fellow students contact you directly!
          </p>
        </div>

        <button 
          onClick={() => {
            if (!user) openAuthModal('login', () => setIsModalOpen(true));
            else setIsModalOpen(true);
          }}
          className="btn btn-primary btn-lg"
          style={{ gap: '0.5rem' }}
        >
          <Plus size={18} /> Post an Item Request
        </button>
      </div>

      {/* Filter Strip */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={16} color="var(--text-light)" />
          <input 
            type="text" 
            placeholder="Search requests by title, subject, college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-input"
            style={{ border: 'none', background: 'transparent', padding: '0.2rem' }}
          />
        </div>

        {/* Category select */}
        <select 
          value={selectedCat} 
          onChange={(e) => setSelectedCat(e.target.value)}
          className="filter-input"
          style={{ width: 'auto' }}
        >
          <option value="All">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Type select */}
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-input"
          style={{ width: 'auto' }}
        >
          <option value="All">Looking to Buy or Rent</option>
          <option value="Buy">Buy Only</option>
          <option value="Rent">Rent Only</option>
        </select>
      </div>

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          Loading student requests...
        </div>
      ) : requests.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {requests.map(req => (
            <div 
              key={req.id} 
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.15s ease'
              }}
            >
              <div>
                {/* Header line with badge & budget */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span className={req.preferred_type === 'Rent' ? 'badge badge-rent' : 'badge badge-sell'}>
                    Looking to {req.preferred_type}
                  </span>

                  {req.budget ? (
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>
                      Budget: {formatPrice(req.budget)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Flexible Budget</span>
                  )}
                </div>

                {/* Academic line if present */}
                {(req.college || req.course || req.semester) && (
                  <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.35rem' }}>
                    {[req.college, req.course, req.semester ? `Sem ${req.semester}` : null].filter(Boolean).join(' • ')}
                  </div>
                )}

                {/* Title */}
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                  {req.title}
                </h3>

                {/* Description */}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                  {req.description}
                </p>
              </div>

              {/* Footer */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={13} />
                    <span>{req.location}</span>
                  </div>
                  <div>
                    {req.required_by_date ? `Needed by ${new Date(req.required_by_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'Needed ASAP'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <img 
                      src={req.requester_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${req.requester_name}`} 
                      alt="" 
                      style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                    />
                    <span style={{ fontWeight: 600 }}>{req.requester_name.split(' ')[0]}</span>
                  </div>

                  <button 
                    onClick={() => handleContactRequester(req)}
                    className="btn btn-outline-primary btn-sm"
                    style={{ gap: '0.35rem' }}
                  >
                    <MessageCircle size={14} /> I Have This Item
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '4rem 1.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: 'var(--text-muted)'
          }}>
            <BookOpen size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No student requests found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Looking for something specific? Post a request and let your seniors and batchmates know what textbook or item you need.
          </p>
          <button 
            onClick={() => {
              if (!user) openAuthModal('login', () => setIsModalOpen(true));
              else setIsModalOpen(true);
            }} 
            className="btn btn-primary"
          >
            Post the First Request
          </button>
        </div>
      )}

      {/* POST REQUEST MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '540px' }}
          >
            <button 
              onClick={() => setIsModalOpen(false)} 
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Post an Item Request</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Other students with this item will be notified and can contact you directly through chat.
            </p>

            {error && (
              <div style={{
                padding: '0.65rem 0.85rem',
                background: 'var(--danger-bg)',
                border: '1px solid #fecaca',
                color: 'var(--danger)',
                fontSize: '0.825rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRequest}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  What do you need? *
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Need Engineering Mathematics textbook (B.S. Grewal)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select 
                    value={newCat} 
                    onChange={(e) => setNewCat(e.target.value)}
                    className="filter-input"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Preferred Option
                  </label>
                  <select 
                    value={newType} 
                    onChange={(e) => setNewType(e.target.value)}
                    className="filter-input"
                  >
                    <option value="Buy">Looking to Buy</option>
                    <option value="Rent">Looking to Rent</option>
                    <option value="Any">Either Buy or Rent</option>
                  </select>
                </div>
              </div>

              {/* Academic details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    College / University
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. GOVERNMENT POLITECNIC COLLAGE PALANPUR"
                    value={newCollege}
                    onChange={(e) => setNewCollege(e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Semester
                  </label>
                  <select 
                    value={newSemester} 
                    onChange={(e) => setNewSemester(e.target.value)}
                    className="filter-input"
                  >
                    <option value="">Any Sem</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Maximum Budget (₹)
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 400"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="filter-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Required By Date
                  </label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Handover Location *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Palanpur Campus / Main Gate, Palanpur"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Details / Specific Edition Notes *
                </label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Mention if you need a specific author, solved papers, or syllabus edition..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Posting...' : 'Post Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
