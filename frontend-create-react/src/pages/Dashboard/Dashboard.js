import React, { useState, useEffect, useCallback, memo } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../../contexts/AuthContext";
import { analyticsAPI } from "../../api";
import Loader from "../../components/Loader/Loader";
import "./Dashboard.css";

// Constants to avoid magic numbers
const RECENT_USERS_DAYS = 7;
const TOP_USERS_LIMIT = 5;

/**
 * Memoized Stat Card Component
 */
const StatCard = memo(({ icon, value, label }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  </div>
));

StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
};

StatCard.displayName = "StatCard";

/**
 * Memoized User Item Component
 */
const UserItem = memo(({ user, formatDate }) => (
  <div className="user-item" key={user.id}>
    <div className="user-info">
      <h4>{user.name}</h4>
      <p>{user.email}</p>
      <span className={`user-role ${user.role}`}>{user.role}</span>
    </div>
    <div className="user-meta">
      <span className="user-date">{formatDate(user.created_at)}</span>
      <span
        className={`user-status ${
          user.is_verified ? "verified" : "unverified"
        }`}
      >
        {user.is_verified ? "Verified" : "Unverified"}
      </span>
    </div>
  </div>
));

UserItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    is_verified: PropTypes.bool,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  formatDate: PropTypes.func.isRequired,
};

UserItem.displayName = "UserItem";

/**
 * Memoized Top User Item Component
 */
const TopUserItem = memo(({ user, index }) => (
  <div className="top-user-item" key={user.id}>
    <div className="user-rank">#{index + 1}</div>
    <div className="user-info">
      <h4>{user.name}</h4>
      <p>{user.email}</p>
    </div>
    <div className="user-stats">
      <span className="login-count">{user.login_count} logins</span>
    </div>
  </div>
));

TopUserItem.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    login_count: PropTypes.number.isRequired,
  }).isRequired,
  index: PropTypes.number.isRequired,
};

TopUserItem.displayName = "TopUserItem";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    statistics: null,
    recentUsers: [],
    topUsers: [],
    userTotals: null,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [
        statisticsResponse,
        recentUsersResponse,
        topUsersResponse,
        userTotalsResponse,
      ] = await Promise.allSettled([
        analyticsAPI.getStatistics(),
        analyticsAPI.getRecentUsers(RECENT_USERS_DAYS),
        analyticsAPI.getTopLogins(TOP_USERS_LIMIT),
        analyticsAPI.getUserTotals(),
      ]);

      const newData = {};

      // Process statistics
      if (statisticsResponse.status === "fulfilled") {
        newData.statistics = statisticsResponse.value.data;
      }

      // Process recent users
      if (recentUsersResponse.status === "fulfilled") {
        newData.recentUsers = recentUsersResponse.value.data.users || [];
      }

      // Process top users
      if (topUsersResponse.status === "fulfilled") {
        newData.topUsers = topUsersResponse.value.data.users || [];
      }

      // Process user totals
      if (userTotalsResponse.status === "fulfilled") {
        newData.userTotals = userTotalsResponse.value.data;
      }

      setData(newData);
    } catch (err) {
      // If unauthorized/forbidden, show tailored message
      const status = err?.response?.status;
      if (status === 401) {
        setError("Your session expired. Please sign in again.");
      } else if (status === 403) {
        setError(
          "You do not have permission to view analytics. Login as admin."
        );
      } else {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoize formatting functions
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat("en-US").format(num);
  }, []);

  const formatMaybeNumber = useCallback(
    (value, { percent = false } = {}) => {
      if (value === null || value === undefined)
        return percent ? "No data" : "N/A";
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return percent ? "No data" : "N/A";
      return percent ? `${numeric.toFixed(1)}%` : formatNumber(numeric);
    },
    [formatNumber]
  );

  if (loading) {
    return <Loader text="Loading dashboard..." size="large" />;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name || "User"}!</p>
      </div>

      <div className="dashboard-grid">
        {/* Statistics Cards */}
        {user?.role === "admin" && data.statistics && (
          <div className="stats-section">
            <h2>System Statistics</h2>
            <div className="stats-grid">
              <StatCard
                icon="👥"
                value={formatMaybeNumber(data.statistics.totalUsers)}
                label="Total Users"
              />
              <StatCard
                icon="✅"
                value={formatMaybeNumber(data.statistics.verifiedUsers)}
                label="Verified Users"
              />
              <StatCard
                icon="❌"
                value={formatMaybeNumber(data.statistics.unverifiedUsers)}
                label="Unverified Users"
              />
              <StatCard
                icon="📊"
                value={formatMaybeNumber(data.statistics.verificationRate, {
                  percent: true,
                })}
                label="Verification Rate"
              />
            </div>
          </div>
        )}

        {/* User Totals */}
        {user?.role === "admin" && data.userTotals && (
          <div className="totals-section">
            <h2>User Overview</h2>
            <div className="totals-grid">
              <div className="total-item">
                <span className="total-label">Total Users:</span>
                <span className="total-value">
                  {formatMaybeNumber(data.userTotals.totalUsers)}
                </span>
              </div>
              <div className="total-item">
                <span className="total-label">Verified:</span>
                <span className="total-value verified">
                  {formatMaybeNumber(data.userTotals.verifiedUsers)}
                </span>
              </div>
              <div className="total-item">
                <span className="total-label">Unverified:</span>
                <span className="total-value unverified">
                  {formatMaybeNumber(data.userTotals.unverifiedUsers)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Users */}
        {user?.role === "admin" && data.recentUsers.length > 0 && (
          <div className="recent-users-section">
            <h2>Recent Users</h2>
            <div className="users-list">
              {data.recentUsers.map((recentUser) => (
                <UserItem
                  key={recentUser.id}
                  user={recentUser}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top Users by Login */}
        {user?.role === "admin" && data.topUsers.length > 0 && (
          <div className="top-users-section">
            <h2>Most Active Users</h2>
            <div className="top-users-list">
              {data.topUsers.map((topUser, index) => (
                <TopUserItem key={topUser.id} user={topUser} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
