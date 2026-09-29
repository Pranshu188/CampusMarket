import React, { useState, useEffect } from 'react';
import { 
  Package, ShoppingBag, Calendar, Heart, BookOpen, Star, Trash2, 
  Edit3, ExternalLink, PlusCircle, CheckCircle, Clock, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import ReviewModal from '../components/ReviewModal';

export default function DashboardPage({ initialTab = 'listings', onNavigate }) {
  const { user, openAuthModal, refreshCounts } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Data States
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [lended, setLended] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    loadDataForTab(activeTab);
  }, [user, activeTab]);

  const loadDataForTab = async (tab) => {
    try {
      setLoading(true);
      if (tab === 'listings') {
        const res = await api.getProducts({ search: '' }); // We can filter by seller in memory or backend
        // Fetch all products owned by user via seller endpoint or direct query
        const sellerProfile = await api.getSellerProfile(user.id);
        setListings(sellerProfile.listings || []);
      } else if (tab === 'orders') {
        const [ordersRes, salesRes] = await Promise.all([
          api.getMyOrders(),
          api.getMySales()
        ]);
        setOrders(ordersRes.orders || []);
        setSales(salesRes.sales || []);
      } else if (tab === 'rentals') {
        const [rentalsRes, lendedRes] = await Promise.all([
          api.getMyRentals(),
          api.getMyLended()
        ]);
        setRentals(rentalsRes.rentals || []);
        setLended(lendedRes.lended || []);
      } else if (tab === 'wishlist') {
        const res = await api.getWishlist();
        setWishlist(res.wishlist || []);
      } else if (tab === 'requests') {
        const res = await api.getMyRequests();
        setMyRequests(res.requests || []);
      }
    } catch (err) {
      console.error('Error loading dashboard tab:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.deleteProduct(id);
      setListings(prev => prev.filter(p => p.id !== id));
      refreshCounts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
      setSales(prev => prev.map(s => s.id === orderId ? { ...s, order_status: newStatus } : s));
    } catch (e) {
      alert('Failed to update order status');
    }
  };

  const handleUpdateRentalStatus = async (rentalId, newStatus, depositStatus) => {
    try {
      await api.updateRentalStatus(rentalId, { rental_status: newStatus, deposit_status: depositStatus });
      setRentals(prev => prev.map(r => r.id === rentalId ? { ...r, rental_status: newStatus, deposit_status: depositStatus || r.deposit_status } : r));
      setLended(prev => prev.map(l => l.id === rentalId ? { ...l, rental_status: newStatus, deposit_status: depositStatus || l.deposit_status } : l));
    } catch (e) {
      alert('Failed to update rental');
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await api.deleteRequest(id);
      setMyRequests(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert('Failed to delete request');
    }
  };

  const formatPrice = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (!user) return null;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Student Welcome Header */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
            alt={user.name} 
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
          />
          <div>
            <h1 style={{ fontSize: '1.45rem', marginBottom: '0.2rem' }}>{user.name}</h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user.college || 'Student Member'} {user.course ? `• ${user.course}` : ''} {user.semester ? `• Sem ${user.semester}` : ''}
            </div>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('/sell')} 
          className="btn btn-primary"
          style={{ gap: '0.4rem' }}
        >
          <PlusCircle size={16} /> List an Item
        </button>
      </div>

      <div className="dashboard-layout">
        {/* SIDEBAR NAVIGATION */}
        <aside className="dashboard-nav">
          <button 
            onClick={() => setActiveTab('listings')}
            className={`dash-nav-item ${activeTab === 'listings' ? 'active' : ''}`}
          >
            <Package size={18} /> My Listings ({listings.length})
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`dash-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <ShoppingBag size={18} /> Orders & Purchases ({orders.length})
          </button>

          <button 
            onClick={() => setActiveTab('rentals')}
            className={`dash-nav-item ${activeTab === 'rentals' ? 'active' : ''}`}
          >
            <Calendar size={18} /> Rentals & Lent Items ({rentals.length + lended.length})
          </button>

          <button 
            onClick={() => setActiveTab('wishlist')}
            className={`dash-nav-item ${activeTab === 'wishlist' ? 'active' : ''}`}
          >
            <Heart size={18} /> Saved Wishlist ({wishlist.length})
          </button>

          <button 
            onClick={() => setActiveTab('requests')}
            className={`dash-nav-item ${activeTab === 'requests' ? 'active' : ''}`}
          >
            <BookOpen size={18} /> My Item Requests ({myRequests.length})
          </button>
        </aside>

        {/* TAB CONTENT AREA */}
        <main>
          {/* TAB 1: MY LISTINGS */}
          {activeTab === 'listings' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.35rem' }}>My Active Listings</h2>
                <button onClick={() => onNavigate('/sell')} className="btn btn-secondary btn-sm">
                  + Add New
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading listings...</div>
              ) : listings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {listings.map(prod => (
                    <div 
                      key={prod.id} 
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img 
                          src={prod.primary_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80'} 
                          alt="" 
                          style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                        />
                        <div>
                          <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{prod.title}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Price: <strong>{formatPrice(prod.price)}</strong> • Condition: {prod.condition} • {prod.category_name}
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                            <span className={prod.status === 'active' ? 'badge badge-sell' : 'badge badge-warning'}>
                              {prod.status === 'active' ? 'Live on Marketplace' : 'Pending Review'}
                            </span>
                            <span className="badge badge-condition" style={{ textTransform: 'capitalize' }}>
                              {prod.availability}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => onNavigate(`/products/${prod.id}`)}
                          className="btn btn-secondary btn-sm"
                          title="View live"
                        >
                          <ExternalLink size={14} /> View
                        </button>
                        <button 
                          onClick={() => handleDeleteListing(prod.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)' }}
                          title="Delete listing"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <Package size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>You have no active listings</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    Have old textbooks, drafters, calculators or notes from previous semesters?
                  </p>
                  <button onClick={() => onNavigate('/sell')} className="btn btn-primary">
                    List an Item to Sell or Rent
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY ORDERS & PURCHASES */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>My Purchases & Orders</h2>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading orders...</div>
              ) : orders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map(order => (
                    <div 
                      key={order.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.85rem' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order ID: </span>
                          <strong style={{ fontSize: '0.85rem' }}>{order.order_number}</strong>
                        </div>
                        <span className="badge badge-sell" style={{ textTransform: 'capitalize' }}>
                          Status: {order.order_status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <img 
                          src={order.product_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80'} 
                          alt="" 
                          style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>{order.product_title}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Seller: <strong>{order.seller_name}</strong> ({order.seller_college || 'Student'})
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.2rem' }}>
                            Amount Paid: {formatPrice(order.amount)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => onNavigate('/messages', { recipientId: order.seller_id, initialText: `Regarding order ${order.order_number}` })}
                            className="btn btn-secondary btn-sm"
                          >
                            Chat with Seller
                          </button>

                          {order.order_status !== 'completed' && (
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                              className="btn btn-primary btn-sm"
                            >
                              Mark Received
                            </button>
                          )}

                          {order.order_status === 'completed' && !order.review_id && (
                            <button 
                              onClick={() => setReviewTarget({
                                sellerId: order.seller_id,
                                sellerName: order.seller_name,
                                productId: order.product_id,
                                orderId: order.id
                              })}
                              className="btn btn-accent btn-sm"
                            >
                              <Star size={14} /> Rate Seller
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <ShoppingBag size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>No orders yet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    Browse textbooks and student equipment listed by students across campuses.
                  </p>
                  <button onClick={() => onNavigate('/browse')} className="btn btn-primary">
                    Browse Marketplace
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY RENTALS */}
          {activeTab === 'rentals' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Active Rentals & Lent Items</h2>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading rentals...</div>
              ) : rentals.length > 0 || lended.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {rentals.map(rnt => (
                    <div 
                      key={rnt.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.85rem' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rental ID: </span>
                          <strong style={{ fontSize: '0.85rem' }}>{rnt.rental_number}</strong>
                        </div>
                        <span className="badge badge-rent" style={{ textTransform: 'capitalize' }}>
                          Status: {rnt.rental_status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <img 
                          src={rnt.product_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80'} 
                          alt="" 
                          style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>{rnt.product_title}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Owner: <strong>{rnt.owner_name}</strong> • Duration: {rnt.duration_months} month(s)
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                            Active until <strong>{rnt.end_date}</strong> • Deposit Held: {formatPrice(rnt.security_deposit)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {rnt.rental_status === 'active' && (
                            <button 
                              onClick={() => handleUpdateRentalStatus(rnt.id, 'returned', 'refunded')}
                              className="btn btn-secondary btn-sm"
                            >
                              Mark Returned & Reclaim Deposit
                            </button>
                          )}
                          {!rnt.review_id && rnt.rental_status === 'returned' && (
                            <button 
                              onClick={() => setReviewTarget({
                                sellerId: rnt.owner_id,
                                sellerName: rnt.owner_name,
                                productId: rnt.product_id,
                                rentalId: rnt.id
                              })}
                              className="btn btn-accent btn-sm"
                            >
                              Rate Owner
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <Calendar size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>No active rentals</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    Need a calculator or textbook for just a semester or exam month? Rent items for cheap!
                  </p>
                  <button onClick={() => onNavigate('/browse', { type: 'rent' })} className="btn btn-primary">
                    Browse Items for Rent
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SAVED WISHLIST */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1.25rem' }}>Saved Wishlist Items</h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading wishlist...</div>
              ) : wishlist.length > 0 ? (
                <div className="product-grid">
                  {wishlist.map(prod => (
                    <ProductCard 
                      key={prod.id} 
                      product={{ ...prod, is_wishlisted: true }} 
                      onNavigate={onNavigate}
                      onWishlistChange={(id, saved) => {
                        if (!saved) setWishlist(prev => prev.filter(p => p.id !== id));
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <Heart size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>No saved items yet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    Save textbooks and equipment you might need later by tapping the heart icon on any product.
                  </p>
                  <button onClick={() => onNavigate('/browse')} className="btn btn-primary">
                    Explore Marketplace
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MY ITEM REQUESTS */}
          {activeTab === 'requests' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.35rem' }}>My Item Requests</h2>
                <button onClick={() => onNavigate('/requests')} className="btn btn-secondary btn-sm">
                  + Post Request
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading requests...</div>
              ) : myRequests.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {myRequests.map(req => (
                    <div 
                      key={req.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <span className="badge badge-academic" style={{ marginBottom: '0.3rem' }}>
                          Looking to {req.preferred_type}
                        </span>
                        <h4 style={{ fontSize: '1rem', marginTop: '0.2rem', marginBottom: '0.25rem' }}>{req.title}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Budget: {req.budget ? formatPrice(req.budget) : 'Flexible'} • {req.location}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleDeleteRequest(req.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} /> Remove Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3.5rem', textAlign: 'center' }}>
                  <BookOpen size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
                  <h3>You haven't posted any requests</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    Can't find a specific book for your semester? Post a request on the community board.
                  </p>
                  <button onClick={() => onNavigate('/requests')} className="btn btn-primary">
                    Post an Item Request
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal 
          sellerId={reviewTarget.sellerId}
          sellerName={reviewTarget.sellerName}
          productId={reviewTarget.productId}
          orderId={reviewTarget.orderId}
          rentalId={reviewTarget.rentalId}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => {
            alert('Review submitted! Thank you.');
            loadDataForTab(activeTab);
          }}
        />
      )}
    </div>
  );
}
