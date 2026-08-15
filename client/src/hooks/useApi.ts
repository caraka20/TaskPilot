import axios, { isAxiosError } from "axios";
import { useMemo } from "react";
import { useAuthStore } from "../store/auth.store";

export function useApi() {
  const { baseUrl, token } = useAuthStore();

  return useMemo(() => {
    const instance = axios.create({ baseURL: baseUrl });
    instance.defaults.headers.common["Content-Type"] = "application/json";
    if (token) instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Token hanya tidak valid pada 401. Respons 403 berarti akun masih login,
    // tetapi tidak punya izin untuk aksi tertentu.
    instance.interceptors.response.use(
      (res) => res,
      (err) => {
        if (isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 401) {
            useAuthStore.getState().reset();
          }
        }
        return Promise.reject(err);
      }
    );

    return instance;
  }, [baseUrl, token]);
}
