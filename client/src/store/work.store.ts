// Global status biar Topbar bisa ikut update
import { create } from "zustand"

type WorkStatus = "AKTIF" | "JEDA" | "TIDAK_AKTIF"

type WorkState = {
  status: WorkStatus
  durasiDetik: number
  setStatus: (status: WorkStatus, durasiDetik?: number) => void
}

export const useWorkStore = create<WorkState>((set) => ({
  status: "TIDAK_AKTIF",
  durasiDetik: 0,
  setStatus: (status, durasiDetik = 0) => set({ status, durasiDetik }),
}))
