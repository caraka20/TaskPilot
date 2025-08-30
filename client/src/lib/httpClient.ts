// src/lib/httpClient.ts
import axios from "axios";
import { useAuthStore } from "../store/auth.store"; // SESUAIKAN path store-mu

/**
 * Axios instance tanpa baseURL statis.
 * baseURL & Authorization akan diisi dinamis dari Zustand store setiap request.
 */
const httpClient = axios.create({
  withCredentials: false, // set true jika pakai cookie session
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ambil nilai dari Zustand store (bukan hook React — aman dipakai di luar komponen)
function getAuth() {
  try {
    return useAuthStore.getState();
  } catch {
    return { token: "", baseUrl: "" } as any;
  }
}

httpClient.interceptors.request.use((config) => {
  const { token, baseUrl } = getAuth();

  // set baseURL tiap request dari store (fallback ke .env atau localhost)
  config.baseURL = baseUrl || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        const { reset } = useAuthStore.getState();
        reset?.();
      } finally {
        if (!location.pathname.startsWith("/login")) {
          location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default httpClient;
