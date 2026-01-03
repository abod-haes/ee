import type { User, AuthState } from "@/types/auth.type";

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

/**
 * Token utility functions for managing authentication tokens and user data
 */
export const tokenUtils = {
  /**
   * Store authentication token in sessionStorage and cookies
   * @param token - The JWT token to store
   */
  setToken: (token: string): void => {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      // Also store in cookies for middleware access
      document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`;
    } catch (error) {
      console.error("Failed to store token:", error);
    }
  },

  /**
   * Retrieve authentication token from sessionStorage
   * @returns The stored token or null if not found
   */
  getToken: (): string | null => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error("Failed to retrieve token:", error);
      return null;
    }
  },

  /**
   * Store user data in sessionStorage
   * @param user - The user object to store
   */
  setUser: (user: User): void => {
    try {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to store user data:", error);
    }
  },

  /**
   * Retrieve user data from sessionStorage
   * @returns The stored user object or null if not found
   */
  getUser: (): User | null => {
    try {
      const userStr = sessionStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Failed to retrieve user data:", error);
      return null;
    }
  },

  /**
   * Store complete authentication state
   * @param token - The JWT token
   * @param user - The user object
   */
  setAuthState: (token: string, user: User): void => {
    tokenUtils.setToken(token);
    tokenUtils.setUser(user);
  },

  /**
   * Retrieve complete authentication state
   * @returns AuthState object with token, user, and authentication status
   */
  getAuthState: (): AuthState => {
    const token = tokenUtils.getToken();
    const user = tokenUtils.getUser();

    return {
      token,
      user,
      isAuthenticated: !!(token && user),
    };
  },

  /**
   * Clear all authentication data from sessionStorage and cookies
   */
  clearAuth: (): void => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      // Also clear the cookie
      document.cookie = `authToken=; path=/; max-age=0; SameSite=Lax`;
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  },

  /**
   * Check if user is authenticated
   * @returns True if both token and user data exist
   */
  isAuthenticated: (): boolean => {
    const token = tokenUtils.getToken();
    const user = tokenUtils.getUser();
    return !!(token && user);
  },

  /**
   * Get token for API requests
   * @returns Bearer token string or null
   */
  getBearerToken: (): string | null => {
    const token = tokenUtils.getToken();
    return token ? `Bearer ${token}` : null;
  },
};
