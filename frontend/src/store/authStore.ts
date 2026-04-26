import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import type { AuthSession } from '../api/types';

interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  setAuth: (user: User, session: AuthSession) => void;
  setSession: (session: AuthSession) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      setAuth: (user, session) => set({ user, session, isAuthenticated: true }),
      setSession: (session) => set((state) => ({ ...state, session })),
      clearAuth: () => set({ user: null, session: null, isAuthenticated: false }),
    }),
    {
      name: 'jobrythm-auth',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

