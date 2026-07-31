const API_BASE_URL = 'http://localhost:8080/api';

// Helper to handle responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.message || parsed.error || text);
    } catch (parseErr) {
      if (parseErr instanceof SyntaxError) {
        throw new Error(text || 'Something went wrong');
      }
      throw parseErr;
    }
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  return response.text();
};

// 1. USER CONTROLLER
export const userService = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/user/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },
  login: async (email) => {
    const response = await fetch(`${API_BASE_URL}/user/findByEmail/${email}`);
    return handleResponse(response);
  },
  getUserById: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/user/read/${userId}`);
    return handleResponse(response);
  },
  update: async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/user/update/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  }
};

// 2. STORE CONTROLLER
export const storeService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/stores`);
    return handleResponse(response);
  },
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/stores/${id}`);
    return handleResponse(response);
  },
  create: async (storeData) => {
    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData),
    });
    return handleResponse(response);
  }
};

// 3. FAVORITE STORE CONTROLLER
export const favoriteService = {
  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/favoriteStore/findByUserId/${userId}`);
    if (!response.ok) return [];
    return handleResponse(response);
  },
  add: async (userId, storeId) => {
    const payload = { 
        user: { userID: userId }, 
        store: { storeId: storeId } 
    };
    const response = await fetch(`${API_BASE_URL}/favoriteStore/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
  remove: async (favoriteStoreId) => {
    const response = await fetch(`${API_BASE_URL}/favoriteStore/delete/${favoriteStoreId}`, {
      method: 'DELETE',
    });
    return response.ok;
  }
};

// 3b. SAVED PROMOTION CONTROLLER
export const savedPromotionService = {
  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/savedPromotion/findByUserId/${userId}`);
    if (!response.ok) return [];
    return handleResponse(response);
  },
  add: async (userId, promotionId) => {
    const payload = {
        user: { userID: userId },
        promotion: { promotionID: promotionId }
    };
    const response = await fetch(`${API_BASE_URL}/savedPromotion/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
  remove: async (savedPromotionId) => {
    const response = await fetch(`${API_BASE_URL}/savedPromotion/delete/${savedPromotionId}`, {
      method: 'DELETE',
    });
    return response.ok;
  }
};

// 4. PROMOTION CONTROLLER
export const promotionService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/promotion/getAll`);
    return handleResponse(response);
  },
  getActive: async () => {
    const response = await fetch(`${API_BASE_URL}/promotion/findByIsActiveTrue`);
    return handleResponse(response);
  },
  create: async (promotionData) => {
    const response = await fetch(`${API_BASE_URL}/promotion/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promotionData),
    });
    return handleResponse(response);
  }
};

// 5. NOTIFICATION CONTROLLER
export const notificationService = {
  getByUser: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/notification/findByUserId/${userId}`);
    return handleResponse(response);
  }
};