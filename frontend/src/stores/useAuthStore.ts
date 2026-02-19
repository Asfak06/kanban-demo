import { create } from 'zustand';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  error: null,

  setUser: (user) => set({ user }),

  login: async (username, password) => {
    try {
      set({ error: null });
      const user = await api.login(username, password);
      set({ user });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Login failed' });
    }
  },

  logout: () => {
    set({ user: null, error: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },
}));
