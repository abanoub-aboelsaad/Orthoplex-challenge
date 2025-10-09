import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  it("initializes with no user", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated()).toBe(false);
  });

  it("logs in user correctly", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const userData = {
      id: 1,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    };
    const token = "fake-jwt-token";

    act(() => {
      result.current.login(userData, token);
    });

    expect(result.current.user).toEqual(userData);
    expect(result.current.isAuthenticated()).toBe(true);
    expect(result.current.getToken()).toBe(token);
    expect(localStorage.getItem("user")).toBe(JSON.stringify(userData));
    expect(localStorage.getItem("token")).toBe(token);
  });

  it("logs out user correctly", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // First login
    act(() => {
      result.current.login({ id: 1, name: "Test User" }, "fake-token");
    });

    expect(result.current.isAuthenticated()).toBe(true);

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated()).toBe(false);
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("restores user from localStorage on mount", () => {
    const userData = { id: 1, name: "Test User", email: "test@example.com" };
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", "fake-token");

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(userData);
    expect(result.current.isAuthenticated()).toBe(true);
  });

  it("throws error when useAuth is used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");
  });
});


