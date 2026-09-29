import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, MapPin, Calendar, CreditCard, Smartphone, Building2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function CheckoutModal({ product, mode = 'buy', onClose, onSuccess, onOpenChat }) {
  const [durationMonths, setDurationMonths] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupNotes, setPickupNotes] = useState('Campus handover near college library');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPay');
  const [upiId, setUpiId] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [error, setError] = useState('');

  if (!product) return null;

  // Calculation for rent
  const monthlyRent = product.rent_price_monthly || Math.round(product.price * 0.25);
  const securityDeposit = product.security_deposit || Math.round(product.price * 0.8);
  const rentalFee = monthlyRent * durationMonths;
  const totalAmount = mode === 'buy' ? product.price : (rentalFee + securityDeposit);

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePayAndConfirm = async () => {
    setError('');
    setProcessing(true);

    try {
      // 1. Create payment transaction intent via API abstraction
      const payIntent = await api.createPaymentOrder({
        amount: totalAmount,
        currency: 'INR',
        receipt_type: mode === 'buy' ? 'purchase' : 'rental',
        product_id: product.id
      });

      // 2. Simulate payment gateway verification
      const verifyRes = await api.verifyPayment({
        razorpay_order_id: payIntent.order_id,
        razorpay_payment_id: `pay_cm_${Date.now()}`,
        razorpay_signature: 'sandbox_verified_signature'
      });

      if (!verifyRes.verified) {
        throw new Error('Payment verification failed.');
      }

      // 3. Create actual order or rental in database
      if (mode === 'buy') {
        const orderRes = await api.createOrder({
          product_id: product.id,
          payment_method: `Razorpay Sandbox (${paymentMethod.toUpperCase()})`,
          pickup_notes: pickupNotes
        });
        setOrderComplete({
          type: 'buy',
          orderNumber: orderRes.order.order_number,
          amount: totalAmount,
          sellerName: product.seller_name
        });
        if (onSuccess) onSuccess();
      } else {
        const rentalRes = await api.createRental({
          product_id: product.id,
          duration_months: durationMonths,
          start_date: startDate,
          pickup_notes: pickupNotes
        });
        setOrderComplete({
          type: 'rent',
          orderNumber: rentalRes.rental.rental_number,
          amount: totalAmount,
          deposit: securityDeposit,
          sellerName: product.seller_name
        });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '520px' }}
      >
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        {!orderComplete ? (
          <div>
            {/* Header */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                <ShieldCheck size={16} /> CampusMarket Secure Student Checkout
              </div>
              <h3 style={{ fontSize: '1.35rem' }}>
                {mode === 'buy' ? 'Buy Item Directly' : 'Rent Item'}
              </h3>
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

            {/* Product Summary Mini Card */}
            <div style={{
              display: 'flex',
              gap: '0.85rem',
              padding: '0.85rem',
              background: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              marginBottom: '1.25rem'
            }}>
              <img 
                src={product.primary_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80'} 
                alt={product.title} 
                style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '0.925rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.title}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Seller: <strong>{product.seller_name}</strong> • {product.condition}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                  {product.location}
                </div>
              </div>
            </div>

            {/* Rental Duration Selector */}
            {mode === 'rent' && (
              <div style={{
                padding: '1rem',
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Rental Duration
                    </label>
                    <select 
                      value={durationMonths} 
                      onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                      className="filter-input"
                    >
                      <option value={1}>1 Month</option>
                      <option value={2}>2 Months</option>
                      <option value={3}>3 Months (Full Sem)</option>
                      <option value={4}>4 Months</option>
                      <option value={6}>6 Months</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Start Date
                    </label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                </div>

                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  ℹ️ Security deposit of {formatPrice(securityDeposit)} will be returned to you when the item is returned in good condition.
                </div>
              </div>
            )}

            {/* Peer-to-peer Meeting Disclaimer */}
            <div style={{
              padding: '0.75rem',
              background: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: '#854d0e',
              lineHeight: 1.45,
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <MapPin size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Student Pickup:</strong> CampusMarket connects students directly. Buyer and seller arrange meeting at college campus, library or canteen.
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Payment Method (Indian Gateway / Razorpay Test Sandbox)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  style={{
                    padding: '0.65rem 0.5rem',
                    border: paymentMethod === 'upi' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: paymentMethod === 'upi' ? 'var(--primary-light)' : '#fff',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Smartphone size={18} color="var(--primary)" />
                  UPI / GPay / PhonePe
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '0.65rem 0.5rem',
                    border: paymentMethod === 'card' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: paymentMethod === 'card' ? 'var(--primary-light)' : '#fff',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <CreditCard size={18} color="var(--primary)" />
                  Debit / Credit Card
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  style={{
                    padding: '0.65rem 0.5rem',
                    border: paymentMethod === 'netbanking' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: paymentMethod === 'netbanking' ? 'var(--primary-light)' : '#fff',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Building2 size={18} color="var(--primary)" />
                  Net Banking
                </button>
              </div>

              {/* UPI App selector */}
              {paymentMethod === 'upi' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setSelectedUpiApp(app)}
                      style={{
                        flex: 1,
                        padding: '0.4rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: selectedUpiApp === app ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedUpiApp === app ? 'var(--primary-light)' : '#fff',
                        color: selectedUpiApp === app ? 'var(--primary)' : 'var(--text-body)'
                      }}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown Summary */}
            <div style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
              marginBottom: '1.25rem'
            }}>
              {mode === 'rent' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>Monthly Rent ({formatPrice(monthlyRent)} × {durationMonths} mo)</span>
                    <span>{formatPrice(rentalFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>Refundable Security Deposit</span>
                    <span>{formatPrice(securityDeposit)}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>Item Purchase Price</span>
                  <span>{formatPrice(product.price)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                <span>CampusMarket Student Protection</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE (₹0)</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '0.65rem',
                marginTop: '0.65rem'
              }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--primary)' }}>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="button" 
              onClick={handlePayAndConfirm}
              disabled={processing}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700 }}
            >
              {processing ? 'Processing Payment...' : `Pay ${formatPrice(totalAmount)} & Confirm`}
            </button>
          </div>
        ) : (
          /* Order / Rental Success Confirmation View */
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {orderComplete.type === 'buy' ? 'Order Confirmed!' : 'Rental Confirmed!'}
            </h3>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Transaction ID: <strong>{orderComplete.orderNumber}</strong>
            </p>

            <div style={{
              background: 'var(--surface-alt)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              textAlign: 'left',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Product:</strong> {product.title}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Seller:</strong> {orderComplete.sellerName}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Amount Paid:</strong> {formatPrice(orderComplete.amount)}
              </div>
              {orderComplete.deposit && (
                <div style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  <strong>Security Deposit Held:</strong> {formatPrice(orderComplete.deposit)} (Refundable)
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenChat) onOpenChat(product);
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                Chat with Seller to Coordinate Handover
              </button>

              <button 
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Close & Return to Marketplace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
