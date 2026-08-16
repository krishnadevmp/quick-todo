import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '@/api/auth.api';
import type { PublicUser } from '@/api/auth.api';
import { ApiError } from '@/api/client';

export type AuthMode = 'guest' | 'account' | null;

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  /** null = undecided (first-ever load, hasn't chosen signup/login/guest yet) */
  mode: AuthMode;
  /** Set once, on the first successful signup/login/continueAsGuest, and
   *  never cleared again — including by logout(). Lets a null `mode` be
   *  told apart as "brand new visitor" (→ /signup) vs. "signed out of an
   *  account they already had" (→ /login), which both AppRoutes/
   *  RequireSession use to pick a redirect target. */
  hasOnboarded: boolean;
  isLoading: boolean;
  error: string | null;

  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  continueAsGuest: () => void;
  /** Revalidates the stored token against GET /auth/me; logs out on 401 */
  refreshMe: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  /** Called by api/client.ts on any 401 response */
  handleUnauthorized: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      mode: null,
      hasOnboarded: false,
      isLoading: false,
      error: null,

      signup: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.signup(name, email, password);
          set({ user, token, mode: 'account', hasOnboarded: true, isLoading: false });
        } catch (e) {
          set({ error: e instanceof ApiError ? e.message : 'Sign up failed', isLoading: false });
          throw e;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.login(email, password);
          set({ user, token, mode: 'account', hasOnboarded: true, isLoading: false });
        } catch (e) {
          set({ error: e instanceof ApiError ? e.message : 'Log in failed', isLoading: false });
          throw e;
        }
      },

      logout: () => {
        set({ user: null, token: null, mode: null, error: null });
      },

      continueAsGuest: () => {
        set({ user: null, token: null, mode: 'guest', hasOnboarded: true, error: null });
      },

      refreshMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const { user } = await authApi.me();
          set({ user });
        } catch {
          // handleUnauthorized() already ran via the client on a 401;
          // other failures (offline) are ignored — keep using the cached user.
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.changePassword(currentPassword, newPassword);
          set({ isLoading: false });
        } catch (e) {
          set({ error: e instanceof ApiError ? e.message : 'Could not change password', isLoading: false });
          throw e;
        }
      },

      clearError: () => set({ error: null }),

      handleUnauthorized: () => {
        // Only meaningful once actually signed in — avoids a stray 401
        // (e.g. a mistyped login attempt) accidentally resetting mode.
        if (get().mode === 'account') set({ user: null, token: null });
      },
    }),
    {
      name: 'quick-todo-auth',
      partialize: (s) => ({ user: s.user, token: s.token, mode: s.mode, hasOnboarded: s.hasOnboarded }),
    }
  )
);
