import React, { useState } from 'react';
import { X, Lock, Mail, User, Building, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onNavigate }) {
  const { isAuthModalOpen, authModalMode, setAuthModalMode, closeAuthModal, login, register } = useAuth();
  
  // Email & Password Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Form Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('GOVERNMENT POLITECNIC COLLAGE PALANPUR');
  const [course, setCourse] = useState('Diploma Engineering');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('1');
  const [location, setLocation] = useState('Palanpur Campus, Palanpur');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const navigateToDashboardIfNeeded = (isNewReg = false) => {
    if (onNavigate) {
      if (isNewReg) {
        onNavigate('/dashboard', { newRegistration: 'true' });
      } else if (!window.location.pathname || window.location.pathname === '/') {
        onNavigate('/dashboard');
      }
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (authModalMode === 'login') {
        await login(email.trim(), password);
        navigateToDashboardIfNeeded(false);
      } else {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          college: college.trim() || 'GOVERNMENT POLITECNIC COLLAGE PALANPUR',
          course: course.trim() || 'Diploma Engineering',
          branch: branch.trim(),
          semester: parseInt(semester) || 1,
          location: location.trim() || 'Palanpur Campus, Palanpur'
        });
        navigateToDashboardIfNeeded(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: authModalMode === 'register' ? '540px' : '420px' }}
      >
        {/* Close Button */}
        <button 
          onClick={closeAuthModal} 
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--text-muted)' }}
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.45rem', marginBottom: '0.4rem' }}>
            {authModalMode === 'login' ? 'Log In to CampusMarket' : 'Create an Account'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {authModalMode === 'login' 
              ? 'Enter your registered email and password to continue' 
              : 'Join GOVERNMENT POLITECNIC COLLAGE PALANPUR marketplace'}
          </p>
        </div>

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

        {/* Email & Password Authentication Form */}
        <form onSubmit={handleEmailSubmit}>
          {authModalMode === 'register' && (
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Full Student Name *
              </label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Rahul Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="filter-input"
              />
            </div>
          )}

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Email Address *
            </label>
            <input 
              type="email" 
              required 
              placeholder="e.g. yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="filter-input"
            />
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              Password *
            </label>
            <input 
              type="password" 
              required 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="filter-input"
            />
          </div>

          {authModalMode === 'register' && (
            <>
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  College / Institute *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="GOVERNMENT POLITECNIC COLLAGE PALANPUR"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Course / Program
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Diploma Engineering"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Branch / Department
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Computer / Mechanical / Civil"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Semester
                  </label>
                  <select 
                    value={semester} 
                    onChange={(e) => setSemester(e.target.value)}
                    className="filter-input"
                  >
                    {[1, 2, 3, 4, 5, 6].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Phone Number (Optional)
                  </label>
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Campus Location / City
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Palanpur Campus, Palanpur"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="filter-input"
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
          >
            {loading ? 'Please wait...' : authModalMode === 'login' ? 'Log In' : 'Register Account'}
          </button>
        </form>

        {/* Switch between Login and Register */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {authModalMode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setAuthModalMode('register'); setError(''); }} 
                style={{ color: 'var(--primary)', fontWeight: 700 }}
              >
                Register here
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button 
                type="button" 
                onClick={() => { setAuthModalMode('login'); setError(''); }} 
                style={{ color: 'var(--primary)', fontWeight: 700 }}
              >
                Log in here
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
