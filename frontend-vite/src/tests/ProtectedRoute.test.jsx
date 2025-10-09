import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

describe("ProtectedRoute Component", () => {
  const TestComponent = () => <div>Protected Content</div>;
  const LoginComponent = () => <div>Login Page</div>;

  const renderProtectedRoute = (isAuthenticated = false) => {
    if (isAuthenticated) {
      localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, name: "Test User" })
      );
      localStorage.setItem("token", "fake-token");
    } else {
      localStorage.clear();
    }

    return render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginComponent />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it("redirects to login when not authenticated", async () => {
    window.history.pushState({}, "Test page", "/protected");
    renderProtectedRoute(false);

    // Should redirect to login
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders protected content when authenticated", async () => {
    window.history.pushState({}, "Test page", "/protected");
    renderProtectedRoute(true);

    expect(await screen.findByText("Protected Content")).toBeInTheDocument();
  });
});


