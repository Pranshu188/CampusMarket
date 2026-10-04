import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Lock, Smartphone, CreditCard, Building2, 
  QrCode, CheckCircle, Clock, AlertCircle, RefreshCw, Zap, Check, ChevronRight
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
  const [activeMethod, setActiveMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiSubTab, setUpiSubTab] = useState('qr'); // 'qr', 'vpa'
  
  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('');
  const [upiRequestSent, setUpiRequestSent] = useState(false);
  const [qrTimer, setQrTimer] = useState(480); // 8 minutes in seconds
  
  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || 'STUDENT BUYER');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [cardBrand, setCardBrand] = useState('RuPay');

  // NetBanking State
  const [selectedBank, setSelectedBank] = useState('sbi');
  const [showBankModal, setShowBankModal] = useState(false);

  // Common Processing State
  const [processingState, setProcessingState] = useState(null); 
  // null | 'connecting' | 'authorizing' | 'capturing' | 'success'
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState('');

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

  // Card formatting & brand detection
  const handleCardNumberChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);

    if (raw.startsWith('4')) setCardBrand('Visa');
    else if (raw.startsWith('51') || raw.startsWith('52') || raw.startsWith('53') || raw.startsWith('54') || raw.startsWith('55')) setCardBrand('Mastercard');
    else if (raw.startsWith('60') || raw.startsWith('65') || raw.startsWith('81') || raw.startsWith('82')) setCardBrand('RuPay');
    else setCardBrand('RuPay');
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const fillDemoRuPayCard = () => {
    setCardNumber('6082 1204 8921 7734');
    setCardHolder(user?.name ? user.name.toUpperCase() : 'ROHIT SHARMA');
    setCardExpiry('12/28');
    setCardCvv('782');
    setCardBrand('RuPay');
  };

  // Final verification and settlement
  const executePaymentSettlement = async (methodLabel, txPrefix = 'pay_cm') => {
    setError('');
    setProcessingState('connecting');
    setProcessingMessage('Connecting to NPCI & CampusPay Escrow Network...');

    try {
      await new Promise(r => setTimeout(r, 700));
      setProcessingState('authorizing');
      setProcessingMessage('Authorizing transaction with issuing student bank...');

      await new Promise(r => setTimeout(r, 800));
      setProcessingState('capturing');
      setProcessingMessage('Verifying digital signature & locking funds in Escrow...');

      // Call backend payment verification
      const txnId = `${txPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const verifyRes = await api.verifyPayment({
        razorpay_order_id: `ord_${Date.now()}`,
        razorpay_payment_id: txnId,
        razorpay_signature: 'verified_signature',
        payment_method: methodLabel
      });

      if (!verifyRes.verified) {
        throw new Error('Bank authorization failed.');
      }

      setProcessingState('success');
      setProcessingMessage('Payment Captured & Verified by Bank!');

      await new Promise(r => setTimeout(r, 600));

      if (onPaymentSuccess) {
        onPaymentSuccess({
          payment_method: methodLabel,
          transaction_id: verifyRes.payment_id || txnId,
          payment_status: 'paid'
        });
      }
    } catch (err) {
      console.error('Payment execution error:', err);
      setProcessingState(null);
      setError(err.message || 'Payment authorization was declined by bank.');
    }
  };

  // UPI Handlers
  const handleSimulateUpiQrPayment = () => {
    executePaymentSettlement(`UPI QR (${selectedUpiApp})`, 'pay_upi_qr');
  };

  const handleSendUpiRequest = () => {
    if (!upiId || !upiId.includes('@')) {
      setError('Please enter a valid UPI VPA (e.g. name@oksbi, mobile@paytm)');
      return;
    }
    setError('');
    setUpiRequestSent(true);
  };

  const handleApproveUpiVpa = () => {
    executePaymentSettlement(`UPI VPA (${upiId})`, 'pay_upi_vpa');
  };

  // Card Handlers
  const handleCardPayClick = (e) => {
    e.preventDefault();
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      setError('Please enter card expiry (MM/YY).');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      setError('Please enter 3-digit CVV.');
      return;
    }
    setError('');
    setShowOtpModal(true);
  };

  const handleVerifyOtp = () => {
    if (!enteredOtp || enteredOtp.length < 4) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setShowOtpModal(false);
    executePaymentSettlement(`${cardBrand} Card (••• ${cardNumber.slice(-4)})`, 'pay_card');
  };

  // NetBanking Handlers
  const handleProceedNetBanking = () => {
    setShowBankModal(true);
  };

  const handleAuthorizeNetBanking = () => {
    setShowBankModal(false);
    const bankNames = {
      sbi: 'State Bank of India',
      hdfc: 'HDFC Bank',
      icici: 'ICICI Bank',
      axis: 'Axis Bank',
      pnb: 'Punjab National Bank',
      kotak: 'Kotak Mahindra Bank'
    };
    executePaymentSettlement(`NetBanking (${bankNames[selectedBank] || selectedBank.toUpperCase()})`, 'pay_nb');
  };

  const upiVpaString = `campusmarket.escrow@okaxis`;
  const upiIntentString = `upi://pay?pa=${upiVpaString}&pn=CampusMarket%20Escrow&am=${amount}&cu=INR&tn=CampusMarket%20Item`;

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
          maxWidth: '560px', 
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          position: 'relative',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button 
            onClick={onClose} 
            disabled={processingState !== null}
            style={{ 
              position: 'absolute', 
              top: '1.15rem', 
              right: '1.25rem', 
              color: '#94a3b8',
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}>
                CP
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  CampusPay SafePay Escrow
                </h3>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={12} color="#10b981" /> 256-bit Bank Grade Security • NPCI UPI Escrow
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', paddingRight: '2rem' }}>
              <div style={{ fontSize: '0.725rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Payable Amount
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', lineHeight: 1.1 }}>
                {formatPrice(amount)}
              </div>
            </div>
          </div>

          {/* Student Profile Pill */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '8px',
            padding: '0.4rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#cbd5e1'
          }}>
            <span>Student: <strong>{user?.name || 'Student Member'}</strong> ({user?.email})</span>
            <span style={{ 
              background: '#047857', 
              color: '#a7f3d0', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: 700 
            }}>
              Sandbox Test Gateway
            </span>
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

        {/* NAVIGATION TABS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <button
            type="button"
            onClick={() => { setActiveMethod('upi'); setError(''); }}
            style={{
              padding: '0.85rem 0.5rem',
              border: 'none',
              borderBottom: activeMethod === 'upi' ? '3px solid #0d9488' : '3px solid transparent',
              background: activeMethod === 'upi' ? '#ffffff' : 'transparent',
              color: activeMethod === 'upi' ? '#0f766e' : '#64748b',
              fontWeight: activeMethod === 'upi' ? 700 : 500,
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Smartphone size={16} /> UPI & QR Code
          </button>

          <button
            type="button"
            onClick={() => { setActiveMethod('card'); setError(''); }}
            style={{
              padding: '0.85rem 0.5rem',
              border: 'none',
              borderBottom: activeMethod === 'card' ? '3px solid #0d9488' : '3px solid transparent',
              background: activeMethod === 'card' ? '#ffffff' : 'transparent',
              color: activeMethod === 'card' ? '#0f766e' : '#64748b',
              fontWeight: activeMethod === 'card' ? 700 : 500,
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <CreditCard size={16} /> Debit / RuPay / Card
          </button>

          <button
            type="button"
            onClick={() => { setActiveMethod('netbanking'); setError(''); }}
            style={{
              padding: '0.85rem 0.5rem',
              border: 'none',
              borderBottom: activeMethod === 'netbanking' ? '3px solid #0d9488' : '3px solid transparent',
              background: activeMethod === 'netbanking' ? '#ffffff' : 'transparent',
              color: activeMethod === 'netbanking' ? '#0f766e' : '#64748b',
              fontWeight: activeMethod === 'netbanking' ? 700 : 500,
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Building2 size={16} /> Net Banking
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '430px', overflowY: 'auto' }}>
          
          {/* TAB 1: UPI & QR CODE */}
          {activeMethod === 'upi' && (
            <div>
              {/* Sub-mode selector (QR vs VPA) */}
              <div style={{
                display: 'flex',
                background: '#f1f5f9',
                borderRadius: '8px',
                padding: '3px',
                marginBottom: '1.25rem'
              }}>
                <button
                  type="button"
                  onClick={() => setUpiSubTab('qr')}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: upiSubTab === 'qr' ? '#ffffff' : 'transparent',
                    fontWeight: upiSubTab === 'qr' ? 700 : 500,
                    color: upiSubTab === 'qr' ? '#0f172a' : '#64748b',
                    fontSize: '0.8rem',
                    boxShadow: upiSubTab === 'qr' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <QrCode size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                  Scan UPI QR Code
                </button>

                <button
                  type="button"
                  onClick={() => setUpiSubTab('vpa')}
                  style={{
                    flex: 1,
                    padding: '0.45rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: upiSubTab === 'vpa' ? '#ffffff' : 'transparent',
                    fontWeight: upiSubTab === 'vpa' ? 700 : 500,
                    color: upiSubTab === 'vpa' ? '#0f172a' : '#64748b',
                    fontSize: '0.8rem',
                    boxShadow: upiSubTab === 'vpa' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                  Enter UPI ID / VPA
                </button>
              </div>

              {upiSubTab === 'qr' ? (
                /* Dynamic UPI QR Code View */
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.85rem',
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '2px solid #0d9488',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.12)',
                    marginBottom: '0.85rem',
                    position: 'relative'
                  }}>
                    {/* High-fidelity SVG QR Code with Finder Patterns */}
                    <svg width="170" height="170" viewBox="0 0 170 170" style={{ display: 'block' }}>
                      <rect width="170" height="170" fill="#ffffff" />
                      
                      {/* Top-Left Finder */}
                      <rect x="10" y="10" width="45" height="45" rx="6" fill="#0f172a" />
                      <rect x="17" y="17" width="31" height="31" rx="4" fill="#ffffff" />
                      <rect x="23" y="23" width="19" height="19" rx="3" fill="#0d9488" />

                      {/* Top-Right Finder */}
                      <rect x="115" y="10" width="45" height="45" rx="6" fill="#0f172a" />
                      <rect x="122" y="17" width="31" height="31" rx="4" fill="#ffffff" />
                      <rect x="128" y="23" width="19" height="19" rx="3" fill="#0d9488" />

                      {/* Bottom-Left Finder */}
                      <rect x="10" y="115" width="45" height="45" rx="6" fill="#0f172a" />
                      <rect x="17" y="122" width="31" height="31" rx="4" fill="#ffffff" />
                      <rect x="23" y="128" width="19" height="19" rx="3" fill="#0d9488" />

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

                      {/* Center CampusPay Logo */}
                      <circle cx="85" cy="85" r="16" fill="#0f172a" />
                      <circle cx="85" cy="85" r="13" fill="#0d9488" />
                      <text x="85" y="90" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">₹</text>
                    </svg>

                    <div style={{
                      position: 'absolute',
                      bottom: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#0f172a',
                      color: '#34d399',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(52, 211, 153, 0.4)'
                    }}>
                      Scan with any UPI App
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.85rem' }}>
                    <Clock size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px', color: '#f59e0b' }} />
                    QR expires in <strong>{formatTimer(qrTimer)}</strong>
                  </div>

                  {/* Supported UPI Apps */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Cred'].map(app => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setSelectedUpiApp(app)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.725rem',
                          fontWeight: selectedUpiApp === app ? 700 : 500,
                          border: selectedUpiApp === app ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          background: selectedUpiApp === app ? '#f0fdfa' : '#ffffff',
                          color: selectedUpiApp === app ? '#0f766e' : '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        {app}
                      </button>
                    ))}
                  </div>

                  {/* Scan & Pay Simulator Button */}
                  <button
                    type="button"
                    onClick={handleSimulateUpiQrPayment}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                    }}
                  >
                    <Zap size={18} /> Simulate Scan & Pay via {selectedUpiApp} ({formatPrice(amount)})
                  </button>
                </div>
              ) : (
                /* Enter UPI VPA View */
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Enter your UPI ID / Virtual Payment Address
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="filter-input"
                      style={{ fontSize: '0.9rem', padding: '0.75rem' }}
                    />
                  </div>

                  {/* Fast Bank Handle Suggestions */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.4rem' }}>Fast Handle Shortcuts:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {['@oksbi', '@okhdfcbank', '@okicici', '@paytm', '@ybl', '@axl'].map(handle => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const prefix = upiId.split('@')[0] || user?.name?.toLowerCase().replace(/\s+/g, '') || 'student';
                            setUpiId(`${prefix}${handle}`);
                          }}
                          style={{
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.725rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            background: '#f8fafc',
                            color: '#0f766e',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!upiRequestSent ? (
                    <button
                      type="button"
                      onClick={handleSendUpiRequest}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.8rem', fontWeight: 700 }}
                    >
                      Request Payment of {formatPrice(amount)}
                    </button>
                  ) : (
                    <div style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '10px',
                      padding: '1rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#065f46', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                        📲 Payment Request Sent to {upiId}!
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#047857', marginBottom: '1rem' }}>
                        Open your UPI app notification to approve payment of {formatPrice(amount)}.
                      </div>
                      <button
                        type="button"
                        onClick={handleApproveUpiVpa}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem', fontWeight: 700, background: '#059669' }}
                      >
                        ✓ Authorize & Approve Payment ({formatPrice(amount)})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEBIT / CREDIT / RUPAY CARD */}
          {activeMethod === 'card' && (
            <div>
              {/* Virtual Card Graphic */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#fff',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: '#94a3b8' }}>
                    CAMPUS STUDENT CARD
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#38bdf8' }}>
                    {cardBrand}
                  </div>
                </div>

                <div style={{
                  fontSize: '1.15rem',
                  letterSpacing: '0.15em',
                  fontFamily: 'monospace',
                  marginBottom: '1rem',
                  color: '#f8fafc'
                }}>
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>CARDHOLDER</div>
                    <div style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{cardHolder}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>EXPIRES</div>
                    <div style={{ fontWeight: 600 }}>{cardExpiry || 'MM/YY'}</div>
                  </div>
                </div>
              </div>

              {/* Quick Fill Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Enter Card Details</span>
                <button
                  type="button"
                  onClick={fillDemoRuPayCard}
                  style={{
                    background: '#f0fdfa',
                    border: '1px dashed #0d9488',
                    color: '#0f766e',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Auto-Fill Demo RuPay Card
                </button>
              </div>

              <form onSubmit={handleCardPayClick}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                    Card Number
                  </label>
                  <input 
                    type="text"
                    placeholder="6082 1204 8921 7734"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="filter-input"
                    maxLength={19}
                  />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                    Cardholder Name
                  </label>
                  <input 
                    type="text"
                    placeholder="Name on card"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    className="filter-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                      Valid Thru (MM/YY)
                    </label>
                    <input 
                      type="text"
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      className="filter-input"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                      CVV / Security Code
                    </label>
                    <input 
                      type="password"
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                      className="filter-input"
                      maxLength={4}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontWeight: 700 }}
                >
                  Pay {formatPrice(amount)} with {cardBrand}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: NET BANKING */}
          {activeMethod === 'netbanking' && (
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>
                Select Your College Student Bank
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {[
                  { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
                  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
                  { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
                  { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
                  { id: 'pnb', name: 'Punjab National Bank', code: 'PNB' },
                  { id: 'kotak', name: 'Kotak Mahindra Bank', code: 'KOTAK' }
                ].map(bank => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBank(bank.id)}
                    style={{
                      padding: '0.75rem 0.5rem',
                      border: selectedBank === bank.id ? '2px solid #0d9488' : '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: selectedBank === bank.id ? '#f0fdfa' : '#ffffff',
                      color: selectedBank === bank.id ? '#0f766e' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <Building2 size={18} color={selectedBank === bank.id ? '#0d9488' : '#64748b'} />
                    {bank.code}
                    <span style={{ fontSize: '0.65rem', fontWeight: 400, color: '#64748b' }}>{bank.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: '#64748b',
                marginBottom: '1.25rem'
              }}>
                🔒 You will be directed to the simulated {selectedBank.toUpperCase()} NetBanking authentication screen to authorize ₹{amount}.
              </div>

              <button
                type="button"
                onClick={handleProceedNetBanking}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontWeight: 700 }}
              >
                Proceed to NetBanking ({formatPrice(amount)})
              </button>
            </div>
          )}

        </div>

        {/* FOOTER TRUST BADGES */}
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
            <ShieldCheck size={14} color="#059669" />
            <span>Escrow Protected by CampusPay</span>
          </div>
          <div>
            Powered by Razorpay Sandbox & NPCI
          </div>
        </div>

        {/* 3D SECURE OTP SIMULATION MODAL */}
        {showOtpModal && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 10
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                  {cardBrand} 3D Secure Verification
                </span>
                <span style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 700 }}>
                  SBI / HDFC
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4, marginBottom: '1rem' }}>
                An authentication OTP has been sent to student mobile ending in <strong>•••• 9214</strong> for transaction of <strong>{formatPrice(amount)}</strong>.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text"
                  placeholder="Enter 6-digit OTP (e.g. 123456)"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    letterSpacing: '0.3em',
                    fontWeight: 800,
                    borderRadius: '8px',
                    border: '2px solid #0d9488',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setEnteredOtp('123456')}
                  style={{
                    background: '#f0fdfa',
                    border: '1px dashed #0d9488',
                    color: '#0f766e',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ✨ Auto-Fill Demo OTP (123456)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  className="btn btn-primary"
                  style={{ flex: 1.5, padding: '0.65rem', fontWeight: 700 }}
                >
                  Submit OTP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NETBANKING AUTHORIZATION SIMULATION MODAL */}
        {showBankModal && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 10
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedBank.toUpperCase()} Online Banking Portal
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
                  Student Savings Account No: •••• •••• 4821
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                padding: '0.85rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '1rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Beneficiary:</span>
                  <strong>CampusMarket Escrow</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>Amount:</span>
                  <strong style={{ color: '#0d9488', fontSize: '0.95rem' }}>{formatPrice(amount)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Available Balance:</span>
                  <span>₹42,500.00</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAuthorizeNetBanking}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '0.65rem', fontWeight: 700 }}
                >
                  Authorize {formatPrice(amount)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROCESSING & VERIFICATION OVERLAY */}
        {processingState && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            zIndex: 20
          }}>
            {processingState === 'success' ? (
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.3)'
              }}>
                <CheckCircle size={38} />
              </div>
            ) : (
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '4px solid #ccfbf1',
                borderTopColor: '#0d9488',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '1.25rem'
              }} />
            )}

            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              {processingState === 'success' ? 'Payment Verified!' : 'Authorizing Payment...'}
            </h4>

            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '320px', margin: 0 }}>
              {processingMessage}
            </p>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

      </div>
    </div>
  );
}
