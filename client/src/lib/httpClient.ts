import axios from "axios";
import { useAuthStore } from "../store/auth.store";

/**
 * Global Axios instance
 */
const httpClient = axios.create({
  withCredentials: false, // set true kalau pakai cookie session
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Ambil data auth dari Zustand store
 */
function getAuth() {
  try {
    return useAuthStore.getState();
  } catch {
    return { token: "", baseUrl: "" } as any;
  }
}

httpClient.interceptors.request.use((config) => {
  const { token, baseUrl } = getAuth();

  // Prioritaskan .env
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  config.baseURL = envUrl || baseUrl;

  console.log("👉 BASE URL dipakai:", config.baseURL);
  console.log("👉 ENV URL:", envUrl);
  console.log("👉 STORE URL:", baseUrl);

  if (!envUrl && baseUrl) {
    console.warn("⚠️ ENV kosong, fallback ke store:", baseUrl);
  }

  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Global Response Interceptor
 */
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
