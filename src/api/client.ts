import axios from "axios";
import type { AxiosInstance } from "axios";
import useAuthStore from "../stores/authStore";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<any> | null = null;

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute =
      typeof original?.url === "string" &&
      (original.url.includes("/auth/refresh-token") ||
        original.url.includes("/auth/login") ||
        original.url.includes("/auth/logout") ||
        original.url.includes("/auth/validate-token"));

    if (error.response?.status === 401 && !original?._retry && !isAuthRoute) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = apiClient.post("/auth/refresh-token");
        }
        await refreshPromise;
        refreshPromise = null;
        return apiClient(original);
      } catch (refreshError) {
        refreshPromise = null;
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
