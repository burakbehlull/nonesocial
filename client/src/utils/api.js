// API base URL - uses VITE_SERVER_URL in production, falls back to relative path in dev
const API_BASE_URL = (import.meta.env.VITE_SERVER_URL || '').replace(/\/$/, ''); // Remove trailing slash

/**
 * Make an API request with proper URL handling
 * @param {string} endpoint - API endpoint (e.g., '/api/admin/login')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include' // Important for CORS with cookies
  };

  // Add auth token if available (for admin endpoints)
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken && endpoint.startsWith('/api/admin')) {
    defaultOptions.headers['Authorization'] = `Bearer ${adminToken}`;
  }

  return fetch(url, { ...defaultOptions, ...options });
};

/**
 * Make an authenticated admin API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export const adminApi = async (endpoint, options = {}) => {
  const response = await apiRequest(endpoint, options);
  const data = await response.json();

  // Handle token expiration
  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
    throw new Error('Session expired');
  }

  return data;
};

export default apiRequest;
