import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error
      const message =
        error.response.data?.error ||
        error.response.data?.message ||
        "An error occurred";
      console.error("API Error:", message);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error: Backend server may be down");
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (name, email, password, role = "user") => {
    const response = await apiClient.post("/auth/register", {
      name,
      email,
      password,
      role,
    });
    return response.data;
  },

  verify: async (email) => {
    const response = await apiClient.post("/auth/verify", { email });
    return response.data;
  },
};

// User APIs
export const userAPI = {
  // List all users with pagination and filters (Admin only)
  getAllUsers: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await apiClient.get(`/users?${params}`);
    return response.data;
  },

  // Get user by ID (Self or Admin)
  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Update user - full update (Self or Admin)
  updateUser: async (id, data) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  // Update user - partial update (Self or Admin)
  patchUser: async (id, data) => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  // Delete user (Admin only)
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // Get user totals (Admin only)
  getUserTotals: async () => {
    const response = await apiClient.get("/users/totals");
    return response.data;
  },

  // Get user statistics (Admin only)
  getUserStatistics: async () => {
    const response = await apiClient.get("/users/analytics/statistics");
    return response.data;
  },

  // Get registration statistics by date range (Admin only)
  getRegistrationStats: async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const response = await apiClient.get(
      `/users/analytics/registration-stats?${params}`
    );
    return response.data;
  },

  // Get top users by login count (Admin only)
  getTopLoginUsers: async (limit = 5) => {
    const response = await apiClient.get(
      `/users/analytics/top-logins?limit=${limit}`
    );
    return response.data;
  },

  // Get inactive users (Admin only)
  getInactiveUsers: async (hours, months) => {
    const params = new URLSearchParams();
    if (hours) params.append("hours", hours.toString());
    if (months) params.append("months", months.toString());
    const response = await apiClient.get(`/users/analytics/inactive?${params}`);
    return response.data;
  },

  // Get recent users (Admin only)
  getRecentUsers: async (days = 30) => {
    const response = await apiClient.get(
      `/users/analytics/recent?days=${days}`
    );
    return response.data;
  },

  // Get users by role (Admin only)
  getUsersByRole: async (role) => {
    const response = await apiClient.get(`/users/role/${role}`);
    return response.data;
  },

  // Search users (Admin only)
  searchUsers: async (query, options = {}) => {
    const params = new URLSearchParams({ q: query, ...options });
    const response = await apiClient.get(`/users/search?${params}`);
    return response.data;
  },

  // Check if email exists (Public endpoint)
  checkEmail: async (email) => {
    const params = new URLSearchParams({ email });
    const response = await apiClient.get(`/users/check-email?${params}`);
    return response.data;
  },
};

export default apiClient;
