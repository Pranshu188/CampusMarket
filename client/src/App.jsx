import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import ProductDetailPage from './pages/ProductDetailPage';
import SellPage from './pages/SellPage';
import RequestsPage from './pages/RequestsPage';
import MessagesPage from './pages/MessagesPage';
import DashboardPage from './pages/DashboardPage';
import ProfileEditPage from './pages/ProfileEditPage';
import SellerProfilePage from './pages/SellerProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { PolicyPage, AboutPage } from './pages/PolicyPages';

function MainApp() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [navParams, setNavParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const obj = {};
    for (const [key, value] of params.entries()) {
      obj[key] = value;
    }
    return obj;
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      const params = new URLSearchParams(window.location.search);
      const obj = {};
      for (const [key, value] of params.entries()) {
        obj[key] = value;
      }
      setNavParams(obj);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Custom navigation handler
  const handleNavigate = (path, params = {}) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let queryString = '';
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    if (query.toString()) {
      queryString = `?${query.toString()}`;
    }

    const fullUrl = `${path}${queryString}`;
    window.history.pushState({}, '', fullUrl);
    setCurrentPath(path);
    setNavParams(params);
  };

  // Route matching
  const renderCurrentView = () => {
    // 1. Product Detail Page: /products/:id
    if (currentPath.startsWith('/products/')) {
      const parts = currentPath.split('/');
      const productId = parts[2];
      return <ProductDetailPage productId={productId} onNavigate={handleNavigate} />;
    }

    // 2. Seller Profile: /seller/:id
    if (currentPath.startsWith('/seller/')) {
      const parts = currentPath.split('/');
      const sellerId = parts[2];
      return <SellerProfilePage sellerId={sellerId} onNavigate={handleNavigate} />;
    }

    // 3. Static & Dynamic Routes
    switch (currentPath) {
      case '/':
        return <HomePage onNavigate={handleNavigate} />;
      case '/browse':
      case '/products':
      case '/search':
        return <BrowsePage searchParams={navParams} onNavigate={handleNavigate} />;
      case '/sell':
        return <SellPage onNavigate={handleNavigate} />;
      case '/requests':
        return <RequestsPage onNavigate={handleNavigate} />;
      case '/messages':
        return <MessagesPage params={navParams} onNavigate={handleNavigate} />;
      case '/dashboard':
        return <DashboardPage initialTab={navParams.tab || 'listings'} onNavigate={handleNavigate} />;
      case '/profile':
        return <ProfileEditPage onNavigate={handleNavigate} />;
      case '/profile/edit':
        return <ProfileEditPage onNavigate={handleNavigate} />;
      case '/admin':
      case '/admin/login':
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      case '/terms':
        return <PolicyPage type="terms" onNavigate={handleNavigate} />;
      case '/privacy':
        return <PolicyPage type="privacy" onNavigate={handleNavigate} />;
      case '/community-guidelines':
      case '/safety':
        return <PolicyPage type="safety" onNavigate={handleNavigate} />;
      case '/about':
        return <AboutPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="site-wrapper">
      <Navbar 
        onNavigate={handleNavigate} 
        currentPath={currentPath}
        searchParams={navParams}
      />

      <div className="main-content">
        {renderCurrentView()}
      </div>

      <Footer onNavigate={handleNavigate} />
      
      {/* Mobile Sticky Bottom Nav */}
      <MobileBottomNav 
        onNavigate={handleNavigate} 
        currentPath={currentPath} 
      />

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
