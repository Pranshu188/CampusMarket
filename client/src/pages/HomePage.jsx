import React, { useState, useEffect } from 'react';
import { 
  Search, BookOpen, Layers, PlusCircle, ArrowRight, ShieldCheck, 
  MessageCircle, Sparkles, MapPin, CheckCircle2, AlertCircle, Package,
  Book, FileText, FlaskConical, Calculator, Laptop, Armchair, Home as HomeIcon,
  PenTool, Briefcase, Shirt, Cpu, Trophy
} from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function HomePage({ onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [catsRes, popularRes, recentRes] = await Promise.all([
          api.getCategories(),
          api.getProducts({ sort: 'views', limit: 8 }),
          api.getProducts({ sort: 'newest', limit: 8 })
        ]);
        setCategories(catsRes.categories || []);
        setPopularProducts(popularRes.products || []);
        setRecentProducts(recentRes.products || []);
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onNavigate('/browse', { search: searchInput.trim() });
    } else {
      onNavigate('/browse');
    }
  };

  const getCategoryIcon = (slug) => {
    switch (slug) {
      case 'textbooks': return <BookOpen size={24} />;
      case 'notes': return <FileText size={24} />;
      case 'lab-equipment': return <FlaskConical size={24} />;
      case 'calculators': return <Calculator size={24} />;
      case 'electronics': return <Laptop size={24} />;
      case 'furniture': return <Armchair size={24} />;
      case 'hostel-items': return <HomeIcon size={24} />;
      case 'stationery': return <PenTool size={24} />;
      case 'bags': return <Briefcase size={24} />;
      case 'clothing': return <Shirt size={24} />;
      case 'project-materials': return <Cpu size={24} />;
      case 'sports': return <Trophy size={24} />;
      default: return <Package size={24} />;
    }
  };

  const popularSearches = [
    'GTU BBA Sem 3 Financial Accounting',
    'Higher Engineering Mathematics',
    'Casio fx-991EX Calculator',
    'Mini Drafter',
    'Hostel Study Table',
    'SRCC Notes',
    'White Lab Coat'
  ];

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-pill-badge">
              <Sparkles size={14} />
              Peer-to-Peer Student Marketplace for Indian Campuses
            </div>

            <h1 className="hero-title">
              Find What You Need.<br />
              Sell What You Don't.
            </h1>

            <p className="hero-subtitle">
              CampusMarket connects college students across universities. Buy, sell, or rent used textbooks, semester notes, lab coats, calculators, and hostel essentials directly from fellow students.
            </p>

            {/* Prominent Search Bar */}
            <form onSubmit={handleHeroSearch} className="hero-search-box">
              <Search size={22} color="var(--text-light)" style={{ marginLeft: '0.5rem' }} />
              <input 
                type="text" 
                placeholder="Search books, notes, calculators, electronics, hostel items..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="hero-search-input"
              />
              <button type="submit" className="btn btn-primary btn-lg" style={{ borderRadius: 'var(--radius-md)' }}>
                Search
              </button>
            </form>

            {/* Popular Academic Keyword Chips */}
            <div className="hero-quick-tags">
              <span>Popular searches:</span>
              {popularSearches.map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNavigate('/browse', { search: term })}
                  className="hero-tag-link"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE CAMPUS ESSENTIALS (CATEGORIES) */}
      <section style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>Explore Campus Essentials</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Browse curated categories built specifically for college life</p>
            </div>
            <button 
              onClick={() => onNavigate('/browse')} 
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem' }}
            >
              All Categories <ArrowRight size={14} />
            </button>
          </div>

          <div className="category-cards-grid">
            {categories.slice(0, 12).map(cat => (
              <div 
                key={cat.id} 
                className="category-tile"
                onClick={() => onNavigate('/browse', { category: cat.name })}
                role="button"
                tabIndex={0}
              >
                <div className="category-tile-icon">
                  {getCategoryIcon(cat.slug)}
                </div>
                <div className="category-tile-name">{cat.name}</div>
                <div className="category-tile-count">
                  {cat.active_count !== undefined ? `${cat.active_count} items` : 'Explore'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. POPULAR NEAR YOU */}
      <section style={{ padding: '2rem 0 3.5rem', background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>Popular on Campuses</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>High-demand textbooks, scientific calculators & student essentials</p>
            </div>
            <button 
              onClick={() => onNavigate('/browse', { sort: 'views' })} 
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem' }}
            >
              View More <ArrowRight size={14} />
            </button>
          </div>

          <div className="product-grid">
            {popularProducts.slice(0, 8).map(prod => (
              <ProductCard key={prod.id} product={prod} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. RECENTLY LISTED */}
      <section style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>Recently Listed</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Newly posted items by students changing semesters or graduating</p>
            </div>
            <button 
              onClick={() => onNavigate('/browse', { sort: 'newest' })} 
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.4rem' }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="product-grid">
            {recentProducts.slice(0, 8).map(prod => (
              <ProductCard key={prod.id} product={prod} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. LOOKING FOR SOMETHING? (REQUEST SYSTEM CTA) */}
      <section style={{ padding: '3.5rem 0', background: 'var(--primary-light)', borderTop: '1px solid var(--primary-border)', borderBottom: '1px solid var(--primary-border)' }}>
        <div className="container">
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--primary-dark)', fontSize: '2rem', marginBottom: '0.85rem' }}>
              Looking for a Specific Textbook or Equipment?
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Can't find the exact edition for your semester? Post an item request on the student board. Seniors and students who have it will reach out to you directly!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => onNavigate('/requests')} 
                className="btn btn-primary btn-lg"
              >
                Browse Student Requests
              </button>
              <button 
                onClick={() => onNavigate('/sell')} 
                className="btn btn-secondary btn-lg"
              >
                List Your Unused Items
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW CAMPUSMARKET WORKS */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '0.5rem' }}>How CampusMarket Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Designed around how real college students exchange items safely on campus.
            </p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h4>Search by Academic Info</h4>
              <p>Filter specifically by university (e.g. GTU, MU, DU), course, branch, semester, or subject name.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h4>Chat with Student Seller</h4>
              <p>Use internal CampusMarket chat to confirm book condition, solved papers, and coordinate meetups.</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h4>Buy or Rent for Semester</h4>
              <p>Purchase outright or rent for the exam month with deposit protection and transparent fees.</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h4>Campus Handover</h4>
              <p>Meet safely on campus (library, canteen, or gate) to inspect the item and finalize transaction.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
