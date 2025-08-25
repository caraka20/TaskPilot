// src/services/dashboard.service.ts
import type { AxiosInstance } from "axios"
import { apiGet } from "../lib/http"

export type DashboardSummary = {
  totalJamHariIni?: number
  totalJamMinggu?: number
  rataRataJamUserMinggu?: number
  // tambah field lain kalau BE sediakan (fleksibel)
}

export async function getDashboardSummary(api: AxiosInstance) {
  return apiGet<DashboardSummary>(api, "/api/dashboard/summary")
}
