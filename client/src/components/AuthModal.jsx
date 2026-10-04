import React, { useState } from 'react';
import { X, Lock, Mail, Phone, User, Building, BookOpen, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onNavigate }) {
  const { isAuthModalOpen, authModalMode, setAuthModalMode, closeAuthModal, login, register, sendOtp, verifyOtp, googleLogin } = useAuth();
  const [authMethod, setAuthMethod] = useState('email'); // 'email', 'otp'
  
  // Email Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Form Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('1');
  const [location, setLocation] = useState('Ahmedabad');

  // OTP Form Details
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');

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
          college: college.trim() || 'College Campus',
          course: course.trim(),
          branch: branch.trim(),
          semester: parseInt(semester) || 1,
          location: location.trim() || 'Campus'
        });
        navigateToDashboardIfNeeded(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await sendOtp(otpPhone);
      setOtpSent(true);
      if (res.debug_otp) {
        setDebugOtp(res.debug_otp);
        setOtpCode(res.debug_otp); // Auto-fill for tester convenience
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp({ phone: otpPhone, otp: otpCode, name: name || undefined });
      navigateToDashboardIfNeeded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSimulated = async () => {
    setError('');
    setLoading(true);
    try {
      await googleLogin({
        email: 'student.google@campus.market',
        name: 'Google Verified Student',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      });
      navigateToDashboardIfNeeded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Demo 1-Click test logins for students
  const handleQuickLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      if (role === 'aarav') {
        await login('aarav.patel@gtu.ac.in', 'campus123');
      } else if (role === 'priya') {
        await login('priya.sharma@bba.gtu.ac.in', 'campus123');
      }
      navigateToDashboardIfNeeded(false);
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
        style={{ maxWidth: authModalMode === 'register' ? '580px' : '440px' }}
      >
        {/* Close Button */}
        <button 
          onClick={closeAuthModal} 
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.45rem', marginBottom: '0.4rem' }}>
            {authModalMode === 'login' ? 'Welcome to CampusMarket' : 'Join CampusMarket'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {authModalMode === 'login' 
              ? 'Log in to buy, sell, or rent college essentials' 
              : 'Create your free student account in under 30 seconds'}
          </p>
        </div>

        {/* Quick Demo Login Bar for Testing */}
        <div style={{
          background: 'var(--surface-alt)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          marginBottom: '1.25rem',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
            ⚡ Instant Demo Logins (For Testing)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <button 
              type="button" 
              onClick={() => handleQuickLogin('aarav')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem' }}
            >
              Aarav (Student - Engg)
            </button>
            <button 
              type="button" 
              onClick={() => handleQuickLogin('priya')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem' }}
            >
              Priya (Student - BBA)
            </button>
          </div>
        </div>

        {/* Tabs: Email vs Phone OTP */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            type="button"
            onClick={() => { setAuthMethod('email'); setError(''); }}
            style={{
              padding: '0.5rem 0.75rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: authMethod === 'email' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: authMethod === 'email' ? '2px solid var(--primary)' : 'none',
              marginBottom: '-1px'
            }}
          >
            Email & Password
          </button>
          <button 
            type="button"
            onClick={() => { setAuthMethod('otp'); setError(''); }}
            style={{
              padding: '0.5rem 0.75rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: authMethod === 'otp' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: authMethod === 'otp' ? '2px solid var(--primary)' : 'none',
              marginBottom: '-1px'
            }}
          >
            Phone + OTP
          </button>
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

        {/* Email / Password Form */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            {authModalMode === 'register' && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Full Student Name *
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Aarav Patel"
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
                placeholder="name@college.ac.in or gmail.com"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="filter-input"
              />
            </div>

            {authModalMode === 'register' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      College / University
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. GTU / LDCE / DU"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Course / Degree
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. BBA / B.Tech / B.Com"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Branch / Dept
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Finance / Computer"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Semester
                    </label>
                    <select 
                      value={semester} 
                      onChange={(e) => setSemester(e.target.value)}
                      className="filter-input"
                    >
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Campus Location / City
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Navrangpura, Ahmedabad"
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
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Please wait...' : authModalMode === 'login' ? 'Log In to CampusMarket' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Phone + OTP Form */}
        {authMethod === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    10-digit Indian Mobile Number
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.55rem 0.75rem',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
                      +91
                    </span>
                    <input 
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      className="filter-input"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Enter OTP (e.g. 123456)"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="filter-input"
                    style={{ letterSpacing: '3px', fontSize: '1.1rem', textAlign: 'center', fontWeight: 700 }}
                  />
                  {debugOtp && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                      ✓ Test Code: <strong>{debugOtp}</strong> (or 123456)
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Enter'}
                </button>

                <button 
                  type="button" 
                  onClick={() => setOtpSent(false)} 
                  style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                >
                  Change mobile number
                </button>
              </form>
            )}
          </div>
        )}

        {/* Google Student Login Simulation */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', margin: '1rem 0' }}>
            <div style={{ borderTop: '1px solid var(--border)' }}></div>
            <span style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              padding: '0 0.75rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              or continue with
            </span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSimulated}
            className="btn btn-secondary"
            style={{ width: '100%', gap: '0.6rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.09C3.28 21.43 7.37 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.41l4.03-3.09z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.28 2.57 1.25 6.59l4.03 3.09c.95-2.83 3.6-4.93 6.72-4.93z"/>
            </svg>
            Student Google Account
          </button>
        </div>

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

        {/* Dedicated Admin Portal Link */}
        <div style={{
          marginTop: '1.25rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          Campus Moderator or Staff?{' '}
          <button
            type="button"
            onClick={() => {
              closeAuthModal();
              if (onNavigate) onNavigate('/admin/login');
            }}
            style={{
              color: 'var(--primary)',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer'
            }}
          >
            <Shield size={13} />
            Go to Admin Login Portal →
          </button>
        </div>
      </div>
    </div>
  );
}
