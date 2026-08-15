import { create } from "zustand";

type UIState = {
  sidebarCollapsed: boolean;
  pendingApprovals: number;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
  setPendingApprovals: (count: number) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  pendingApprovals: 0,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebar: (v) => set({ sidebarCollapsed: v }),
  setPendingApprovals: (count) =>
    set({ pendingApprovals: Math.max(0, Math.trunc(Number(count) || 0)) }),
}));
