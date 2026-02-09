import { create } from "zustand";
import type { AuthState, Usuario } from "../types";

interface AuthStore extends AuthState {
  setUsuario: (usuario: Usuario | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  login: (usuario: Usuario, token: string) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  usuario: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token"),
  isLoading: false,
  error: null,

  setUsuario: (usuario) => set({ usuario }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem("token");
      set({ token: null, isAuthenticated: false });
    }
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  login: (usuario, token) => {
    localStorage.setItem("token", token);
    set({ usuario, token, isAuthenticated: true, error: null });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ usuario: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
