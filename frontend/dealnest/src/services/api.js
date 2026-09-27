const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
const getToken = () => localStorage.getItem('dealnest_token');
const getAdminToken = () => localStorage.getItem('dealnest_admin_token');

// Drop every saved session detail (used when the backend rejects our token).
const clearSession = () => {
  localStorage.removeItem('dealnest_user');
  localStorage.removeItem('dealnest_role');
  localStorage.removeItem('dealnest_token');
  localStorage.removeItem('dealnest_admin');
  localStorage.removeItem('dealnest_admin_token');
};

const decodeJwtPayload = (token) => {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// Returns true when a non-expired token exists for the given type
// ('user' => the customer/store token, 'admin' => the admin token).
export const hasValidToken = (type = 'user') => {
  const token = type === 'admin' ? getAdminToken() : getToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 > Date.now();
};

const isLoginCall = (url = '') => /\/user\/login$|\/admin\/login$/.test(url);

/**
 * Returns headers for an authenticated user request.
 * Falls back to admin token when no user token is present (admin dashboard calls).
 */
const authHeaders = (extra = {}) => {
  const token = getToken() || getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

// ---------------------------------------------------------------------------
// Response handler
// ---------------------------------------------------------------------------
const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    let message = text || 'Something went wrong';
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || text || 'Something went wrong';
    } catch {
      // Keep the raw text as the message.
    }

    // A protected endpoint returned 401 → token is missing, expired, or invalid.
    // Log the stale session out and ask for a fresh sign-in.
    if (response.status === 401 && !isLoginCall(response.url)) {
      clearSession();
      sessionStorage.setItem('dealnest_session_message', message);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please sign in again.');
    }

    throw new Error(message);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

// ---------------------------------------------------------------------------
// 1. USER CONTROLLER
// ---------------------------------------------------------------------------
export const userService = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/user/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    // Store JWT and return just the user object (same shape as before)
    if (data.token) {
      localStorage.setItem('dealnest_token', data.token);
    }
    return data.user ?? data;
  },

  getUserById: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/user/read/${userId}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  update: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/user/update/${userId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/user/getAll`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  remove: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/user/delete/${userId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.ok;
  },
};

// ---------------------------------------------------------------------------
// 2. STORE CONTROLLER
// ---------------------------------------------------------------------------
export const storeService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/stores`);
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/stores/${id}`);
    return handleResponse(response);
  },

  findByUserId: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/stores/findByUserId/${userId}`);
    if (!response.ok) return null;
    return handleResponse(response);
  },

  create: async (storeData) => {
    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(storeData),
    });
    return handleResponse(response);
  },

  update: async (storeId, storeData) => {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(storeData),
    });
    return handleResponse(response);
  },

  getRecommended: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/stores/recommended/${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  getPersonalized: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/stores/personalized/${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return null;
    return handleResponse(response);
  },
};

