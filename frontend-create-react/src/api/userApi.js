import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080/api",
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

const userApi = {
  // User CRUD operations
  getAllUsers: (params = {}) => axiosInstance.get("/users", { params }),

  getUserById: (id) => axiosInstance.get(`/users/${id}`),

  createUser: (userData) => axiosInstance.post("/users", userData),

  updateUser: (id, data) => axiosInstance.put(`/users/${id}`, data),

  patchUser: (id, data) => axiosInstance.patch(`/users/${id}`, data),

  deleteUser: (id) => axiosInstance.delete(`/users/${id}`),

  searchUsers: (params = {}) => axiosInstance.get("/users/search", { params }),

  getUsersByRole: (role) => axiosInstance.get(`/users/role/${role}`),

  checkEmail: (email) =>
    axiosInstance.get("/users/check-email", { params: { email } }),

  // Analytics endpoints
  getUserTotals: () => axiosInstance.get("/users/totals"),

  getStatistics: () => axiosInstance.get("/users/analytics/statistics"),

  getTopLogins: (limit = 5) =>
    axiosInstance.get("/users/analytics/top-logins", { params: { limit } }),

  getInactiveUsers: (params = {}) =>
    axiosInstance.get("/users/analytics/inactive", { params }),

  getRecentUsers: (days = 30) =>
    axiosInstance.get("/users/analytics/recent", { params: { days } }),
};

export default userApi;
