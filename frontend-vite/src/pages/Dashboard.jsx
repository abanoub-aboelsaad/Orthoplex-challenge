import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../services/api";
import Loader from "../components/Loader";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch different data based on user role
      if (user?.role === "admin") {
        const [statsData, topUsersData, recentUsersData, usersData] =
          await Promise.all([
            userAPI.getUserStatistics(),
            userAPI.getTopLoginUsers(5),
            userAPI.getRecentUsers(30),
            userAPI.getAllUsers(1, 10),
          ]);

        setStatistics(statsData);
        setTopUsers(topUsersData.users || []);
        setRecentUsers(recentUsersData.users || []);
        setUsers(usersData.rows || []);
      } else {
        // Regular users can only see their own data
        const userData = await userAPI.getUserById(user.id);
        setUsers([userData.user]);
      }
    } catch (err) {
      console.error("Dashboard Error:", err);
      console.error("Error Response:", err.response);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch dashboard data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p className="dashboard-subtitle">
          {user?.role === "admin" ? "Admin Dashboard" : "User Dashboard"}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {user?.role === "admin" && (
        <>
          <div className="dashboard-tabs">
            <button
              className={`tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              All Users
            </button>
            <button
              className={`tab ${activeTab === "recent" ? "active" : ""}`}
              onClick={() => setActiveTab("recent")}
            >
              Recent Users
            </button>
          </div>

          {activeTab === "overview" && statistics && (
            <div className="dashboard-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{statistics.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{statistics.verifiedUsers}</h3>
                    <p>Verified Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-info">
                    <h3>{statistics.unverifiedUsers}</h3>
                    <p>Unverified Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>{statistics.verificationRate?.toFixed(1)}%</h3>
                    <p>Verification Rate</p>
                  </div>
                </div>
              </div>

              {topUsers.length > 0 && (
                <div className="section">
                  <h2>Top Users by Login</h2>
                  <div className="table-container">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Login Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td className="login-count">{user.login_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="dashboard-content">
              <div className="section">
                <h2>All Users</h2>
                <div className="table-container">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Verified</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            {user.is_verified ? (
                              <span className="verified">✓ Verified</span>
                            ) : (
                              <span className="unverified">✗ Not Verified</span>
                            )}
                          </td>
                          <td>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "recent" && (
            <div className="dashboard-content">
              <div className="section">
                <h2>Recent Registrations (Last 30 Days)</h2>
                <div className="table-container">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {user?.role !== "admin" && (
        <div className="dashboard-content">
          <div className="user-profile">
            <h2>Your Profile</h2>
            <div className="profile-info">
              <div className="profile-item">
                <span className="profile-label">Name:</span>
                <span className="profile-value">{user?.name}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Email:</span>
                <span className="profile-value">{user?.email}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Role:</span>
                <span className={`role-badge ${user?.role}`}>{user?.role}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Status:</span>
                {user?.is_verified ? (
                  <span className="verified">✓ Verified</span>
                ) : (
                  <span className="unverified">✗ Not Verified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