// ---------------------------------------------------------------------------
// 3. FAVORITE STORE CONTROLLER
// ---------------------------------------------------------------------------
export const favoriteService = {
  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/favoriteStore/findByUserId/${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  getByStore: async (storeId) => {
    const response = await fetch(`${API_BASE_URL}/favoriteStore/findByStoreId/${storeId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  add: async (userId, storeId) => {
    const payload = {
      user: { userID: userId },
      store: { storeId: storeId },
    };
    const response = await fetch(`${API_BASE_URL}/favoriteStore/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  remove: async (favoriteStoreId) => {
    const response = await fetch(`${API_BASE_URL}/favoriteStore/delete/${favoriteStoreId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.ok;
  },
};

// ---------------------------------------------------------------------------
// 3b. SAVED PROMOTION CONTROLLER
// ---------------------------------------------------------------------------
export const savedPromotionService = {
  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/savedPromotion/findByUserId/${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  add: async (userId, promotionId) => {
    const payload = {
      user: { userID: userId },
      promotion: { promotionID: promotionId },
    };
    const response = await fetch(`${API_BASE_URL}/savedPromotion/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  remove: async (savedPromotionId) => {
    const response = await fetch(`${API_BASE_URL}/savedPromotion/delete/${savedPromotionId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.ok;
  },
};

// ---------------------------------------------------------------------------
// 4. PROMOTION CONTROLLER
// ---------------------------------------------------------------------------
export const promotionService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/promotion/getAll`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  getActive: async () => {
    const response = await fetch(`${API_BASE_URL}/promotion/findByIsActiveTrue`);
    return handleResponse(response);
  },

  // Product-level search — free keyword + optional budget (max discount price)
  // and category filter, e.g. search('air fryer', 1500, 'ELECTRONICS').
  search: async ({ keyword, maxPrice, category } = {}) => {
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (category) params.set('category', category);
    const response = await fetch(`${API_BASE_URL}/promotion/search?${params.toString()}`);
    return handleResponse(response);
  },

  getByStore: async (storeId) => {
    const response = await fetch(`${API_BASE_URL}/promotion/findByStoreId/${storeId}`);
    if (!response.ok) return [];
    return handleResponse(response);
  },

  create: async (promotionData) => {
    const response = await fetch(`${API_BASE_URL}/promotion/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(promotionData),
    });
    return handleResponse(response);
  },

  update: async (promotionId, promotionData) => {
    const response = await fetch(`${API_BASE_URL}/promotion/update/${promotionId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(promotionData),
    });
    return handleResponse(response);
  },

  remove: async (promotionId) => {
    const response = await fetch(`${API_BASE_URL}/promotion/delete/${promotionId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.ok;
  },

  bulkCreate: async (storeId, promotions) => {
    const response = await fetch(`${API_BASE_URL}/promotion/bulk`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ storeId, promotions }),
    });
    return handleResponse(response);
  },
};

// ---------------------------------------------------------------------------
// 5. NOTIFICATION CONTROLLER
// ---------------------------------------------------------------------------
export const notificationService = {
  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/notification/findByUserId/${userId}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  getUnreadByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/notification/findUnreadByUserId/${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  markRead: async (notification) => {
    const response = await fetch(
      `${API_BASE_URL}/notification/update/${notification.notificationID}`,
      {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...notification, read: true }),
      }
    );
    return handleResponse(response);
  },
};

// ---------------------------------------------------------------------------
// 6. ADMIN CONTROLLER
// ---------------------------------------------------------------------------
export const adminService = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, passwordHash: password }),
    });
    const data = await handleResponse(response);
    // Store admin JWT separately and return just the admin object
    if (data.token) {
      localStorage.setItem('dealnest_admin_token', data.token);
    }
    return data.admin ?? data;
  },
};

// ---------------------------------------------------------------------------
// 7. REVIEW CONTROLLER
// ---------------------------------------------------------------------------
export const reviewService = {
  getByStore: async (storeId) => {
    const response = await fetch(`${API_BASE_URL}/review/findByStoreId/${storeId}`);
    if (!response.ok) return [];
    return handleResponse(response);
  },

  create: async (reviewData) => {
    const response = await fetch(`${API_BASE_URL}/review/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
  },

  update: async (reviewId, reviewData) => {
    const response = await fetch(`${API_BASE_URL}/review/update/${reviewId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
  },

  remove: async (reviewId) => {
    const response = await fetch(`${API_BASE_URL}/review/delete/${reviewId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.ok;
  },
};

// ---------------------------------------------------------------------------
// 8. REDEMPTION CONTROLLER
// ---------------------------------------------------------------------------
export const redemptionService = {
  claim: async (userId, promotionId) => {
    const payload = { user: { userID: userId }, promotion: { promotionID: promotionId } };
    const response = await fetch(`${API_BASE_URL}/redemption/claim`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  redeemCode: async (storeId, code) => {
    const response = await fetch(`${API_BASE_URL}/redemption/redeem`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code, storeId }),
    });
    return handleResponse(response);
  },

  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/redemption/findByUserId/${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  // Asks the server to email one of the caller's own vouchers. No recipient is sent
  // from here: the server always uses the address on the user's own record.
  sendCodeToEmail: async (redemptionId) => {
    const response = await fetch(`${API_BASE_URL}/redemption/${redemptionId}/email`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

// ---------------------------------------------------------------------------
// 9. DEAL REPORT CONTROLLER
// ---------------------------------------------------------------------------
export const dealReportService = {
  create: async (userId, promotionId, reason, details) => {
    const payload = {
      reason,
      details,
      user: { userID: userId },
      promotion: { promotionID: promotionId },
    };
    const response = await fetch(`${API_BASE_URL}/dealReport/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/dealReport/getAll`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  findByStatus: async (status) => {
    const response = await fetch(`${API_BASE_URL}/dealReport/findByStatus/${status}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  resolve: async (reportId, status) => {
    const response = await fetch(`${API_BASE_URL}/dealReport/resolve/${reportId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },
};

// ---------------------------------------------------------------------------
// 10. PRICE HISTORY CONTROLLER
// ---------------------------------------------------------------------------
export const priceHistoryService = {
  getByPromotion: async (promotionId) => {
    const response = await fetch(`${API_BASE_URL}/priceHistory/findByPromotionId/${promotionId}`, {
      headers: authHeaders(),
    });
    // 402 = DealNest Plus perk → let the caller show a gated hint.
    if (response.status === 402) throw new Error('UPGRADE_REQUIRED');
    if (!response.ok) return [];
    return handleResponse(response);
  },
};

// ---------------------------------------------------------------------------
// 10b. SEARCH HISTORY CONTROLLER
// ---------------------------------------------------------------------------
export const searchHistoryService = {
  create: async (userId, searchQuery) => {
    const payload = { searchQuery, user: { userID: userId } };
    const response = await fetch(`${API_BASE_URL}/searchHistory/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/searchHistory/findByUserId/${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  remove: async (searchHistoryId) => {
    const response = await fetch(`${API_BASE_URL}/searchHistory/delete/${searchHistoryId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.ok;
  },
};

// ---------------------------------------------------------------------------
// 11. ANALYTICS CONTROLLER (Pro stores)
// ---------------------------------------------------------------------------
export const analyticsService = {
  track: async (storeId, eventType, userId = null, promotionId = null) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/track`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ eventType, userId, storeId, promotionId }),
      });
      return handleResponse(response);
    } catch {
      // Tracking must never break the user flow.
      return null;
    }
  },

  getStoreAnalytics: async (storeId) => {
    const response = await fetch(`${API_BASE_URL}/analytics/store/${storeId}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  getCustomerInsights: async (storeId) => {
    const response = await fetch(`${API_BASE_URL}/analytics/store/${storeId}/insights`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

// ---------------------------------------------------------------------------
// 12. DEAL ALERT CONTROLLER (DealNest Plus)
// ---------------------------------------------------------------------------
export const dealAlertService = {
  create: async (dealAlert) => {
    const response = await fetch(`${API_BASE_URL}/dealAlert/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(dealAlert),
    });
    if (response.status === 402) {
      throw new Error('UPGRADE_REQUIRED');
    }
    return handleResponse(response);
  },

  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/dealAlert/findByUserId/${userId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  update: async (dealAlert) => {
    const response = await fetch(`${API_BASE_URL}/dealAlert/update/${dealAlert.alertID}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(dealAlert),
    });
    return handleResponse(response);
  },

  remove: async (alertId) => {
    const response = await fetch(`${API_BASE_URL}/dealAlert/delete/${alertId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return response.ok;
  },
};

// ---------------------------------------------------------------------------
// 13. SUBSCRIPTION CONTROLLER (PayFast)
// ---------------------------------------------------------------------------
export const subscriptionService = {
  // Returns { action, fields } for the signed PayFast hosted-page form.
  // paymentMethod: 'CARD' (default) auto-renews monthly; 'EFT' is a one-off
  // Instant EFT payment where PayFast asks for the bank account details.
  checkout: async (accountType, paymentMethod = 'CARD') => {
    const response = await fetch(`${API_BASE_URL}/subscription/checkout`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ accountType, paymentMethod }),
    });
    return handleResponse(response);
  },

  // Current plan state — polled after a PayFast return to detect activation.
  status: async (accountType) => {
    const response = await fetch(`${API_BASE_URL}/subscription/status?accountType=${accountType}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  // Cancels the recurring agreement at the end of the current month.
  cancel: async (accountType) => {
    const response = await fetch(`${API_BASE_URL}/subscription/cancel`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ accountType }),
    });
    return handleResponse(response);
  },
};

/**
 * Submits a hidden HTML form to PayFast's hosted page so the customer can
 * authorise the recurring billing agreement and pay. Navigation is a native
 * browser POST, so debugging tools show the exact fields PayFast receives.
 */
export const submitPayFastForm = ({ action, fields }) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.acceptCharset = 'UTF-8';
  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
};