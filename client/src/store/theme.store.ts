import { create } from "zustand";
import { persist } from "zustand/middleware";

// default ikut preferensi sistem
function getSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

type ThemeState = {
  dark: boolean;
  toggle: () => void;
  set: (v: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: getSystemDark(),
      toggle: () => set((state) => ({ dark: !state.dark })),
      set: (dark) => set({ dark }),
    }),
    { name: "taskpilot-theme" }
  )
);
