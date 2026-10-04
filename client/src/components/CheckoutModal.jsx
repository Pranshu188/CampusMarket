import React, { useState } from 'react';
import { 
  X, CheckCircle, ShieldCheck, MapPin, Calendar, CreditCard, 
  Smartphone, Building2, AlertCircle, Handshake, Lock, ArrowRight, Clock, Shield
} from 'lucide-react';
import { api } from '../services/api';
import PaymentGatewayModal from './PaymentGatewayModal';

export default function CheckoutModal({ product, mode = 'buy', onClose, onSuccess, onOpenChat }) {
  const [durationMonths, setDurationMonths] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupNotes, setPickupNotes] = useState('Campus handover near college library');
  
  // Checkout Choice: 'online_escrow' | 'cod'
  const [checkoutOption, setCheckoutOption] = useState('online_escrow');
  
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

  // 1. If user chose online escrow payment, open the CampusMarket QR Gateway
  const handleProceedClick = () => {
    setError('');
    if (checkoutOption === 'online_escrow') {
      setIsGatewayOpen(true);
    } else {
      handlePayOnCod();
    }
  };

  // 2. Gateway success callback (after user scans CampusMarket QR and submits UTR)
  const handleGatewaySuccess = async (paymentDetails) => {
    setIsGatewayOpen(false);
    setProcessing(true);
    setError('');

    try {
      if (mode === 'buy') {
        const orderRes = await api.createOrder({
          product_id: product.id,
          payment_method: paymentDetails.payment_method,
          payment_status: 'escrow_held',
          utr_number: paymentDetails.utr_number,
          transaction_id: paymentDetails.transaction_id,
          pickup_notes: pickupNotes
        });

        setOrderComplete({
          type: 'buy',
          orderNumber: orderRes.order.order_number,
          transactionId: paymentDetails.transaction_id,
          utrNumber: paymentDetails.utr_number,
          paymentMethod: paymentDetails.payment_method,
          paymentStatus: 'escrow_held',
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
          payment_status: 'escrow_held',
          utr_number: paymentDetails.utr_number,
          transaction_id: paymentDetails.transaction_id,
          pickup_notes: pickupNotes
        });

        setOrderComplete({
          type: 'rent',
          orderNumber: rentalRes.rental.rental_number,
          transactionId: paymentDetails.transaction_id,
          utrNumber: paymentDetails.utr_number,
          paymentMethod: paymentDetails.payment_method,
          paymentStatus: 'escrow_held',
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

  // 3. User chose Cash on Delivery / Campus Handover (COD)
  const handlePayOnCod = async () => {
    setProcessing(true);
    setError('');

    try {
      if (mode === 'buy') {
        const orderRes = await api.createOrder({
          product_id: product.id,
          payment_method: 'Cash on Delivery (COD) / Handover',
          payment_status: 'pending_handover',
          transaction_id: 'COD-CAMPUS-HANDOVER',
          pickup_notes: pickupNotes
        });

        setOrderComplete({
          type: 'buy',
          orderNumber: orderRes.order.order_number,
          transactionId: 'COD-CAMPUS-HANDOVER',
          paymentMethod: 'Cash on Delivery (COD)',
          paymentStatus: 'pending_handover',
          amount: totalAmount,
          sellerName: product.seller_name
        });

        if (onSuccess) onSuccess();
      } else {
        const rentalRes = await api.createRental({
          product_id: product.id,
          duration_months: durationMonths,
          start_date: startDate,
          payment_method: 'Cash on Delivery (COD) / Handover',
          payment_status: 'pending_handover',
          transaction_id: 'COD-CAMPUS-HANDOVER',
          pickup_notes: pickupNotes
        });

        setOrderComplete({
          type: 'rent',
          orderNumber: rentalRes.rental.rental_number,
          transactionId: 'COD-CAMPUS-HANDOVER',
          paymentMethod: 'Cash on Delivery (COD)',
          paymentStatus: 'pending_handover',
          amount: totalAmount,
          deposit: securityDeposit,
          sellerName: product.seller_name
        });

        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('COD order error:', err);
      setError(err.message || 'Failed to place COD order.');
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
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  <ShieldCheck size={16} /> CampusMarket Admin Escrow Protection
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
                  <div style={{ fontSize: '0.775rem', color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>
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
                  Choose How You Want to Pay
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* Option 1: CampusMarket UPI QR (Online Admin Escrow) */}
                  <div 
                    onClick={() => setCheckoutOption('online_escrow')}
                    style={{
                      border: checkoutOption === 'online_escrow' ? '2px solid #059669' : '1px solid var(--border)',
                      background: checkoutOption === 'online_escrow' ? '#ecfdf5' : '#ffffff',
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
                      checked={checkoutOption === 'online_escrow'} 
                      onChange={() => setCheckoutOption('online_escrow')}
                      style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#059669' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: checkoutOption === 'online_escrow' ? '#065f46' : 'var(--text-main)' }}>
                          Pay Online via CampusMarket UPI QR (Admin Escrow)
                        </strong>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                          SAFE ESCROW
                        </span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Scan the CampusMarket UPI QR code. Money goes to Admin Escrow account and is <strong>held safely</strong>. The seller is only paid after you receive the book!
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery / Handover (COD) */}
                  <div 
                    onClick={() => setCheckoutOption('cod')}
                    style={{
                      border: checkoutOption === 'cod' ? '2px solid #059669' : '1px solid var(--border)',
                      background: checkoutOption === 'cod' ? '#ecfdf5' : '#ffffff',
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
                      checked={checkoutOption === 'cod'} 
                      onChange={() => setCheckoutOption('cod')}
                      style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#059669' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: checkoutOption === 'cod' ? '#065f46' : 'var(--text-main)' }}>
                          Cash on Delivery / Campus Handover (COD)
                        </strong>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Inspect & Pay
                        </span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Meet seller at the college library or canteen, physically inspect the item, and pay in cash or personal UPI directly on the spot.
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
                  <span>CampusMarket Admin Escrow Protection</span>
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
                  <span style={{ color: '#059669' }}>{formatPrice(totalAmount)}</span>
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
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {processing ? 'Processing...' : checkoutOption === 'online_escrow' ? (
                  <>
                    <Smartphone size={18} /> Pay via CampusMarket UPI QR ({formatPrice(totalAmount)}) <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <Handshake size={18} /> Place Order (Pay {formatPrice(totalAmount)} on COD / Handover)
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Order Success View with Escrow & Seller notification confirmation */
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: orderComplete.paymentStatus === 'escrow_held' ? '#ecfdf5' : '#fef3c7',
                color: orderComplete.paymentStatus === 'escrow_held' ? '#059669' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                {orderComplete.paymentStatus === 'escrow_held' ? <ShieldCheck size={38} /> : <Clock size={36} />}
              </div>

              <h3 style={{ fontSize: '1.45rem', marginBottom: '0.4rem', color: '#0f172a' }}>
                {orderComplete.paymentStatus === 'escrow_held' 
                  ? 'Payment Held in Admin Escrow!' 
                  : 'Order Reserved (Pay on COD Handover)!'}
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
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Escrow & Payment Status:</span>
                  <span className={`badge ${orderComplete.paymentStatus === 'escrow_held' ? 'badge-sell' : 'badge-warning'}`}>
                    {orderComplete.paymentStatus === 'escrow_held' ? '🛡️ Held in CampusMarket Escrow' : '⏳ Pay on COD Handover'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                  <strong>{orderComplete.paymentMethod}</strong>
                </div>

                {orderComplete.utrNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>UPI UTR Ref:</span>
                    <code style={{ fontSize: '0.8rem', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {orderComplete.utrNumber}
                    </code>
                  </div>
                )}

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
                  <span style={{ fontWeight: 700 }}>Amount:</span>
                  <strong style={{ color: '#059669', fontSize: '1rem' }}>
                    {formatPrice(orderComplete.amount)}
                  </strong>
                </div>
              </div>

              {/* Escrow Rule Note */}
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.8rem',
                color: '#065f46',
                textAlign: 'left',
                marginBottom: '1.5rem',
                lineHeight: 1.45
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} /> Notification Sent to Seller {orderComplete.sellerName}:
                </div>
                <div>
                  CampusMarket Admin has notified the seller that payment has been safely received into Escrow. Meet the seller at <strong>{pickupNotes}</strong> to collect your item. <strong>Only when you click "Mark Received" will the money be released to the seller.</strong>
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
                  style={{ width: '100%', padding: '0.75rem', fontWeight: 700, background: '#059669' }}
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

      {/* POPUP CAMPUSMARKET QR ESCROW GATEWAY */}
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
