import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import { AuthProvider } from "../../../contexts/AuthContext";

// Mock the AuthContext
jest.mock("../../../contexts/AuthContext", () => ({
  ...jest.requireActual("../../../contexts/AuthContext"),
  useAuth: jest.fn(),
}));

const { useAuth } = require("../../../contexts/AuthContext");

// Test components
const ProtectedContent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/protected"
          element={<ProtectedRoute>{component}</ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
};

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loader when authentication is being checked", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
    });

    renderWithRouter(<ProtectedContent />);
    expect(screen.getByText("Checking authentication...")).toBeInTheDocument();
  });

  test("redirects to login when user is not authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    renderWithRouter(<ProtectedContent />);

    // Should redirect to login, so protected content should not be visible
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  test("renders children when user is authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    renderWithRouter(<ProtectedContent />);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  test("does not show loader when authenticated and not loading", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    renderWithRouter(<ProtectedContent />);
    expect(
      screen.queryByText("Checking authentication...")
    ).not.toBeInTheDocument();
  });
});
