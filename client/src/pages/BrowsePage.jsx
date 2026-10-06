import React, { useState, useEffect } from 'react';
import { 
  Filter, X, Search, SlidersHorizontal, ArrowUpDown, ChevronDown, 
  RotateCcw, Sparkles, BookOpen, AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function BrowsePage({ searchParams = {}, onNavigate }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [search, setSearch] = useState(searchParams.search || '');
  const [category, setCategory] = useState(searchParams.category || 'All');
  const [type, setType] = useState(searchParams.type || 'all'); // 'all', 'sell', 'rent'
  const [minPrice, setMinPrice] = useState(searchParams.min_price || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.max_price || '');
  const [condition, setCondition] = useState(searchParams.condition || 'All');
  const [college, setCollege] = useState(searchParams.college || '');
  const [course, setCourse] = useState(searchParams.course || '');
  const [branch, setBranch] = useState(searchParams.branch || '');
  const [semester, setSemester] = useState(searchParams.semester || 'All');
  const [subject, setSubject] = useState(searchParams.subject || '');
  const [location, setLocation] = useState(searchParams.location || '');
  const [sort, setSort] = useState(searchParams.sort || 'newest');

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Load categories
  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories || [])).catch(() => {});
  }, []);

  // Sync external searchParams when URL changes
  useEffect(() => {
    if (searchParams.search !== undefined) setSearch(searchParams.search);
    if (searchParams.category !== undefined) setCategory(searchParams.category || 'All');
    if (searchParams.type !== undefined) setType(searchParams.type || 'all');
    if (searchParams.sort !== undefined) setSort(searchParams.sort || 'newest');
  }, [searchParams]);

  // Fetch products with active filters
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({
        search,
        category: category === 'All' ? '' : category,
        type,
        min_price: minPrice,
        max_price: maxPrice,
        condition: condition === 'All' ? '' : condition,
        college,
        course,
        branch,
        semester: semester === 'All' ? '' : semester,
        subject,
        location,
        sort,
        limit: 30
      });
      setProducts(res.products || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, type, minPrice, maxPrice, condition, college, course, branch, semester, subject, location, sort]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setType('all');
    setMinPrice('');
    setMaxPrice('');
    setCondition('All');
    setCollege('');
    setCourse('');
    setBranch('');
    setSemester('All');
    setSubject('');
    setLocation('');
    setSort('newest');
  };

  const hasActiveFilters = search || (category && category !== 'All') || type !== 'all' || minPrice || maxPrice || (condition && condition !== 'All') || college || course || branch || (semester && semester !== 'All') || subject || location;

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      {/* Top Breadcrumb & Mobile Filter Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            {category && category !== 'All' ? category : 'Campus Marketplace'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Showing {products.length} of {totalCount} academic items and student essentials
          </p>
        </div>

        {/* Mobile Filter Toggle Button */}
        <button 
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none' }} /* Visible on mobile via CSS */
        >
          <Filter size={15} /> Filters {hasActiveFilters && '•'}
        </button>
      </div>

      <div className="browse-layout">
        {/* SIDEBAR FILTERS (Sticky on Desktop) */}
        <aside className={`filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="filter-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <SlidersHorizontal size={17} /> Filters
            </div>
            {hasActiveFilters && (
              <button 
                type="button" 
                onClick={handleResetFilters}
                style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <RotateCcw size={12} /> Reset all
              </button>
            )}
          </div>

          {/* Search Keyword */}
          <div className="filter-group">
            <label className="filter-title">Keyword Search</label>
            <input 
              type="text" 
              placeholder="e.g. Accounting, Casio, Table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Buy vs Rent */}
          <div className="filter-group">
            <label className="filter-title">Transaction Type</label>
            <div className="filter-chips-grid">
              <button 
                type="button" 
                className={`filter-chip-btn ${type === 'all' ? 'active' : ''}`}
                onClick={() => setType('all')}
              >
                All Items
              </button>
              <button 
                type="button" 
                className={`filter-chip-btn ${type === 'sell' ? 'active' : ''}`}
                onClick={() => setType('sell')}
              >
                Buy (For Sale)
              </button>
              <button 
                type="button" 
                className={`filter-chip-btn ${type === 'rent' ? 'active' : ''}`}
                onClick={() => setType('rent')}
              >
                Rent (For Semester)
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="filter-group">
            <label className="filter-title">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="filter-input"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c.active_count === undefined || c.active_count > 0).map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Academic Information Filters */}
          <div className="filter-group">
            <label className="filter-title" style={{ color: 'var(--primary)', borderBottom: '1px dashed var(--primary-border)', paddingBottom: '0.3rem' }}>
              Academic Filters (GOVERNMENT POLITECNIC COLLAGE PALANPUR)
            </label>

            <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  College / Institute
                </span>
                <input 
                  type="text" 
                  placeholder="e.g. GOVERNMENT POLITECNIC COLLAGE PALANPUR"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                    Course
                  </span>
                  <input 
                    type="text" 
                    placeholder="BBA, B.Tech..."
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                    Semester
                  </span>
                  <select 
                    value={semester} 
                    onChange={(e) => setSemester(e.target.value)}
                    className="filter-input"
                  >
                    <option value="All">All Sem</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                  Branch / Subject
                </span>
                <input 
                  type="text" 
                  placeholder="e.g. Finance, Maths, CE"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label className="filter-title">Price Range (₹)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="number" 
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="filter-input"
                style={{ width: '50%' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>—</span>
              <input 
                type="number" 
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="filter-input"
                style={{ width: '50%' }}
              />
            </div>
          </div>

          {/* Condition */}
          <div className="filter-group">
            <label className="filter-title">Product Condition</label>
            <div className="filter-chips-grid">
              {['All', 'Like New', 'Good', 'Used'].map(cond => (
                <button
                  key={cond}
                  type="button"
                  className={`filter-chip-btn ${condition === cond ? 'active' : ''}`}
                  onClick={() => setCondition(cond)}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Campus Location */}
          <div className="filter-group">
            <label className="filter-title">City / Campus Area</label>
            <input 
              type="text" 
              placeholder="e.g. Navrangpura, Matunga, North Campus"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="filter-input"
            />
          </div>
        </aside>

        {/* PRODUCTS MAIN CONTENT AREA */}
        <main>
          {/* Top Toolbar */}
          <div className="browse-toolbar">
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <strong>{totalCount}</strong> products available
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort by:</span>
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value)}
                className="filter-input"
                style={{ width: 'auto', padding: '0.35rem 0.65rem' }}
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="views">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {search && (
                <span className="badge badge-academic" style={{ padding: '0.3rem 0.6rem' }}>
                  Search: "{search}" <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => setSearch('')} />
                </span>
              )}
              {category && category !== 'All' && (
                <span className="badge badge-academic" style={{ padding: '0.3rem 0.6rem' }}>
                  {category} <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => setCategory('All')} />
                </span>
              )}
              {college && (
                <span className="badge badge-academic" style={{ padding: '0.3rem 0.6rem' }}>
                  College: {college} <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => setCollege('')} />
                </span>
              )}
              {semester && semester !== 'All' && (
                <span className="badge badge-academic" style={{ padding: '0.3rem 0.6rem' }}>
                  Sem {semester} <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => setSemester('All')} />
                </span>
              )}
              {type !== 'all' && (
                <span className="badge badge-academic" style={{ padding: '0.3rem 0.6rem' }}>
                  {type === 'sell' ? 'Buy Only' : 'Rent Only'} <X size={12} style={{ cursor: 'pointer', marginLeft: '3px' }} onClick={() => setType('all')} />
                </span>
              )}
              <button 
                type="button" 
                onClick={handleResetFilters}
                style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600, marginLeft: '0.5rem' }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              Loading products...
            </div>
          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '3.5rem 1.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--surface-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--text-muted)'
              }}>
                <Search size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No products match your search</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                We couldn't find items matching your current filters. Try relaxing your filters or create an item request!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <button type="button" onClick={handleResetFilters} className="btn btn-secondary">
                  Reset Filters
                </button>
                <button type="button" onClick={() => onNavigate('/requests')} className="btn btn-primary">
                  Post an Item Request
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
