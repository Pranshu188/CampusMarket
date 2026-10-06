import React, { useState, useEffect } from 'react';
import { 
  Upload, X, Plus, AlertCircle, CheckCircle, Image as ImageIcon,
  DollarSign, BookOpen, Layers, ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SellPage({ onNavigate }) {
  const { user, openAuthModal, refreshCounts } = useAuth();
  const [categories, setCategories] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState('Textbooks');
  const [listingType, setListingType] = useState('sell'); // 'sell', 'rent', 'both'
  const [price, setPrice] = useState('');
  const [rentPriceMonthly, setRentPriceMonthly] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [rentalTerms, setRentalTerms] = useState('');
  const [condition, setCondition] = useState('Good');

  // Academic Fields
  const [college, setCollege] = useState(user?.college || '');
  const [course, setCourse] = useState(user?.course || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [semester, setSemester] = useState(user?.semester?.toString() || '1');
  const [subject, setSubject] = useState('');
  const [author, setAuthor] = useState('');
  const [edition, setEdition] = useState('');
  const [isbn, setIsbn] = useState('');

  const [location, setLocation] = useState(user?.location || 'Campus');
  const [contactPreference, setContactPreference] = useState('CampusMarket Chat');

  // Image upload state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [customImageUrls, setCustomImageUrls] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories || [])).catch(() => {});
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imagePreviews.length > 5) {
      alert('You can upload a maximum of 5 images per product.');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!title.trim() || !description.trim() || !price || !location.trim()) {
      setError('Please fill in all required fields (title, description, price, location).');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let uploadedUrls = [];

      // 1. Upload images if selected
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(file => {
          formData.append('images', file);
        });
        const uploadRes = await api.uploadImages(formData);
        uploadedUrls = uploadRes.urls || [];
      } else {
        // Fallback realistic placeholder based on category
        uploadedUrls = ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'];
      }

      // 2. Post product
      const res = await api.createProduct({
        title: title.trim(),
        description: description.trim(),
        category_name: categoryName,
        listing_type: listingType,
        price: parseFloat(price),
        rent_price_monthly: rentPriceMonthly ? parseFloat(rentPriceMonthly) : null,
        security_deposit: securityDeposit ? parseFloat(securityDeposit) : null,
        rental_terms: rentalTerms ? rentalTerms.trim() : null,
        condition,
        college: college ? college.trim() : null,
        course: course ? course.trim() : null,
        branch: branch ? branch.trim() : null,
        semester: semester ? parseInt(semester) : null,
        subject: subject ? subject.trim() : null,
        author: author ? author.trim() : null,
        edition: edition ? edition.trim() : null,
        isbn: isbn ? isbn.trim() : null,
        location: location.trim(),
        contact_preference: contactPreference,
        images: uploadedUrls
      });

      refreshCounts();
      setSuccess(res);
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to list product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '840px' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>List an Item on CampusMarket</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
          Sell or rent your unused textbooks, electronics, calculators, notes, or hostel furniture to fellow college students.
        </p>
      </div>

      {success ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
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

          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            {success.status === 'active' ? 'Listing Published Live!' : 'Listing Submitted for Approval'}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.75rem', lineHeight: 1.5 }}>
            {success.status === 'active'
              ? 'Your item is now visible to students across all campuses. Interested buyers will contact you through chat.'
              : 'Our student moderators will review your listing shortly. You can track status in your dashboard.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button 
              onClick={() => onNavigate(`/products/${success.productId}`)} 
              className="btn btn-primary"
            >
              View Listing
            </button>
            <button 
              onClick={() => {
                setSuccess(null);
                setTitle('');
                setDescription('');
                setPrice('');
                setImagePreviews([]);
                setImageFiles([]);
              }} 
              className="btn btn-secondary"
            >
              List Another Item
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-bg)',
              border: '1px solid #fecaca',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              1. Item Details
            </h3>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Listing Title *
              </label>
              <input 
                type="text" 
                required 
                placeholder="e.g. GTU BBA Sem 3 Financial Accounting Textbook (Tulsian)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="filter-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Category *
                </label>
                <select 
                  value={categoryName} 
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="filter-input"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Condition *
                </label>
                <select 
                  value={condition} 
                  onChange={(e) => setCondition(e.target.value)}
                  className="filter-input"
                >
                  <option value="New">Brand New (Unused)</option>
                  <option value="Like New">Like New (No markings / mint condition)</option>
                  <option value="Good">Good (Lightly underlined / minor wear)</option>
                  <option value="Fair">Fair (Readable, visible wear)</option>
                  <option value="Used">Used / Functional</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Description & Notes *
              </label>
              <textarea 
                rows={4}
                required
                placeholder="Describe condition, which chapters are included, whether solved exam papers are attached, reason for selling..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          {/* Section 2: Photos */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              2. Photos (Upload up to 5)
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              {imagePreviews.map((src, idx) => (
                <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImage(idx)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                  {idx === 0 && (
                    <span style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(15,118,110,0.85)', color: '#fff', fontSize: '0.65rem', textAlign: 'center', padding: '1px 0', fontWeight: 700 }}>
                      Primary
                    </span>
                  )}
                </div>
              ))}

              {imagePreviews.length < 5 && (
                <label style={{
                  width: '100px',
                  height: '100px',
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  gap: '0.3rem'
                }}>
                  <Upload size={20} />
                  <span>Add Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Clear photos of the front cover and open pages help items sell 3x faster.
            </p>
          </div>

          {/* Section 3: Pricing & Transaction Type */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              3. Pricing & Option (Sell or Rent)
            </h3>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <label style={{
                flex: 1,
                padding: '0.85rem',
                border: listingType === 'sell' ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: listingType === 'sell' ? 'var(--primary-light)' : '#fff',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="listing_type" 
                  value="sell" 
                  checked={listingType === 'sell'} 
                  onChange={() => setListingType('sell')}
                  style={{ marginRight: '0.5rem' }} 
                />
                <strong>Sell Only</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>One-time outright sale to student</div>
              </label>

              <label style={{
                flex: 1,
                padding: '0.85rem',
                border: listingType === 'rent' ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: listingType === 'rent' ? 'var(--primary-light)' : '#fff',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="listing_type" 
                  value="rent" 
                  checked={listingType === 'rent'} 
                  onChange={() => setListingType('rent')}
                  style={{ marginRight: '0.5rem' }} 
                />
                <strong>Rent Only</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Lend out for monthly rent + security deposit</div>
              </label>

              <label style={{
                flex: 1,
                padding: '0.85rem',
                border: listingType === 'both' ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: listingType === 'both' ? 'var(--primary-light)' : '#fff',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="listing_type" 
                  value="both" 
                  checked={listingType === 'both'} 
                  onChange={() => setListingType('both')}
                  style={{ marginRight: '0.5rem' }} 
                />
                <strong>Sell & Rent</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Allow student to choose purchase or rental</div>
              </label>
            </div>

            {/* Selling Price */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                {listingType === 'rent' ? 'Item Valuation Price (₹) *' : 'Selling Price (₹) *'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹</span>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g. 450"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="filter-input"
                  style={{ fontSize: '1.1rem', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Rental details if rent or both */}
            {(listingType === 'rent' || listingType === 'both') && (
              <div style={{
                padding: '1.25rem',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Monthly Rental Price (₹) *
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 150"
                      value={rentPriceMonthly}
                      onChange={(e) => setRentPriceMonthly(e.target.value)}
                      className="filter-input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                      Refundable Security Deposit (₹) *
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 500"
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Rental Conditions / Care Instructions
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. No water damage, return before semester finals"
                    value={rentalTerms}
                    onChange={(e) => setRentalTerms(e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Academic Information (High Search Value) */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
              4. Academic Search Details (Recommended)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Fill this in so juniors and batchmates can find this book when searching for their semester syllabus!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  College / University
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Gujarat Technological University (GTU)"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Course / Degree
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. BBA / B.Tech / B.Com"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Branch / Department
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Finance & Accounts / Computer Engg"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Semester
                </label>
                <select 
                  value={semester} 
                  onChange={(e) => setSemester(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Subject Name
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Financial Accounting"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Book Author / Publisher
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. P.C. Tulsian / B.S. Grewal"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Edition
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 5th Edition (2023)"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  ISBN (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. 978-9352834567"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Location & Handover */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
              5. Handover Location & Preferences
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Campus Area / City *
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Navrangpura / LDCE Campus, Ahmedabad"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Preferred Contact Mode
                </label>
                <select 
                  value={contactPreference} 
                  onChange={(e) => setContactPreference(e.target.value)}
                  className="filter-input"
                >
                  <option value="CampusMarket Chat">CampusMarket Internal Chat (Recommended)</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Phone Call">Phone Call</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', padding: '0.9rem' }}
          >
            {loading ? 'Publishing Listing...' : 'Publish Item Listing'}
          </button>
        </form>
      )}
    </div>
  );
}
