import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Home.css";

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      <div className="home-hero">
        <div className="hero-content">
          <h1>Welcome to Orthoplex</h1>
          <p className="hero-subtitle">
            A comprehensive user management system built with React and Node.js
          </p>

          {isAuthenticated ? (
            <div className="authenticated-actions">
              <p className="welcome-message">
                Welcome back, <strong>{user?.name}</strong>!
              </p>
              <Link to="/dashboard" className="cta-button">
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="unauthenticated-actions">
              <p className="hero-description">
                Sign in to access your dashboard and manage your account
              </p>
              <div className="cta-buttons">
                <Link to="/login" className="cta-button">
                  Sign In
                </Link>
                <Link to="/register" className="cta-button cta-button-outline">
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hero-features">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Authentication</h3>
              <p>JWT-based authentication with role-based access control</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics Dashboard</h3>
              <p>Comprehensive user statistics and activity monitoring</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>User Management</h3>
              <p>Complete CRUD operations for user administration</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>Optimized for desktop, tablet, and mobile devices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
