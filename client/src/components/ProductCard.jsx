import React, { useState } from 'react';
import { Heart, MapPin, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product, onNavigate, onWishlistChange }) {
  const { user, openAuthModal, refreshCounts } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(product.is_wishlisted || false);
  const [isHovered, setIsHovered] = useState(false);

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const nextState = !isWishlisted;
      setIsWishlisted(nextState);
      await api.toggleWishlist(product.id);
      refreshCounts();
      if (onWishlistChange) {
        onWishlistChange(product.id, nextState);
      }
    } catch (err) {
      setIsWishlisted(!isWishlisted); // Revert on failure
    }
  };

  // Build academic badge text if available
  const academicParts = [];
  if (product.college) {
    // Shorten common university names
    const shortCol = product.college
      .replace('GOVERNMENT POLITECNIC COLLAGE PALANPUR', 'GPC Palanpur')
      .replace('Gujarat Technological University', 'GPC Palanpur')
      .replace('Mumbai University', 'GPC Palanpur')
      .replace('Delhi University', 'GPC Palanpur');
    academicParts.push(shortCol);
  }
  if (product.course) academicParts.push(product.course);
  if (product.semester) academicParts.push(`Sem ${product.semester}`);
  const academicLine = academicParts.join(' • ');

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div 
      className="product-card"
      onClick={() => onNavigate(`/products/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
    >
      {/* Product Image Wrap */}
      <div className="card-image-wrap">
        <img 
          src={product.primary_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'} 
          alt={product.title}
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button 
          onClick={handleWishlistToggle}
          className={`card-wishlist-btn ${isWishlisted ? 'active' : ''}`}
          title={isWishlisted ? 'Remove from saved' : 'Save to wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Listing Type Badge */}
        <div className="card-badge-top">
          {product.listing_type === 'both' ? (
            <span className="badge badge-both">Buy or Rent</span>
          ) : product.listing_type === 'rent' ? (
            <span className="badge badge-rent">For Rent</span>
          ) : (
            <span className="badge badge-sell">For Sale</span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="card-content">
        {academicLine && (
          <div className="card-academic-line">
            {academicLine}
          </div>
        )}

        <h3 className="card-title" title={product.title}>
          {product.title}
        </h3>

        {/* Condition Tag */}
        <div style={{ marginBottom: '0.65rem' }}>
          <span className="badge badge-condition">
            {product.condition} Condition
          </span>
        </div>

        {/* Pricing Line */}
        <div className="card-pricing">
          <div>
            <div className="price-main">
              {formatPrice(product.price)}
            </div>
            {product.listing_type !== 'sell' && product.rent_price_monthly > 0 && (
              <div className="price-rent-hint">
                or {formatPrice(product.rent_price_monthly)}/mo
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'right' }}>
            {product.category_name}
          </div>
        </div>

        {/* Footer: Location & Date */}
        <div className="card-footer">
          <div className="card-location" title="Palanpur">
            <MapPin size={13} />
            <span>Palanpur</span>
          </div>

          <div>
            {product.views_count ? `${product.views_count} views` : 'New'}
          </div>
        </div>
      </div>
    </div>
  );
}
