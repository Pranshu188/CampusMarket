import React from 'react';
import { ShieldCheck, MapPin, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export function PolicyPage({ type = 'terms', onNavigate }) {
  if (type === 'safety' || type === 'community') {
    return (
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '800px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={18} /> Student Safety & Conduct
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '1.25rem' }}>Campus Safety & Community Guidelines</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
          CampusMarket is dedicated to providing a secure, reliable, and friendly student-to-student exchange environment. Please review these essential guidelines before meeting up.
        </p>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-dark)' }}>
            1. Safe Campus Meetups
          </h3>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
            <li><strong>Meet in Public Campus Spaces:</strong> Always arrange exchanges in open, busy areas such as your college library entrance, student canteen, or department lobby.</li>
            <li><strong>Daylight Hours:</strong> Schedule handovers during normal college hours between classes.</li>
            <li><strong>Bring a Friend:</strong> If meeting a student from another college or campus, bring a classmate along.</li>
            <li><strong>Never Share Private Dorm Numbers:</strong> Use general campus landmarks rather than private hostel room locations.</li>
          </ul>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-dark)' }}>
            2. Item Inspection Before Handover
          </h3>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
            <li><strong>Textbooks & Notes:</strong> Verify the edition number, syllabus match (GTU/MU/DU), and that essential pages or solved papers are intact.</li>
            <li><strong>Electronics & Calculators:</strong> Test scientific calculator buttons, display contrast, and battery operation on the spot.</li>
            <li><strong>Rental Security Deposits:</strong> Inspect items together and document condition in the CampusMarket chat.</li>
          </ul>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-dark)' }}>
            3. Prohibited Items & Harassment Policy
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-body)', lineHeight: 1.7 }}>
            CampusMarket strictly prohibits the listing of copyrighted exam answer keys, leaked test papers, weapons, alcohol, or unauthorized commercial products. Any harassment or fraudulent activity results in immediate account suspension and notification to campus authorities.
          </p>
        </div>
      </div>
    );
  }

  if (type === 'privacy') {
    return (
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '1.25rem' }}>Privacy Policy</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Last updated: September 2026
        </p>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', lineHeight: 1.7, fontSize: '0.9rem', color: 'var(--text-body)' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', marginTop: 0 }}>Information We Collect</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            We collect student registration information including your name, email, optional phone number, college, course, and semester. This information is used strictly to facilitate academic item discovery and verified peer-to-peer communication.
          </p>

          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Public vs Private Data</h3>
          <p style={{ marginBottom: '1.5rem' }}>
            Your full phone number and private student identity are never published openly on product pages. Buyers and sellers communicate through internal CampusMarket messages until they choose to arrange mutual campus pickup.
          </p>

          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Data Security</h3>
          <p style={{ margin: 0 }}>
            Passwords and credentials are encrypted using industry standard bcrypt hashes. We do not sell student data to third-party marketing companies.
          </p>
        </div>
      </div>
    );
  }

  // Default: Terms & Conditions
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '1.25rem' }}>Terms & Conditions</h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Last updated: September 2026
      </p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', lineHeight: 1.7, fontSize: '0.9rem', color: 'var(--text-body)' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', marginTop: 0 }}>1. Marketplace Platform Role</h3>
        <p style={{ marginBottom: '1.5rem' }}>
          CampusMarket operates as a peer-to-peer connection platform for students, faculty, and campus members. CampusMarket does not own the listed textbooks or equipment, and does not operate an independent delivery service. Buyers and sellers arrange direct inspection, pickup, and handover between themselves.
        </p>

        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>2. Rental Agreements & Security Deposits</h3>
        <p style={{ marginBottom: '1.5rem' }}>
          Rentals booked on CampusMarket establish a mutual agreement between the item owner and renter. The renter agrees to return the item on or before the agreed end date in equivalent condition. Security deposits are refundable upon verified return.
        </p>

        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>3. Seller Representations</h3>
        <p style={{ margin: 0 }}>
          Sellers warrant that they own or are authorized to sell/rent the items listed and that descriptions accurately reflect the condition and academic edition of the product.
        </p>
      </div>
    </div>
  );
}

export function AboutPage({ onNavigate }) {
  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        <CheckCircle2 size={18} /> Our Mission
      </div>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '1.25rem' }}>About CampusMarket</h1>
      
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', lineHeight: 1.7, fontSize: '0.95rem', color: 'var(--text-body)' }}>
        <p style={{ marginBottom: '1.25rem' }}>
          Every semester, millions of college students buy expensive textbooks, calculators, and lab tools that they only need for 4 to 5 months. Once finals are over, these valuable academic materials sit unused on hostel shelves or end up discarded.
        </p>
        <p style={{ marginBottom: '1.25rem' }}>
          Meanwhile, fresh juniors entering the semester scramble across bookstores and stationery shops trying to afford the same syllabus editions.
        </p>
        <p style={{ marginBottom: '1.75rem' }}>
          <strong>CampusMarket</strong> solves this simple equation: a dedicated, safe peer-to-peer marketplace that lets seniors earn back their investment while helping incoming students save up to 70% on campus life essentials.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => onNavigate('/browse')} className="btn btn-primary">
            Explore Marketplace
          </button>
          <button onClick={() => onNavigate('/sell')} className="btn btn-secondary">
            Start Selling / Renting
          </button>
        </div>
      </div>
    </div>
  );
}
