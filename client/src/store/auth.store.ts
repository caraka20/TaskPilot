import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

export type Role = "OWNER" | "USER" | "";

type AuthState = {
  baseUrl: string;
  token: string;
  username: string;
  role: Role;
  canViewCustomerBilling: boolean;
  avatarUrl: string;
  setBaseUrl: (v: string) => void;
  setToken: (v: string) => void;
  setUsername: (v: string) => void;
  setRole: (v: Role) => void;
  setCanViewCustomerBilling: (v: boolean) => void;
  setAvatarUrl: (v: string) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Kosong berarti same-origin. Saat development, Vite meneruskan /api ke backend port 3000.
      baseUrl: API_BASE_URL,
      token: "",
      username: "",
      role: "",
      canViewCustomerBilling: false,
      avatarUrl: "",
      setBaseUrl: (v) => set({ baseUrl: v }),
      setToken: (v) => set({ token: v }),
      setUsername: (v) => set({ username: v }),
      setRole: (v) => set({ role: v }),
      setCanViewCustomerBilling: (v) => set({ canViewCustomerBilling: v }),
      setAvatarUrl: (v) => set({ avatarUrl: v }),
      reset: () => set({ token: "", username: "", role: "", canViewCustomerBilling: false, avatarUrl: "", baseUrl: API_BASE_URL }),
    }),
    {
      name: "client-auth",
      partialize: (s) => ({
        token: s.token,
        username: s.username,
        role: s.role,
        canViewCustomerBilling: s.canViewCustomerBilling,
        avatarUrl: s.avatarUrl,
        // ❌ baseUrl tidak disimpan, selalu ikut env
      }),
    }
  )
);
