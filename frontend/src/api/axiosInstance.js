/**
 * api/axiosInstance.js
 * Centralised Axios client.
 * - Attaches Authorization header from Zustand auth store on every request
 * - Intercepts 401 to auto-refresh the access token once, then retries
 */

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://aurora-0x5x.onrender.com/api',
  withCredentials: true,  // Send HTTP-only refresh token cookie
});

// ── Request interceptor — attach access token ────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — silent token refresh on 401 ───────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,  // Pass through successful responses
  async (error) => {
    const original = error.config;

    // Only handle 401 that hasn't already been retried
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue concurrent requests while refresh is in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Use refresh token cookie to get a new access token
        const { data } = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        // Backend: { success, msg, result: { accessToken, user } }
        const newToken = data.result.accessToken;
        useAuthStore.getState().setTokens(newToken, data.result.user);
        processQueue(null, newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
