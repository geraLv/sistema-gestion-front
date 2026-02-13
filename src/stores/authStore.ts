import { create } from "zustand";
import type { AuthState, Usuario } from "../types";

interface AuthStore extends AuthState {
  setUsuario: (usuario: Usuario | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  logout: () => void;
  login: (usuario: Usuario) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  usuario: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  hasHydrated: false,

  setUsuario: (usuario) =>
    set({
      usuario,
      isAuthenticated: !!usuario,
      error: null,
      hasHydrated: true,
    }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setHasHydrated: (value) => set({ hasHydrated: value }),

  login: (usuario) => {
    set({ usuario, isAuthenticated: true, error: null });
  },

  logout: () => {
    set({ usuario: null, token: null, isAuthenticated: false, hasHydrated: true });
  },
}));

export default useAuthStore;
