import React, { useState, useEffect } from 'react';
import { User, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileEditPage({ onNavigate }) {
  const { user, updateProfile, openAuthModal } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college || '');
  const [course, setCourse] = useState(user?.course || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [semester, setSemester] = useState(user?.semester?.toString() || '1');
  const [location, setLocation] = useState(user?.location || 'Palanpur');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      openAuthModal('login');
    } else {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCollege(user.college || '');
      setCourse(user.course || '');
      setBranch(user.branch || '');
      setSemester(user.semester?.toString() || '1');
      setLocation(user.location || 'Palanpur');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        college: college.trim() || null,
        course: course.trim() || null,
        branch: branch.trim() || null,
        semester: semester ? parseInt(semester) : null,
        location: location.trim() || 'Palanpur',
        bio: bio.trim() || null,
        avatar: avatar.trim() || null
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '680px' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Edit Student Profile</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Keep your college and semester information updated so matching books and items are easy to find.
      </p>

      {savedSuccess && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--success-bg)',
          border: '1px solid #bbf7d0',
          color: 'var(--success)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <CheckCircle size={18} />
          Profile updated successfully!
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--danger-bg)',
          border: '1px solid #fecaca',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <img 
            src={avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name || 'Student'}`} 
            alt="" 
            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
          />
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Avatar Image URL
            </label>
            <input 
              type="text" 
              placeholder="https://..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Full Name *
            </label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="filter-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Mobile Phone
            </label>
            <input 
              type="text" 
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Email Address (Account ID)
          </label>
          <input 
            type="email" 
            disabled 
            value={user.email}
            className="filter-input"
            style={{ background: 'var(--surface-alt)', cursor: 'not-allowed', color: 'var(--text-muted)' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              College / University
            </label>
            <input 
              type="text" 
              placeholder="e.g. GOVERNMENT POLITECNIC COLLAGE PALANPUR"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="filter-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Course / Degree
            </label>
            <input 
              type="text" 
              placeholder="e.g. BBA, B.Tech, B.Com"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Branch / Department
            </label>
            <input 
              type="text" 
              placeholder="e.g. Computer Science, Finance"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="filter-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Current Semester
            </label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              className="filter-input"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Campus Location / City
          </label>
          <input 
            type="text" 
            placeholder="Palanpur"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="filter-input"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Short Student Bio
          </label>
          <textarea 
            rows={3}
            placeholder="Share a short line about your major or what materials you typically buy/sell..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="filter-input"
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={() => onNavigate('/dashboard')} 
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="btn btn-primary"
            style={{ gap: '0.4rem' }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
