import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Navbar Component", () => {
  const renderNavbar = (initialUser = null) => {
    if (initialUser) {
      localStorage.setItem("user", JSON.stringify(initialUser));
      localStorage.setItem("token", "fake-token");
    } else {
      localStorage.clear();
    }

    return render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it("renders navbar with logo", () => {
    renderNavbar();
    expect(screen.getByText("User Management")).toBeInTheDocument();
  });

  it("shows login and register links when not authenticated", () => {
    renderNavbar();
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("shows dashboard and logout when authenticated", () => {
    const user = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    };
    renderNavbar(user);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("handles logout correctly", () => {
    const user = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    };
    renderNavbar(user);

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("displays admin role badge correctly", () => {
    const adminUser = {
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
    };
    renderNavbar(adminUser);

    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("renders hamburger menu button", () => {
    renderNavbar();
    const hamburgerButton = screen.getByLabelText("Toggle menu");
    expect(hamburgerButton).toBeInTheDocument();
  });

  it("toggles menu when hamburger is clicked", () => {
    renderNavbar();
    const hamburgerButton = screen.getByLabelText("Toggle menu");
    const navbarMenu = document.querySelector(".navbar-menu");

    // Initially, menu should not have active class
    expect(navbarMenu).not.toHaveClass("active");

    // Click to open menu
    fireEvent.click(hamburgerButton);
    expect(navbarMenu).toHaveClass("active");

    // Click to close menu
    fireEvent.click(hamburgerButton);
    expect(navbarMenu).not.toHaveClass("active");
  });

  it("closes menu when a navigation link is clicked", () => {
    const user = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    };
    renderNavbar(user);

    const hamburgerButton = screen.getByLabelText("Toggle menu");
    const navbarMenu = document.querySelector(".navbar-menu");

    // Open menu
    fireEvent.click(hamburgerButton);
    expect(navbarMenu).toHaveClass("active");

    // Click dashboard link
    const dashboardLink = screen.getByText("Dashboard");
    fireEvent.click(dashboardLink);

    // Menu should close
    expect(navbarMenu).not.toHaveClass("active");
  });

  it("adds active class to hamburger when menu is open", () => {
    renderNavbar();
    const hamburgerButton = screen.getByLabelText("Toggle menu");

    // Initially, hamburger should not have active class
    expect(hamburgerButton).not.toHaveClass("active");

    // Click to open menu
    fireEvent.click(hamburgerButton);
    expect(hamburgerButton).toHaveClass("active");
  });
});
