import React from 'react';
import { ShoppingBag, ShieldCheck, Heart, MapPin, ExternalLink } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand Info */}
          <div className="footer-col">
            <div className="brand-logo" style={{ marginBottom: '0.85rem' }}>
              <div className="logo-icon">
                <ShoppingBag size={18} />
              </div>
              <span>CampusMarket</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              The student-to-student marketplace for college life. Buy, sell, or rent used textbooks, notes, calculators, lab coats, and hostel items directly with students on campus.
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              background: 'var(--primary-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary-border)',
              fontSize: '0.8rem',
              color: 'var(--primary)',
              fontWeight: 600
            }}>
              <ShieldCheck size={16} />
              Peer-to-Peer Verified Campus Exchanges
            </div>
          </div>

          {/* Col 2: Marketplace */}
          <div className="footer-col">
            <h5>Marketplace</h5>
            <ul className="footer-links">
              <li><a href="/browse" onClick={(e) => { e.preventDefault(); onNavigate('/browse'); }}>Browse All Items</a></li>
              <li><a href="/browse?category=Textbooks" onClick={(e) => { e.preventDefault(); onNavigate('/browse', { category: 'Textbooks' }); }}>College Textbooks</a></li>
              <li><a href="/browse?category=Calculators" onClick={(e) => { e.preventDefault(); onNavigate('/browse', { category: 'Calculators' }); }}>Scientific Calculators</a></li>
              <li><a href="/browse?category=Notes" onClick={(e) => { e.preventDefault(); onNavigate('/browse', { category: 'Notes' }); }}>Handwritten Notes</a></li>
              <li><a href="/browse?type=rent" onClick={(e) => { e.preventDefault(); onNavigate('/browse', { type: 'rent' }); }}>Rentals & Books for Rent</a></li>
              <li><a href="/requests" onClick={(e) => { e.preventDefault(); onNavigate('/requests'); }}>Student Item Requests</a></li>
              <li><a href="/sell" onClick={(e) => { e.preventDefault(); onNavigate('/sell'); }}>List an Item to Sell/Rent</a></li>
            </ul>
          </div>

          {/* Col 3: Student Safety & Community */}
          <div className="footer-col">
            <h5>Trust & Safety</h5>
            <ul className="footer-links">
              <li><a href="/community-guidelines" onClick={(e) => { e.preventDefault(); onNavigate('/community-guidelines'); }}>Campus Safety Guide</a></li>
              <li><a href="/community-guidelines" onClick={(e) => { e.preventDefault(); onNavigate('/community-guidelines'); }}>Community Standards</a></li>
              <li><a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate('/terms'); }}>Terms & Conditions</a></li>
              <li><a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate('/privacy'); }}>Privacy Policy</a></li>
              <li><a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('/about'); }}>About CampusMarket</a></li>
              <li>
                <a 
                  href="/admin" 
                  onClick={(e) => { e.preventDefault(); onNavigate('/admin'); }}
                  style={{ color: 'var(--primary)', fontWeight: 600 }}
                >
                  Admin / Moderator Portal
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Indian University Coverage */}
          <div className="footer-col">
            <h5>Campuses Supported</h5>
            <ul className="footer-links">
              <li><span>Gujarat Technological University (GTU)</span></li>
              <li><span>Mumbai University (MU / VJTI)</span></li>
              <li><span>Delhi University (DU / SRCC)</span></li>
              <li><span>VTU Karnataka</span></li>
              <li><span>Savitribai Phule Pune Univ (SPPU)</span></li>
              <li><span>Open to All Colleges Across India</span></li>
            </ul>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div style={{
          padding: '1rem 1.25rem',
          background: 'var(--surface-alt)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5
        }}>
          <strong style={{ color: 'var(--text-main)' }}>Safety Note:</strong> CampusMarket is a peer-to-peer student platform. We connect student buyers and sellers directly. Always meet in safe, public daytime locations such as the college library, canteen, or campus security gates. Inspect items before completing handovers.
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} <strong>CampusMarket</strong>. Buy. Sell. Rent. Campus Life Made Easy.
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate('/privacy'); }}>Privacy</a>
            <a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate('/terms'); }}>Terms</a>
            <a href="/community-guidelines" onClick={(e) => { e.preventDefault(); onNavigate('/community-guidelines'); }}>Safety</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
