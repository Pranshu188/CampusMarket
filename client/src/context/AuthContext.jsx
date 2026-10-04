import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cm_token'));
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    unreadNotifications: 0,
    unreadMessages: 0,
    activeListings: 0,
    wishlistCount: 0
  });

  // Global Auth Modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'register'
  const [authRedirectAction, setAuthRedirectAction] = useState(null);

  const openAuthModal = (mode = 'login', callback = null) => {
    setAuthModalMode(mode);
    setAuthRedirectAction(() => callback);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthRedirectAction(null);
  };

  // Fetch current user and badges
  const loadUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      if (data.user?.role) {
        localStorage.setItem('cm_user_role', data.user.role);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [token]);

  const handleAuthSuccess = (res) => {
    localStorage.setItem('cm_token', res.token);
    if (res.user?.role) {
      localStorage.setItem('cm_user_role', res.user.role);
    }
    setToken(res.token);
    setUser(res.user);
    closeAuthModal();
    if (authRedirectAction) {
      authRedirectAction(res.user);
    }
  };

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    handleAuthSuccess(res);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    handleAuthSuccess(res);
    return res.user;
  };

  const sendOtp = async (phone) => {
    return await api.sendOtp(phone);
  };

  const verifyOtp = async (payload) => {
    const res = await api.verifyOtp(payload);
    handleAuthSuccess(res);
    return res.user;
  };

  const googleLogin = async (payload) => {
    const res = await api.googleLogin(payload);
    handleAuthSuccess(res);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('cm_token');
    localStorage.removeItem('cm_user_role');
    setToken(null);
    setUser(null);
    setCounts({
      unreadNotifications: 0,
      unreadMessages: 0,
      activeListings: 0,
      wishlistCount: 0
    });
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    return res.user;
  };

  const refreshCounts = async () => {
    if (token) {
      try {
        const data = await api.getMe();
        if (data.counts) setCounts(data.counts);
      } catch (e) {
        // silent fail
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        counts,
        isAdmin: user?.role === 'admin',
        login,
        register,
        sendOtp,
        verifyOtp,
        googleLogin,
        logout,
        updateProfile,
        refreshCounts,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
