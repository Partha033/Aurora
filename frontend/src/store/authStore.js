/**
 * store/authStore.js — Zustand Auth Store
 *
 * Persisted to localStorage so the user stays logged in on page refresh.
 * The access token is stored here; refresh token lives in HTTP-only cookie.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,
      isAuthenticated: false,

      // Called after Login or token refresh
      setTokens: (accessToken, user) =>
        set({ accessToken, user, isAuthenticated: true }),

      // Update user profile fields without changing token
      updateUser: (updatedUser) =>
        set({ user: { ...get().user, ...updatedUser } }),

      // Clear everything — called on logout or 401 refresh failure
      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'aurora-auth',       // localStorage key
      partialize: (state) => ({  // Only persist what we need
        user:        state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
