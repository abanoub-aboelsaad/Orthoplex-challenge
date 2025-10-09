import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("AuthContext", () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  test("provides initial unauthenticated state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  test("restores authentication state from localStorage", () => {
    const mockUser = { id: 1, name: "John Doe", email: "john@example.com" };
    const mockToken = "test-token-123";

    localStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("token", mockToken);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
  });

  test("login success updates state and stores in localStorage", async () => {
    const mockUser = { id: 1, name: "John Doe", email: "john@example.com" };
    const mockToken = "test-token-123";

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: mockToken }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login(
        "john@example.com",
        "password123"
      );
    });

    expect(loginResult.success).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.error).toBe(null);

    expect(localStorage.getItem("token")).toBe(mockToken);
    expect(JSON.parse(localStorage.getItem("user"))).toEqual(mockUser);
  });

  test("login failure updates error state", async () => {
    const errorMessage = "Invalid credentials";

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login(
        "john@example.com",
        "wrongpassword"
      );
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe(errorMessage);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  test("login handles network errors", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login(
        "john@example.com",
        "password123"
      );
    });

    expect(loginResult.success).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  test("logout clears state and localStorage", async () => {
    const mockUser = { id: 1, name: "John Doe", email: "john@example.com" };
    const mockToken = "test-token-123";

    localStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("token", mockToken);

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.token).toBe(null);
    expect(localStorage.getItem("token")).toBe(null);
    expect(localStorage.getItem("user")).toBe(null);
  });

  test("clearError removes error message", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Login failed" }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Trigger an error
    await act(async () => {
      await result.current.login("john@example.com", "wrongpassword");
    });

    expect(result.current.error).toBe("Login failed");

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  test("login sets loading state correctly", async () => {
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    fetch.mockReturnValueOnce(loginPromise);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Start login
    act(() => {
      result.current.login("john@example.com", "password123");
    });

    // Should be loading
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve the login
    await act(async () => {
      resolveLogin({
        ok: true,
        json: async () => ({
          user: { id: 1, name: "John" },
          token: "token",
        }),
      });
      await loginPromise;
    });

    // Should not be loading
    expect(result.current.loading).toBe(false);
  });

  test("throws error when useAuth is used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });
});
