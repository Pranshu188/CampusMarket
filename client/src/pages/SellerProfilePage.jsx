import React, { useState, useEffect } from 'react';
import { 
  User, Star, ShieldCheck, MapPin, Calendar, BookOpen, MessageSquare,
  Package, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function SellerProfilePage({ sellerId, onNavigate }) {
  const { user, openAuthModal } = useAuth();
  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSeller() {
      try {
        setLoading(true);
        const res = await api.getSellerProfile(sellerId);
        setSeller(res.seller);
        setListings(res.listings || []);
        setReviews(res.reviews || []);
      } catch (err) {
        console.error('Error loading seller:', err);
        setError('Seller profile not found.');
      } finally {
        setLoading(false);
      }
    }
    if (sellerId) loadSeller();
  }, [sellerId]);

  const handleStartChat = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    onNavigate('/messages', { recipientId: seller.id });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading student profile...
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <h2>Seller Profile Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>This profile does not exist or has been removed.</p>
        <button onClick={() => onNavigate('/browse')} className="btn btn-primary">
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Seller Header Card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img 
            src={seller.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${seller.name}`} 
            alt={seller.name} 
            style={{ width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{seller.name}</h1>
              <span className="badge badge-academic">Verified Student</span>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-body)', fontWeight: 600, marginBottom: '0.35rem' }}>
              {seller.college || 'College Student'} {seller.course ? `• ${seller.course}` : ''} {seller.semester ? `• Sem ${seller.semester}` : ''}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={13} /> {seller.location || 'Campus'}
              </div>
              <div>•</div>
              <div>Member since {new Date(seller.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</div>
            </div>

            {seller.bio && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '540px' }}>
                "{seller.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Rating and Chat button */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '160px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              <Star size={20} fill="#f59e0b" color="#f59e0b" />
              <span>{seller.rating || '5.0'}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {seller.reviewCount || 0} student reviews
            </div>
          </div>

          {user?.id !== seller.id && (
            <button 
              onClick={handleStartChat}
              className="btn btn-primary"
              style={{ gap: '0.4rem' }}
            >
              <MessageSquare size={16} /> Chat with Student
            </button>
          )}
        </div>
      </div>

      {/* Active Listings Grid */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>
          Active Listings by {seller.name.split(' ')[0]} ({listings.length})
        </h2>

        {listings.length > 0 ? (
          <div className="product-grid">
            {listings.map(prod => (
              <ProductCard key={prod.id} product={prod} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active listings right now.
          </div>
        )}
      </div>

      {/* Student Reviews & Feedback */}
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>
          Reviews & Feedback ({reviews.length})
        </h2>

        {reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map(rev => (
              <div 
                key={rev.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img 
                      src={rev.reviewer_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${rev.reviewer_name}`} 
                      alt="" 
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>{rev.reviewer_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.reviewer_college || 'Student'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#f59e0b' }}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="#f59e0b" />
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
                  "{rev.comment}"
                </p>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-light)', marginTop: '0.4rem' }}>
                  {new Date(rev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No reviews yet for this student seller.
          </div>
        )}
      </div>
    </div>
  );
}
