import React, { useState, useEffect } from 'react';
import { 
  Heart, MapPin, Share2, AlertTriangle, ShieldCheck, MessageCircle, 
  ShoppingBag, Calendar, User, Star, ChevronRight, Clock, BookOpen, Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import CheckoutModal from '../components/CheckoutModal';
import ReportModal from '../components/ReportModal';

export default function ProductDetailPage({ productId, onNavigate }) {
  const { user, openAuthModal, refreshCounts } = useAuth();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState('buy'); // 'buy' or 'rent'
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError('');
        const res = await api.getProductById(productId);
        setProduct(res.product);
        setImages(res.images || []);
        if (res.images && res.images.length > 0) {
          setSelectedImage(res.images[0].image_url);
        } else {
          setSelectedImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80');
        }
        setRelated(res.related || []);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    }
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleWishlistToggle = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const res = await api.toggleWishlist(product.id);
      setProduct(prev => ({ ...prev, is_wishlisted: res.saved }));
      refreshCounts();
    } catch (e) {}
  };

  const handleBuyClick = () => {
    if (!user) {
      openAuthModal('login', () => {
        setCheckoutMode('buy');
        setIsCheckoutOpen(true);
      });
    } else {
      setCheckoutMode('buy');
      setIsCheckoutOpen(true);
    }
  };

  const handleRentClick = () => {
    if (!user) {
      openAuthModal('login', () => {
        setCheckoutMode('rent');
        setIsCheckoutOpen(true);
      });
    } else {
      setCheckoutMode('rent');
      setIsCheckoutOpen(true);
    }
  };

  const handleChatClick = async () => {
    if (!user) {
      openAuthModal('login', () => {
        onNavigate('/messages', { productId: product.id, sellerId: product.seller_id });
      });
    } else {
      onNavigate('/messages', { productId: product.id, sellerId: product.seller_id });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Listing Unavailable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error || 'This listing does not exist or has been removed.'}</p>
        <button onClick={() => onNavigate('/browse')} className="btn btn-primary">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const isOwner = user && user.id === product.seller_id;
  const isAvailable = product.availability === 'available';

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
      {/* Breadcrumb Line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>Home</a>
        <ChevronRight size={14} />
        <a href="/browse" onClick={(e) => { e.preventDefault(); onNavigate('/browse'); }}>Marketplace</a>
        <ChevronRight size={14} />
        <a href={`/browse?category=${encodeURIComponent(product.category_name)}`} onClick={(e) => { e.preventDefault(); onNavigate('/browse', { category: product.category_name }); }}>
          {product.category_name}
        </a>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{product.title}</span>
      </div>

      <div className="product-detail-grid">
        {/* LEFT COLUMN: IMAGE GALLERY */}
        <div className="gallery-container">
          <div className="main-image-viewer">
            <img src={selectedImage} alt={product.title} />
          </div>

          {images.length > 1 && (
            <div className="thumbnail-row">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`thumb-btn ${selectedImage === img.image_url ? 'active' : ''}`}
                >
                  <img src={img.image_url} alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Peer Safety Box */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            marginTop: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} /> Campus Safety Guarantee
            </div>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <li>Meet on your college campus during daylight hours (e.g. Library, Canteen).</li>
              <li>Inspect condition, edition, and solved papers before concluding the exchange.</li>
              <li>Rental deposits are safely documented and tracked in your CampusMarket dashboard.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILS, PRICING & ACTIONS */}
        <div className="product-info-panel">
          {/* Top badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {product.listing_type === 'both' ? (
              <span className="badge badge-both">Buy or Rent</span>
            ) : product.listing_type === 'rent' ? (
              <span className="badge badge-rent">For Rent</span>
            ) : (
              <span className="badge badge-sell">For Sale</span>
            )}

            <span className="badge badge-condition">
              {product.condition} Condition
            </span>

            {product.availability !== 'available' && (
              <span className="badge badge-warning" style={{ textTransform: 'capitalize' }}>
                {product.availability}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '1.85rem', lineHeight: 1.3 }}>
            {product.title}
          </h1>

          {/* Location & Listed Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={15} color="var(--primary)" />
              <span>Palanpur</span>
            </div>
            <div>•</div>
            <div>Listed {new Date(product.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div>•</div>
            <div>{product.views_count} student views</div>
          </div>

          {/* Pricing Box */}
          <div className="pricing-box">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PURCHASE PRICE</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {formatPrice(product.price)}
                </div>
              </div>

              {product.listing_type !== 'sell' && product.rent_price_monthly > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR RENT FOR</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-dark)' }}>
                    {formatPrice(product.rent_price_monthly)}<span style={{ fontSize: '0.85rem', fontWeight: 500 }}>/month</span>
                  </div>
                </div>
              )}
            </div>

            {product.listing_type !== 'sell' && product.security_deposit > 0 && (
              <div style={{
                background: 'var(--surface-alt)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.775rem',
                color: 'var(--text-muted)',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Refundable Security Deposit:</span>
                <strong style={{ color: 'var(--text-main)' }}>{formatPrice(product.security_deposit)}</strong>
              </div>
            )}

            {/* Action Buttons Stack */}
            <div className="action-buttons-stack">
              {!isOwner ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: product.listing_type === 'both' ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
                    {(product.listing_type === 'sell' || product.listing_type === 'both') && (
                      <button 
                        onClick={handleBuyClick}
                        disabled={!isAvailable}
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%' }}
                      >
                        <ShoppingBag size={18} /> Buy Now ({formatPrice(product.price)})
                      </button>
                    )}

                    {(product.listing_type === 'rent' || product.listing_type === 'both') && (
                      <button 
                        onClick={handleRentClick}
                        disabled={!isAvailable}
                        className="btn btn-accent btn-lg"
                        style={{ width: '100%' }}
                      >
                        <Calendar size={18} /> Rent for Semester
                      </button>
                    )}
                  </div>

                  {/* Chat With Seller Button */}
                  <button 
                    onClick={handleChatClick}
                    className="btn btn-secondary btn-lg"
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <MessageCircle size={18} color="var(--primary)" /> Chat with Seller
                  </button>
                </>
              ) : (
                <div style={{
                  padding: '0.85rem',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--primary)',
                  fontWeight: 600
                }}>
                  This is your own listing. You can manage or edit it in your Student Dashboard.
                </div>
              )}

              {/* Auxiliary buttons: Wishlist, Share, Report */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button 
                  onClick={handleWishlistToggle}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, gap: '0.4rem', color: product.is_wishlisted ? 'var(--danger)' : 'inherit' }}
                >
                  <Heart size={15} fill={product.is_wishlisted ? 'currentColor' : 'none'} />
                  {product.is_wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                </button>

                <button 
                  onClick={handleShare}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  {copiedLink ? <Check size={15} color="var(--success)" /> : <Share2 size={15} />}
                  {copiedLink ? 'Link Copied' : 'Share'}
                </button>

                {!isOwner && (
                  <button 
                    onClick={() => setIsReportOpen(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--text-muted)' }}
                    title="Report listing"
                  >
                    <AlertTriangle size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Academic Information Specs Table */}
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.65rem' }}>Academic Specifications</h3>
            <table className="academic-specs-table">
              <tbody>
                {product.college && (
                  <tr>
                    <td className="spec-label">College / University</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{product.college}</td>
                  </tr>
                )}
                {product.course && (
                  <tr>
                    <td className="spec-label">Course / Degree</td>
                    <td>{product.course}</td>
                  </tr>
                )}
                {product.branch && (
                  <tr>
                    <td className="spec-label">Branch / Department</td>
                    <td>{product.branch}</td>
                  </tr>
                )}
                {product.semester && (
                  <tr>
                    <td className="spec-label">Semester</td>
                    <td>Semester {product.semester}</td>
                  </tr>
                )}
                {product.subject && (
                  <tr>
                    <td className="spec-label">Subject</td>
                    <td>{product.subject}</td>
                  </tr>
                )}
                {product.author && (
                  <tr>
                    <td className="spec-label">Author / Manufacturer</td>
                    <td>{product.author}</td>
                  </tr>
                )}
                {product.edition && (
                  <tr>
                    <td className="spec-label">Edition</td>
                    <td>{product.edition}</td>
                  </tr>
                )}
                {product.isbn && (
                  <tr>
                    <td className="spec-label">ISBN Code</td>
                    <td><code>{product.isbn}</code></td>
                  </tr>
                )}
                <tr>
                  <td className="spec-label">Contact Mode</td>
                  <td>{product.contact_preference || 'CampusMarket Internal Chat'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Description & Condition Notes</h3>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: 'var(--text-body)',
              whiteSpace: 'pre-line'
            }}>
              {product.description}
            </div>
          </div>

          {/* Rental Terms if applicable */}
          {product.rental_terms && (
            <div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Rental Terms & Agreement</h3>
              <div style={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5
              }}>
                {product.rental_terms}
              </div>
            </div>
          )}

          {/* Seller Profile Card */}
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Student Seller</h3>
            <div 
              className="seller-card"
              onClick={() => onNavigate(`/seller/${product.seller_id}`)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={product.seller_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${product.seller_name}`} 
                alt={product.seller_name} 
                className="seller-avatar"
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>{product.seller_name}</h4>
                  <span className="badge badge-academic" style={{ fontSize: '0.7rem' }}>Verified Student</span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {product.seller_college || 'Student Member'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#f59e0b', fontWeight: 700 }}>
                    <Star size={14} fill="#f59e0b" />
                    <span>{product.seller_rating || '5.0'}</span>
                  </div>
                  <span style={{ color: 'var(--text-light)' }}>•</span>
                  <span style={{ color: 'var(--text-muted)' }}>{product.seller_review_count || 0} reviews</span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-light)" />
            </div>
          </div>
        </div>
      </div>

      {/* Related items */}
      {related.length > 0 && (
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Similar Items from Fellow Students</h2>
          <div className="product-grid">
            {related.map(prod => (
              <ProductCard key={prod.id} product={prod} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal 
          product={product}
          mode={checkoutMode}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            // refresh product status
            api.getProductById(productId).then(res => setProduct(res.product));
          }}
          onOpenChat={(prod) => onNavigate('/messages', { productId: prod.id, sellerId: prod.seller_id })}
        />
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <ReportModal 
          productId={product.id}
          productTitle={product.title}
          onClose={() => setIsReportOpen(false)}
          onSuccess={() => alert('Report submitted to moderators. Thank you.')}
        />
      )}
    </div>
  );
}
