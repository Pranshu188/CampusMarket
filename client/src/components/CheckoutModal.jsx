import React, { useState } from 'react';
import { 
  X, CheckCircle, ShieldCheck, MapPin, Calendar, CreditCard, 
  Smartphone, Building2, AlertCircle, Handshake, Lock, ArrowRight, Clock
} from 'lucide-react';
import { api } from '../services/api';
import PaymentGatewayModal from './PaymentGatewayModal';

export default function CheckoutModal({ product, mode = 'buy', onClose, onSuccess, onOpenChat }) {
  const [durationMonths, setDurationMonths] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupNotes, setPickupNotes] = useState('Campus handover near college library');
  
  // Checkout Choice: 'online_gateway' | 'handover'
  const [checkoutOption, setCheckoutOption] = useState('online_gateway');
  
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
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
    }).format(val || 0);
  };

  // 1. If user chose online payment, open the gateway
  const handleProceedClick = () => {
    setError('');
    if (checkoutOption === 'online_gateway') {
      setIsGatewayOpen(true);
    } else {
      handlePayOnHandover();
    }
  };

  // 2. Gateway success callback (after user scans UPI, submits OTP, or authorizes NetBanking)
  const handleGatewaySuccess = async (paymentDetails) => {
    setIsGatewayOpen(false);
    setProcessing(true);
    setError('');

    try {
      if (mode === 'buy') {
        const orderRes = await api.createOrder({
          product_id: product.id,
          payment_method: paymentDetails.payment_method,
          payment_status: 'paid',
          transaction_id: paymentDetails.transaction_id,
          pickup_notes: pickupNotes
        });

        setOrderComplete({
          type: 'buy',
          orderNumber: orderRes.order.order_number,
          transactionId: paymentDetails.transaction_id,
          paymentMethod: paymentDetails.payment_method,
          paymentStatus: 'paid',
          amount: totalAmount,
          sellerName: product.seller_name
        });

        if (onSuccess) onSuccess();
      } else {
        const rentalRes = await api.createRental({
          product_id: product.id,
          duration_months: durationMonths,
          start_date: startDate,
          payment_method: paymentDetails.payment_method,
          payment_status: 'paid',
          transaction_id: paymentDetails.transaction_id,
          pickup_notes: pickupNotes
        });

        setOrderComplete({
          type: 'rent',
          orderNumber: rentalRes.rental.rental_number,
          transactionId: paymentDetails.transaction_id,
          paymentMethod: paymentDetails.payment_method,
          paymentStatus: 'paid',
          amount: totalAmount,
          deposit: securityDeposit,
          sellerName: product.seller_name
        });

        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to place order.');
    } finally {
      setProcessing(false);
    }
  };

  // 3. User chose to pay on handover at college meetup
  const handlePayOnHandover = async () => {
    setProcessing(true);
    setError('');

    try {
      if (mode === 'buy') {
        const orderRes = await api.createOrder({
          product_id: product.id,
          payment_method: 'Pay on Campus Handover (Cash/UPI)',
          payment_status: 'pending_pickup',
          transaction_id: 'HANDOVER-PENDING',
          pickup_notes: pickupNotes
        });

        setOrderComplete({
          type: 'buy',
          orderNumber: orderRes.order.order_number,
          transactionId: 'HANDOVER-PENDING',
          paymentMethod: 'Pay on Campus Handover',
          paymentStatus: 'pending_pickup',
          amount: totalAmount,
          sellerName: product.seller_name
        });

        if (onSuccess) onSuccess();
      } else {
        const rentalRes = await api.createRental({
          product_id: product.id,
          duration_months: durationMonths,
          start_date: startDate,
          payment_method: 'Pay on Campus Handover (Cash/UPI)',
          payment_status: 'pending_pickup',
          transaction_id: 'HANDOVER-PENDING',
          pickup_notes: pickupNotes
        });

        setOrderComplete({
          type: 'rent',
          orderNumber: rentalRes.rental.rental_number,
          transactionId: 'HANDOVER-PENDING',
          paymentMethod: 'Pay on Campus Handover',
          paymentStatus: 'pending_pickup',
          amount: totalAmount,
          deposit: securityDeposit,
          sellerName: product.seller_name
        });

        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Handover order error:', err);
      setError(err.message || 'Failed to place handover order.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-card" 
          onClick={(e) => e.stopPropagation()} 
          style={{ maxWidth: '540px', maxHeight: '92vh', overflowY: 'auto' }}
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
                  <ShieldCheck size={16} /> CampusMarket Verified Student Exchange
                </div>
                <h3 style={{ fontSize: '1.35rem', margin: 0 }}>
                  {mode === 'buy' ? 'Purchase Item Checkout' : 'Campus Rental Booking'}
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
                  style={{ width: '68px', height: '68px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.925rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.title}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Seller: <strong>{product.seller_name}</strong> • {product.condition}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                    📍 Campus: {product.location}
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
                    ℹ️ Refundable deposit of {formatPrice(securityDeposit)} is returned when item is handed back.
                  </div>
                </div>
              )}

              {/* Campus Meetup Handover Note */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Campus Handover Meeting Location & Notes
                </label>
                <input 
                  type="text"
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="e.g. Near college library canteen or main gate"
                  className="filter-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Payment Method / Mode Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.65rem' }}>
                  Select Payment & Handover Method
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* Option 1: Online via Payment Gateway */}
                  <div 
                    onClick={() => setCheckoutOption('online_gateway')}
                    style={{
                      border: checkoutOption === 'online_gateway' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: checkoutOption === 'online_gateway' ? 'var(--primary-light)' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="checkoutOption" 
                      checked={checkoutOption === 'online_gateway'} 
                      onChange={() => setCheckoutOption('online_gateway')}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: checkoutOption === 'online_gateway' ? 'var(--primary)' : 'var(--text-main)' }}>
                          Pay Online via CampusPay / Razorpay Gateway
                        </strong>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                          RECOMMENDED
                        </span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        UPI (GPay, PhonePe, Paytm QR), RuPay/Debit Card with 3D Secure OTP, or NetBanking. Money safely held in Escrow until meetup.
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Pay on Campus Handover */}
                  <div 
                    onClick={() => setCheckoutOption('handover')}
                    style={{
                      border: checkoutOption === 'handover' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: checkoutOption === 'handover' ? 'var(--primary-light)' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="checkoutOption" 
                      checked={checkoutOption === 'handover'} 
                      onChange={() => setCheckoutOption('handover')}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: checkoutOption === 'handover' ? 'var(--primary)' : 'var(--text-main)' }}>
                          Pay on Campus Handover (Cash or Meetup UPI)
                        </strong>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Inspect & Pay
                        </span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Inspect textbook/item in person first. Pay seller in cash or direct UPI at campus library/canteen. Order status marked "Pending Handover".
                      </div>
                    </div>
                  </div>
                </div>
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

              {/* Action Button */}
              <button 
                type="button" 
                onClick={handleProceedClick}
                disabled={processing}
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  fontSize: '1rem', 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {processing ? 'Processing...' : checkoutOption === 'online_gateway' ? (
                  <>
                    <CreditCard size={18} /> Proceed to Payment Gateway ({formatPrice(totalAmount)}) <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <Handshake size={18} /> Place Order (Pay {formatPrice(totalAmount)} on Handover)
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Order / Rental Success Confirmation View */
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: orderComplete.paymentStatus === 'paid' ? 'var(--success-bg)' : '#fef3c7',
                color: orderComplete.paymentStatus === 'paid' ? 'var(--success)' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                {orderComplete.paymentStatus === 'paid' ? <CheckCircle size={36} /> : <Clock size={36} />}
              </div>

              <h3 style={{ fontSize: '1.45rem', marginBottom: '0.4rem' }}>
                {orderComplete.paymentStatus === 'paid' 
                  ? (orderComplete.type === 'buy' ? 'Order & Payment Confirmed!' : 'Rental & Payment Confirmed!')
                  : 'Order Reserved (Pay on Handover)!'}
              </h3>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Order Number: <strong>{orderComplete.orderNumber}</strong>
              </p>

              {/* Receipt Box */}
              <div style={{
                background: 'var(--surface-alt)',
                padding: '1.15rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                textAlign: 'left',
                fontSize: '0.85rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                  <span className={`badge ${orderComplete.paymentStatus === 'paid' ? 'badge-sell' : 'badge-warning'}`}>
                    {orderComplete.paymentStatus === 'paid' ? '✓ Paid Online (Escrow)' : '⏳ Pay at Campus Meetup'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                  <strong>{orderComplete.paymentMethod}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transaction Reference:</span>
                  <code style={{ fontSize: '0.775rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                    {orderComplete.transactionId}
                  </code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Product:</span>
                  <strong style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.title}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Seller:</span>
                  <strong>{orderComplete.sellerName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 700 }}>Total Amount:</span>
                  <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                    {formatPrice(orderComplete.amount)}
                  </strong>
                </div>

                {orderComplete.deposit && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', marginTop: '0.35rem', fontSize: '0.8rem' }}>
                    <span>Security Deposit Held:</span>
                    <span>{formatPrice(orderComplete.deposit)} (Refundable)</span>
                  </div>
                )}
              </div>

              {/* Handover Guidance */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                color: '#1e40af',
                textAlign: 'left',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <MapPin size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Next Step:</strong> Open chat with <strong>{orderComplete.sellerName}</strong> to coordinate meeting at college library/canteen.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenChat) onOpenChat(product);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }}
                >
                  💬 Chat with Seller to Coordinate Handover
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

      {/* POPUP PAYMENT GATEWAY */}
      {isGatewayOpen && (
        <PaymentGatewayModal
          isOpen={isGatewayOpen}
          amount={totalAmount}
          product={product}
          mode={mode}
          onClose={() => setIsGatewayOpen(false)}
          onPaymentSuccess={handleGatewaySuccess}
        />
      )}
    </>
  );
}
