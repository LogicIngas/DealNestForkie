const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// VITE_API_URL is read at BUILD time, so a deployed build silently inherits whatever
// was in .env when it was built. .env is committed for local dev and points at
// localhost, so a static host that was created without VITE_API_URL set in its own
// environment ships a bundle that calls the visitor's own machine — which looks like
// "works on my laptop, empty on the deployed site". Shout about it rather than let it
// present as missing data.
if (typeof window !== 'undefined' && /^https?:\/\/(localhost|127\.0\.0\.1)/.test(API_BASE_URL)) {
  console.warn(
    `[DealNest] API_BASE_URL is "${API_BASE_URL}" — this build is calling a local machine, not a server. ` +
    'If you are on a deployed site, set VITE_API_URL in that host\'s environment variables and rebuild.'
  );
}

// ---------------------------------------------------------------------------
// Token helpers
//
// This app has two independent sessions: the customer / store-owner session and
// the admin console session, each with its own JWT and its own storage keys. Every
// request therefore has to state which session it acts for, because picking the
// wrong one is not cosmetic. The admin list endpoints are gated on
// hasRole("ADMIN") and the moderation endpoints on SecurityUtil.isAdmin(), so a
// customer token sent to the admin console is answered 403 and the dashboard
// comes up empty. See ADMIN_SCOPE.
// ---------------------------------------------------------------------------
export const USER_SCOPE = 'user';
export const ADMIN_SCOPE = 'admin';

const getToken = () => localStorage.getItem('dealnest_token');
const getAdminToken = () => localStorage.getItem('dealnest_admin_token');

const tokenForScope = (scope) => (scope === ADMIN_SCOPE ? getAdminToken() : getToken());

