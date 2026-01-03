import axios from "axios";
import { tokenUtils } from "./token-utils";

// Create axios instance with base configuration
const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenUtils.getBearerToken();
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  () => {}
);

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      tokenUtils.clearAuth();
      if (typeof window !== "undefined") {
        // replace to prevent back navigation into protected routes
        window.location.replace("/sign-in");
      }
    }
    // Always reject the error so it can be handled by the calling code
    return Promise.reject(error);
  }
);

export default axiosInstance;
