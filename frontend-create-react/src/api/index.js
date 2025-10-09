import authApi from "./authApi";
import userApi from "./userApi";

// Named exports for backward compatibility
export const authAPI = authApi;
export const usersAPI = userApi;
export const analyticsAPI = {
  getUserTotals: userApi.getUserTotals,
  getStatistics: userApi.getStatistics,
  getTopLogins: userApi.getTopLogins,
  getInactiveUsers: userApi.getInactiveUsers,
  getRecentUsers: userApi.getRecentUsers,
};

// Default export
const api = {
  auth: authApi,
  user: userApi,
};

export default api;