// Drops one session's saved details (used when the backend rejects its token).
// The other session is deliberately left alone: signing out of the admin console
// must not sign a customer out of the site, and a customer session going stale
// must not evict the admin from the console.
const clearSession = (scope) => {
  if (scope === ADMIN_SCOPE) {
    localStorage.removeItem('dealnest_admin');
    localStorage.removeItem('dealnest_admin_token');
    return;
  }
  localStorage.removeItem('dealnest_user');
  localStorage.removeItem('dealnest_role');
  localStorage.removeItem('dealnest_token');
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
 * Returns headers for an authenticated request made on behalf of `scope`.
 *
 * Defaults to the customer session so the existing call sites keep working
 * unchanged; the admin console passes ADMIN_SCOPE explicitly.
 */
const authHeaders = (scope = USER_SCOPE, extra = {}) => {
  const token = tokenForScope(scope);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

// ---------------------------------------------------------------------------
// Response handler
// ---------------------------------------------------------------------------
const handleResponse = async (response, scope = USER_SCOPE) => {
  if (!response.ok) {
    const text = await response.text();
    let message = text || 'Something went wrong';
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || text || 'Something went wrong';
    } catch {
      // Keep the raw text as the message.
    }

    // A protected endpoint returned 401 → that session's token is missing, expired,
    // or invalid. Log out *that* session only and send the caller back to the sign-in
    // page it actually belongs to; the admin console must not be dumped on the
    // customer login page, and a customer token going stale must not evict the admin.
    if (response.status === 401 && !isLoginCall(response.url)) {
      clearSession(scope);
      const isAdminCall = scope === ADMIN_SCOPE;
      const signInPath = isAdminCall ? '/admin/login' : '/login';
      const alreadyOnSignIn = isAdminCall
        ? window.location.pathname.startsWith('/admin/login')
        : window.location.pathname.startsWith('/login');
      if (isAdminCall) {
        sessionStorage.setItem('dealnest_admin_message', message);
      } else {
        sessionStorage.setItem('dealnest_session_message', message);
      }
      if (!alreadyOnSignIn) {
        window.location.href = signInPath;
      }
      throw new Error('Session expired. Please sign in again.');
    }

    // The status is attached so callers that care *why* a request failed can react
    // differently — a 400 means the input was wrong and the form should show which
    // field, which is a different thing to show than a 500. Existing callers that
    // only read .message are unaffected.
    const failure = new Error(message);
    failure.status = response.status;
    throw failure;
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

  // Resolves to the user object, with `role` and `storeId` attached.
  //
  // The server works out which app this account opens (see UserController#login) so the
  // sign-in screen doesn't have to ask a second question over a second round trip before
  // it can paint. `role` is attached onto the returned user rather than returned beside
  // it, so every existing caller keeps receiving the same object shape.
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
    const user = data.user ?? data;
    if (user && data.role) {
      user.role = data.role;
      user.storeId = data.storeId ?? null;
    }
    return user;
  },

  getUserById: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/user/read/${userId}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  // Shared by the customer profile screen and the admin console's "suspend user"
  // action, so the caller declares which session is acting.
  update: async (userId, userData, scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/user/update/${userId}`, {
      method: 'PUT',
      headers: authHeaders(scope),
      body: JSON.stringify(userData),
    });
    return handleResponse(response, scope);
  },

  getAll: async (scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/user/getAll`, {
      headers: authHeaders(scope),
    });
    return handleResponse(response, scope);
  },

  remove: async (userId, scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/user/delete/${userId}`, {
      method: 'DELETE',
      headers: authHeaders(scope),
    });
    // Routed through handleResponse so a denied delete throws with the server's
    // message instead of resolving to a bare `false` the caller has to guess about.
    await handleResponse(response, scope);
    return true;
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/user/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  resetPassword: async (token, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return handleResponse(response);
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

  // The capped, highest-rated-first store feed the home page draws. `limit` is the
  // number of cards on screen, so this is one indexed walk that stops, rather than the
  // whole store directory arriving for the browser to filter and slice.
  getActive: async (limit) => {
    const query = Number.isFinite(limit) ? `?limit=${limit}` : '';
    const response = await fetch(`${API_BASE_URL}/stores/active${query}`);
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

  // Store owners edit their own store from the store dashboard; the admin console
  // edits any store's verified/active flags. Both go through the same endpoint, so
  // the caller declares the session — the backend's ownership check only short-circuits
  // for a real ROLE_ADMIN principal.
  update: async (storeId, storeData, scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
      method: 'PUT',
      headers: authHeaders(scope),
      body: JSON.stringify(storeData),
    });
    return handleResponse(response, scope);
  },

  // The home page's "Recommended" strip.
  //
  // The server still ranks EVERY active store and only stops walking afterwards, so the
  // top of the list is unchanged from the uncapped version — `limit` decides how much of
  // that ranking comes back, not which stores are scored. Capping here rather than in the
  // browser is what the limit is for: the response used to carry the whole ranked
  // directory, and the page mapped over all of it to draw a strip six cards wide.
  getRecommended: async (userId, limit) => {
    const query = Number.isFinite(limit) ? `?limit=${limit}` : '';
    const response = await fetch(`${API_BASE_URL}/stores/recommended/${userId}${query}`, {
      headers: authHeaders(),
    });
    if (!response.ok) return [];
    return handleResponse(response);
  },

  getPersonalized: async (userId, limit) => {
    const query = Number.isFinite(limit) ? `?limit=${limit}` : '';
    const response = await fetch(`${API_BASE_URL}/stores/personalized/${userId}${query}`, {
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
  getAll: async (scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/promotion/getAll`, {
      headers: authHeaders(scope),
    });
    return handleResponse(response, scope);
  },

  // The active deal feed, capped at `limit` rows. Omit it for the server default (the
  // six the home page draws); pass 0 only when every active deal is genuinely needed,
  // which is Explore working out which stores have a live deal. Sending no cap when a
  // fixed number of cards is all that gets drawn is what used to make the home page
  // cost the size of the whole catalogue.
  getActive: async (limit) => {
    const query = Number.isFinite(limit) ? `?limit=${limit}` : '';
    const response = await fetch(`${API_BASE_URL}/promotion/findByIsActiveTrue${query}`);
    return handleResponse(response);
  },

  // Product-level search — free keyword + optional budget (max discount price)
  // and category filter, e.g. search({ keyword: 'air fryer', maxPrice: 1500 }).
  //
  // Paged: resolves to { content, page, size, totalElements, last }. The deals page
  // renders one page at a time and asks for the next on demand, rather than pulling
  // every match before drawing the first card.
  search: async ({ keyword, maxPrice, category, page = 0, size = 24 } = {}) => {
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (category) params.set('category', category);
    params.set('page', page);
    params.set('size', size);
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

  remove: async (promotionId, scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/promotion/delete/${promotionId}`, {
      method: 'DELETE',
      headers: authHeaders(scope),
    });
    // handleResponse, not a bare `response.ok`: a 403 here previously resolved to
    // false and the admin saw the row simply refuse to disappear, with no reason given.
    await handleResponse(response, scope);
    return true;
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
    // Drop any previous admin session first: if this login fails we must not be left
    // holding the old token, which the route guard would happily treat as a live one.
    clearSession(ADMIN_SCOPE);
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The backend binds the credential to Admin.passwordHash, so the raw password
      // travels under that field name.
      body: JSON.stringify({ email, passwordHash: password }),
    });
    const data = await handleResponse(response, ADMIN_SCOPE);
    // Store admin JWT separately and return just the admin object
    if (data.token) {
      localStorage.setItem('dealnest_admin_token', data.token);
    }
    return data.admin ?? data;
  },

  // The overview's numbers, counted by the database.
  //
  // One small response in place of four whole tables. The overview used to call
  // getAll() on stores, users, promotions and reports and count the rows in the
  // browser, so its cost grew with the size of the database rather than with the
  // nine numbers on screen — and promotions in particular came with a store and an
  // owner join attached. See IAdminService.getStats() on the backend.
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: authHeaders(ADMIN_SCOPE),
    });
    return handleResponse(response, ADMIN_SCOPE);
  },

  // The newest deals for the overview's activity table, capped. This panel draws a
  // fixed number of rows and used to be handed the entire promotions table to pick
  // them out of in the browser.
  getRecentPromotions: async (limit = 8) => {
    const response = await fetch(`${API_BASE_URL}/admin/recent-promotions?limit=${limit}`, {
      headers: authHeaders(ADMIN_SCOPE),
    });
    return handleResponse(response, ADMIN_SCOPE);
  },

  // Paged tab lists. Each resolves to { content, page, size, totalElements, last } and
  // the console appends one page at a time.
  //
  // These deliberately do not reuse storeService/userService/promotionService/
  // dealReportService. Those endpoints are shared with the shopfront — Home and Explore
  // render every store — so paging them would change what customers receive. The admin
  // routes carry their own pages instead, and live under /api/admin so the existing
  // ADMIN_SCOPE role applies to them for free.
  getStoresPage: async (page = 0, size = 24) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/stores?page=${page}&size=${size}`,
      { headers: authHeaders(ADMIN_SCOPE) },
    );
    return handleResponse(response, ADMIN_SCOPE);
  },

  getUsersPage: async (page = 0, size = 24) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/users?page=${page}&size=${size}`,
      { headers: authHeaders(ADMIN_SCOPE) },
    );
    return handleResponse(response, ADMIN_SCOPE);
  },

  getPromotionsPage: async (page = 0, size = 24) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/promotions?page=${page}&size=${size}`,
      { headers: authHeaders(ADMIN_SCOPE) },
    );
    return handleResponse(response, ADMIN_SCOPE);
  },

  getReportsPage: async (page = 0, size = 24) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/reports?page=${page}&size=${size}`,
      { headers: authHeaders(ADMIN_SCOPE) },
    );
    return handleResponse(response, ADMIN_SCOPE);
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
    // Routed through handleResponse rather than returning response.ok. Returning the
    // boolean reported a 403 or 500 as a plain "false", which the caller read as a
    // successful delete: the review list was reloaded, the row came back unchanged, and
    // the shopper was told nothing had gone wrong.
    await handleResponse(response);
    return true;
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

  getAll: async (scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/dealReport/getAll`, {
      headers: authHeaders(scope),
    });
    return handleResponse(response, scope);
  },

  findByStatus: async (status, scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/dealReport/findByStatus/${status}`, {
      headers: authHeaders(scope),
    });
    return handleResponse(response, scope);
  },

  resolve: async (reportId, status, scope = USER_SCOPE) => {
    const response = await fetch(`${API_BASE_URL}/dealReport/resolve/${reportId}`, {
      method: 'PUT',
      headers: authHeaders(scope),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response, scope);
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
  // All of a store's deals at once, keyed by promotionID. A store page with a dozen
  // deals used to need a dozen of these; now it needs one.
  getByStore: async (storeId) => {
    const response = await fetch(`${API_BASE_URL}/priceHistory/findByStore/${storeId}`, {
      headers: authHeaders(),
    });
    if (response.status === 402) throw new Error('UPGRADE_REQUIRED');
    if (!response.ok) return {};
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
// 13. PLAN SUBSCRIPTION
// ---------------------------------------------------------------------------
export const subscriptionService = {
  // What the account owes, resolved server-side. The checkout shows this before a
  // card is entered, and it is never taken from anything the user can edit.
  price: async (accountType) => {
    const response = await fetch(`${API_BASE_URL}/subscription/price?accountType=${accountType}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  // Current plan state.
  status: async (accountType) => {
    const response = await fetch(`${API_BASE_URL}/subscription/status?accountType=${accountType}`, {
      headers: authHeaders(),
    });
    return handleResponse(response);
  },

  // Cancels at the end of the period already paid for.
  cancel: async (accountType) => {
    const response = await fetch(`${API_BASE_URL}/subscription/cancel`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ accountType }),
    });
    return handleResponse(response);
  },
};

// ---------------------------------------------------------------------------
// 14. CARD PAYMENT (DealNest's own checkout)
//
// This validates the card that was typed in and then stands in for the step a
// card network performs. It takes no money and cannot — nothing here contacts a
// network. The server is the authority on every check; the browser-side Luhn in
// CardCheckoutForm is only there to give an answer without a round trip.
// ---------------------------------------------------------------------------
export const paymentService = {
  // Runs every structural check and returns them all, passed or not.
  check: async ({ cardNumber, expiry, cvv, holderName }) => {
    const response = await fetch(`${API_BASE_URL}/payment/check`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ cardNumber, expiry, cvv, holderName }),
    });
    return handleResponse(response);
  },

  // Checks, authorises, and on approval activates the plan.
  // Returns { checks, authorisation, subscription? }.
  pay: async ({ cardNumber, expiry, cvv, holderName, accountType, paymentMethod = 'CARD' }) => {
    const response = await fetch(`${API_BASE_URL}/payment/pay`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ cardNumber, expiry, cvv, holderName, accountType, paymentMethod }),
    });
    return handleResponse(response);
  },
};