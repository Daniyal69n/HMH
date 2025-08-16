// API helper function
export const apiCall = async (endpoint, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    ...defaultOptions,
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// User authentication
export const registerUser = async (userData) => {
  return apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (credentials) => {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const getUserProfile = async (phone) => {
  return apiCall(`/api/user/profile?phone=${phone}`);
};

export const updateUserProfile = async (phone, updates) => {
  return apiCall('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ phone, updates }),
  });
};

// User balance operations
export const updateUserBalance = async (userId, operation, data) => {
  return apiCall('/api/user/balance', {
    method: 'PUT',
    body: JSON.stringify({ userId, operation, ...data }),
  });
};

// Admin operations
export const getUsers = async (page = 1, limit = 10, search = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });
  return apiCall(`/api/admin/users?${params}`);
};

export const updateUser = async (userId, action, data = {}) => {
  return apiCall('/api/admin/users', {
    method: 'PUT',
    body: JSON.stringify({ userId, action, data }),
  });
};

// Helper function to get current user from sessionStorage
export const getCurrentUser = async (forceRefresh = false) => {
  if (typeof window === 'undefined') return null;
  
  // If force refresh is requested, skip sessionStorage and get from database
  if (!forceRefresh) {
    // First try to get from sessionStorage
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
  }
  
  // If not in sessionStorage or force refresh, try to get from database using stored phone
  const phone = sessionStorage.getItem('userPhone');
  if (phone) {
    try {
      const timestamp = Date.now(); // Add timestamp to prevent caching
      const response = await fetch(`/api/user/profile?phone=${phone}&_t=${timestamp}`);
      if (response.ok) {
        const user = await response.json();
        // Update sessionStorage
        sessionStorage.setItem('userData', JSON.stringify(user));
        return user;
      }
    } catch (error) {
      console.error('Error fetching user from database:', error);
    }
  }
  
  return null;
};

// Helper function to check if user is logged in
export const isLoggedIn = () => {
  if (typeof window === 'undefined') return false;
  
  return sessionStorage.getItem('isLoggedIn') === 'true';
};

// Helper function to logout user
export const logoutUser = () => {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem('userData');
  sessionStorage.removeItem('userPhone');
  sessionStorage.removeItem('isLoggedIn');
};

// Helper function to update user data in sessionStorage
export const updateLocalUserData = (userData) => {
  if (typeof window === 'undefined') return;
  
  sessionStorage.setItem('userData', JSON.stringify(userData));
  if (userData.phone) {
    sessionStorage.setItem('userPhone', userData.phone);
  }
}; 