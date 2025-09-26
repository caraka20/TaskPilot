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
      baseUrl: import.meta.env.VITE_API_BASE_URL, // default selalu ikut ENV
      token: "",
      username: "",
      role: "",
      setBaseUrl: (v) => set({ baseUrl: v }),
      setToken: (v) => set({ token: v }),
      setUsername: (v) => set({ username: v }),
      setRole: (v) => set({ role: v }),
      reset: () => set({ token: "", username: "", role: "", baseUrl: import.meta.env.VITE_API_BASE_URL }),
    }),
    {
      name: "client-auth",
      partialize: (s) => ({
        token: s.token,
        username: s.username,
        role: s.role,
        // ❌ baseUrl tidak disimpan, selalu ikut env
      }),
    }
  )
);

