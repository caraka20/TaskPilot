import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "OWNER" | "USER" | "";

type AuthState = {
  baseUrl: string;
  token: string;
  username: string;
  role: Role;
  setBaseUrl: (v: string) => void;
  setToken: (v: string) => void;
  setUsername: (v: string) => void;
  setRole: (v: Role) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      baseUrl: import.meta.env.VITE_API_BASE_URL,
      token: "",
      username: "",
      role: "",
      setBaseUrl: (v) => set({ baseUrl: v }),
      setToken: (v) => set({ token: v }),
      setUsername: (v) => set({ username: v }),
      setRole: (v) => set({ role: v }),
      reset: () => set({ token: "", username: "", role: "" }),
    }),
    {
      name: "client-auth",
      // ✅ Persist SEMUA yang dibutuhkan agar setelah refresh langsung siap
      partialize: (s) => ({ token: s.token, baseUrl: s.baseUrl, username: s.username, role: s.role }),
    }
  )
);
