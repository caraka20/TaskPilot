import { create } from "zustand";

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

export const useThemeStore = create<ThemeState>((set) => ({
  dark: getSystemDark(),
  toggle: () => set((s) => ({ dark: !s.dark })),
  set: (v) => set({ dark: v }),
}));
