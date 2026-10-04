// CampusMarket API Client

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('cm_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeader(),
    ...options.headers
  };

  // If body is not FormData, set Content-Type JSON
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  sendOtp: (phone) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  googleLogin: (payload) => request('/auth/google-login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getSellerProfile: (id) => request(`/auth/seller/${id}`),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/products?${query.toString()}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  reportProduct: (id, data) => request(`/products/${id}/report`, { method: 'POST', body: JSON.stringify(data) }),
  uploadImages: (formData) => request('/products/upload-images', { method: 'POST', body: formData }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Orders
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getMyOrders: () => request('/orders/my-orders'),
  getMySales: () => request('/orders/my-sales'),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Rentals
  createRental: (data) => request('/rentals', { method: 'POST', body: JSON.stringify(data) }),
  getMyRentals: () => request('/rentals/my-rentals'),
  getMyLended: () => request('/rentals/my-lended'),
  updateRentalStatus: (id, data) => request(`/rentals/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Requests
  getRequests: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/requests?${query.toString()}`);
  },
  createRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),
  getMyRequests: () => request('/requests/my-requests'),
  updateRequestStatus: (id, status) => request(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteRequest: (id) => request(`/requests/${id}`, { method: 'DELETE' }),

  // Messages
  getConversations: () => request('/messages/conversations'),
  getConversationById: (id) => request(`/messages/conversations/${id}`),
  sendMessage: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),

  // Wishlist
  getWishlist: () => request('/wishlist'),
  toggleWishlist: (product_id) => request('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ product_id }) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // Reviews
  createReview: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getSellerReviews: (sellerId) => request(`/reviews/seller/${sellerId}`),

  // Payment sandbox
  createPaymentOrder: (data) => request('/payment/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data) => request('/payment/verify', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminProducts: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/admin/products?${query.toString()}`);
  },
  approveProduct: (id) => request(`/admin/products/${id}/approve`, { method: 'PATCH' }),
  rejectProduct: (id, reason) => request(`/admin/products/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/admin/users?${query.toString()}`);
  },
  getAdminVerifications: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/admin/verifications?${query.toString()}`);
  },
  verifyStudent: (id, data) => request(`/admin/users/${id}/verify`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAdminOrders: () => request('/admin/orders'),
  getAdminRentals: () => request('/admin/rentals'),
  getAdminReports: () => request('/admin/reports'),
  updateReportStatus: (id, data) => request(`/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminReviews: () => request('/admin/reviews'),
  deleteReview: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }),
  updateSettings: (settings) => request('/admin/settings', { method: 'PATCH', body: JSON.stringify(settings) })
};
