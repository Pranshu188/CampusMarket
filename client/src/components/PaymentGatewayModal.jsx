import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Lock, Smartphone, QrCode, CheckCircle, 
  Clock, AlertCircle, Copy, Check, ArrowRight, Shield, Info
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentGatewayModal({ 
  isOpen, 
  amount, 
  product, 
  mode = 'buy', 
  onClose, 
  onPaymentSuccess 
}) {
  const { user } = useAuth();
  
  // Escrow details
  const [adminUpiId, setAdminUpiId] = useState('campusmarket@upi');
  const [adminUpiName, setAdminUpiName] = useState('CampusMarket Escrow Account');
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // Student UTR input
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [qrTimer, setQrTimer] = useState(480); // 8 minutes
  
  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch official escrow config from server
  useEffect(() => {
    if (!isOpen) return;
    api.getEscrowInfo()
      .then(res => {
        if (res.admin_upi_id) setAdminUpiId(res.admin_upi_id);
        if (res.admin_upi_name) setAdminUpiName(res.admin_upi_name);
      })
      .catch(err => console.error('Failed to load escrow info:', err));
  }, [isOpen]);

  // QR Timer Countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(adminUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const fillDemoUtr = () => {
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setUtrNumber(random12);
    setError('');
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUtr = utrNumber.trim().replace(/\s+/g, '');
    if (!cleanUtr) {
      setError('Please enter the 12-digit UPI UTR / Transaction Reference Number from your payment receipt.');
      return;
    }

    if (cleanUtr.length < 6) {
      setError('UTR Reference must be at least 6 to 12 digits from your Google Pay, PhonePe, or Paytm receipt.');
      return;
    }

    setSubmitting(true);

    try {
      // Validate UTR on server
      const verifyRes = await api.verifyUtr({
        utr_number: cleanUtr,
        amount: amount,
        payment_method: `CampusMarket UPI QR (${selectedUpiApp})`
      });

      if (!verifyRes.verified) {
        throw new Error('UTR verification failed. Please check the reference number.');
      }

      if (onPaymentSuccess) {
        onPaymentSuccess({
          payment_method: `CampusMarket UPI QR (${selectedUpiApp})`,
          transaction_id: verifyRes.transaction_id || `UTR-${cleanUtr}`,
          utr_number: cleanUtr,
          payment_status: 'escrow_held'
        });
      }
    } catch (err) {
      console.error('UTR Submit error:', err);
      setError(err.message || 'Failed to submit payment. Please verify your UTR number.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ zIndex: 1200, backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.75)' }}
    >
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '520px', 
          padding: 0, 
          overflow: 'hidden', 
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          background: '#ffffff',
          position: 'relative'
        }}
      >
        {/* GATEWAY BRANDED HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          position: 'relative',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button 
            onClick={onClose} 
            disabled={submitting}
            style={{ 
              position: 'absolute', 
              top: '1.15rem', 
              right: '1.25rem', 
              color: '#a7f3d0',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                background: '#ffffff',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#065f46',
                fontWeight: 900,
                fontSize: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                CM
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  CampusMarket Escrow Pay
                </h3>
                <div style={{ fontSize: '0.75rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="#34d399" /> 100% Student Purchase Protection
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total to Pay
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {formatPrice(amount)}
              </div>
            </div>
          </div>

          {/* Escrow Mechanism Explainer Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '0.55rem 0.85rem',
            fontSize: '0.775rem',
            color: '#ecfdf5',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <Lock size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#6ee7b7' }} />
            <div>
              <strong>Admin Escrow Protection:</strong> Your payment is held safely by CampusMarket Admin. The seller is <strong>NOT</strong> paid until you receive the book and confirm receipt!
            </div>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div style={{
            padding: '0.65rem 1.25rem',
            background: '#fef2f2',
            borderBottom: '1px solid #fee2e2',
            color: '#b91c1c',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* MAIN QR CODE PAYMENT AREA */}
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '470px', overflowY: 'auto' }}>
          
          {/* STEP 1: SCAN QR */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Step 1: Scan QR Code with any UPI App to Pay {formatPrice(amount)}
            </div>

            {/* High-Resolution SVG QR Code */}
            <div style={{
              display: 'inline-block',
              padding: '0.85rem',
              background: '#ffffff',
              borderRadius: '14px',
              border: '2px solid #059669',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.15)',
              marginBottom: '0.75rem',
              position: 'relative'
            }}>
              <svg width="170" height="170" viewBox="0 0 170 170" style={{ display: 'block' }}>
                <rect width="170" height="170" fill="#ffffff" />
                
                {/* Top-Left Finder */}
                <rect x="10" y="10" width="45" height="45" rx="6" fill="#064e3b" />
                <rect x="17" y="17" width="31" height="31" rx="4" fill="#ffffff" />
                <rect x="23" y="23" width="19" height="19" rx="3" fill="#059669" />

                {/* Top-Right Finder */}
                <rect x="115" y="10" width="45" height="45" rx="6" fill="#064e3b" />
                <rect x="122" y="17" width="31" height="31" rx="4" fill="#ffffff" />
                <rect x="128" y="23" width="19" height="19" rx="3" fill="#059669" />

                {/* Bottom-Left Finder */}
                <rect x="10" y="115" width="45" height="45" rx="6" fill="#064e3b" />
                <rect x="17" y="122" width="31" height="31" rx="4" fill="#ffffff" />
                <rect x="23" y="128" width="19" height="19" rx="3" fill="#059669" />

                {/* Data Pattern Bits */}
                <g fill="#1e293b">
                  <rect x="65" y="12" width="6" height="6" />
                  <rect x="75" y="12" width="6" height="6" />
                  <rect x="85" y="12" width="6" height="6" />
                  <rect x="95" y="12" width="6" height="6" />

                  <rect x="65" y="22" width="6" height="6" />
                  <rect x="85" y="22" width="6" height="6" />
                  <rect x="95" y="22" width="6" height="6" />

                  <rect x="12" y="65" width="6" height="6" />
                  <rect x="22" y="65" width="6" height="6" />
                  <rect x="32" y="65" width="6" height="6" />
                  <rect x="42" y="65" width="6" height="6" />
                  <rect x="52" y="65" width="6" height="6" />
                  <rect x="62" y="65" width="6" height="6" />

                  <rect x="12" y="75" width="6" height="6" />
                  <rect x="32" y="75" width="6" height="6" />
                  <rect x="52" y="75" width="6" height="6" />
                  
                  <rect x="110" y="65" width="6" height="6" />
                  <rect x="120" y="65" width="6" height="6" />
                  <rect x="135" y="65" width="6" height="6" />
                  <rect x="150" y="65" width="6" height="6" />

                  <rect x="115" y="78" width="6" height="6" />
                  <rect x="130" y="78" width="6" height="6" />
                  <rect x="145" y="78" width="6" height="6" />

                  <rect x="65" y="115" width="6" height="6" />
                  <rect x="75" y="115" width="6" height="6" />
                  <rect x="95" y="115" width="6" height="6" />
                  <rect x="65" y="125" width="6" height="6" />
                  <rect x="85" y="125" width="6" height="6" />
                  <rect x="65" y="145" width="6" height="6" />
                  <rect x="85" y="145" width="6" height="6" />
                  <rect x="95" y="145" width="6" height="6" />

                  <rect x="115" y="115" width="6" height="6" />
                  <rect x="135" y="115" width="6" height="6" />
                  <rect x="145" y="115" width="6" height="6" />
                  <rect x="125" y="125" width="6" height="6" />
                  <rect x="145" y="125" width="6" height="6" />
                  <rect x="115" y="145" width="6" height="6" />
                  <rect x="135" y="145" width="6" height="6" />
                </g>

                {/* Center CampusMarket Logo */}
                <circle cx="85" cy="85" r="16" fill="#064e3b" />
                <circle cx="85" cy="85" r="13" fill="#059669" />
                <text x="85" y="90" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">₹</text>
              </svg>

              <div style={{
                position: 'absolute',
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#064e3b',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.675rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                border: '1px solid rgba(52, 211, 153, 0.4)'
              }}>
                CampusMarket Admin UPI
              </div>
            </div>

            {/* Admin UPI ID & Copy button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Admin UPI ID:</span>
              <code style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                {adminUpiId}
              </code>
              <button
                type="button"
                onClick={handleCopyUpi}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#059669',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check size={16} color="#059669" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Countdown Timer */}
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              <Clock size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px', color: '#d97706' }} />
              QR valid for <strong>{formatTimer(qrTimer)}</strong>
            </div>

            {/* App Selector Pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', marginTop: '0.65rem' }}>
              {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                <button
                  key={app}
                  type="button"
                  onClick={() => setSelectedUpiApp(app)}
                  style={{
                    padding: '0.3rem 0.55rem',
                    fontSize: '0.725rem',
                    fontWeight: selectedUpiApp === app ? 700 : 500,
                    border: selectedUpiApp === app ? '1.5px solid #059669' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: selectedUpiApp === app ? '#ecfdf5' : '#ffffff',
                    color: selectedUpiApp === app ? '#065f46' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {app}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: ENTER 12-DIGIT UTR / REFERENCE NUMBER */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.15rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                Step 2: Enter 12-Digit UPI Reference / UTR Number
              </label>
              <button
                type="button"
                onClick={fillDemoUtr}
                style={{
                  background: '#ecfdf5',
                  border: '1px dashed #059669',
                  color: '#065f46',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⚡ Auto-Fill Demo UTR
              </button>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
              After paying in your {selectedUpiApp} app, look at the payment receipt to find the <strong>12-digit UPI Transaction ID / UTR Number</strong> and enter it below:
            </p>

            <form onSubmit={handleSubmitPayment}>
              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text"
                  placeholder="e.g. 428190345678"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    borderRadius: '8px',
                    border: '2px solid #059669',
                    outline: 'none',
                    textAlign: 'center',
                    background: '#ffffff'
                  }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                }}
              >
                {submitting ? 'Verifying with Admin Escrow...' : (
                  <>
                    <ShieldCheck size={18} /> Confirm Payment of {formatPrice(amount)} (Submit UTR)
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* FOOTER BADGE */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.725rem',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Shield size={14} color="#059669" />
            <span>Middleman Escrow by CampusMarket Admin</span>
          </div>
          <div>
            Zero Fraud Guarantee
          </div>
        </div>

      </div>
    </div>
  );
}
