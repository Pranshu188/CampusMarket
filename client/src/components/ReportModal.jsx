import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function ReportModal({ productId, productTitle, onClose, onSuccess }) {
  const [reason, setReason] = useState('Fake listing');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Fake listing',
    'Scam/fraud',
    'Wrong information',
    'Inappropriate content',
    'Prohibited item',
    'Duplicate listing',
    'Harassment',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.reportProduct(productId, { reason, details });
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
          <AlertTriangle size={22} />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Report Product Listing</h3>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Help keep CampusMarket safe and trustworthy. Our student moderators review all reported listings.
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
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Reason for reporting *
            </label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="filter-input"
            >
              {reasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Additional Details (Optional)
            </label>
            <textarea 
              rows={3}
              placeholder="Provide any context that will help moderators investigate..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="filter-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-danger">
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
