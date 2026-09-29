import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { api } from '../services/api';

export default function ReviewModal({ sellerId, sellerName, productId, orderId, rentalId, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please write a brief comment describing your transaction experience.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.createReview({
        seller_id: sellerId,
        product_id: productId,
        order_id: orderId,
        rental_id: rentalId,
        rating,
        comment: comment.trim()
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '440px' }}
      >
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>
          Rate & Review {sellerName}
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Your honest rating helps fellow college students buy and rent safely.
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

        <form onSubmit={handleSubmit}>
          {/* Star selector */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ color: (hoverRating || rating) >= star ? '#f59e0b' : '#cbd5e1' }}
                >
                  <Star size={32} fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'} />
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {rating === 5 ? 'Excellent (5/5)' : rating === 4 ? 'Good (4/5)' : rating === 3 ? 'Average (3/5)' : rating === 2 ? 'Below Average (2/5)' : 'Poor (1/5)'}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Your Review & Comments *
            </label>
            <textarea 
              rows={4}
              required
              placeholder="How was the item condition? Was the student responsive and punctual during meetup?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="filter-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
