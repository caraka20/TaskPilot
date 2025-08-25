// client/src/services/jamKerja.service.ts
import type { AxiosInstance } from "axios";
import { apiGet } from "../lib/http";

/** ==== Bentuk dari BE (list) ==== */
export type JamKerjaRow = {
  id: number;
  username: string;
  jamMulai: string;           // ISO
  jamSelesai?: string | null; // ISO | null
  totalJam: number;           // jam (desimal)
  status: "AKTIF" | "SELESAI" | "JEDA";
  tanggal: string;            // "YYYY-MM-DD"
};

export type RekapResp = {
  username: string;
  totalJam: number; // jam
  periode: "minggu" | "bulan"; // disesuaikan BE
};

export type ApiSuccess<T = unknown> = { status: "success"; message?: string; data: T };
export type ApiError = { status: "error" | "failed"; message: string };
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/* ============================================================
 * Helper: unwrap response yang mungkin dibalut ResponseHandler
 * ============================================================ */
function unwrap<T>(res: any): T {
  if (res && typeof res === "object") {
    // { status: "success" | "error", data, message? }
    if ("status" in res && "data" in res && (res.status === "success" || res.status === "failed" || res.status === "error")) {
      if (res.status !== "success") {
        const msg = (res as ApiError).message || "Gagal";
        throw new Error(msg);
      }
      return (res as ApiSuccess<T>).data as T;
    }
  }
  // Kalau BE mengembalikan data langsung (tanpa balutan)
  return res as T;
}

/* =========================
   GET endpoints
   ========================= */

/** List histori (tanpa range; BE minta username wajib) */
export async function listJamKerja(api: AxiosInstance, username: string) {
  const raw = await apiGet<any>(api, "/api/jam-kerja", { username });
  return unwrap<JamKerjaRow[]>(raw);
}

/** Rekap total jam by period (minggu/bulan) */
export async function getRekapJam(
  api: AxiosInstance,
  username: string,
  period: "minggu" | "bulan"
) {
  const raw = await apiGet<any>(api, "/api/jam-kerja/rekap", { username, period });
  return unwrap<RekapResp>(raw);
}

/** Rekap "aktif" agregat (opsional, untuk kompat yang masih pakai) */
export async function getAktifRekap(
  api: AxiosInstance,
  username: string,
  period: "minggu" | "bulan"
) {
  const raw = await apiGet<any>(api, "/api/jam-kerja/aktif", { username, period });
  return unwrap<RekapResp>(raw);
}

/* =========================
   Mutations (disesuaikan controller)
   ========================= */

/** Start: controller ambil username dari token (req.user), JANGAN kirim body. */
type StartData = { id: number; username: string; jamMulai: string; status: "AKTIF" };
export async function startJamKerja(api: AxiosInstance) {
  const { data } = await api.post<ApiResponse<StartData>>("/api/jam-kerja/start");
  return data; // biarkan komponen yang handle success/failed toast
}

/** Pause: POST /:id/pause TANPA body */
type PauseData = { id: number; status: "JEDA"; jamMulai?: string; jamSelesai?: string | null; totalJam?: number };
export async function pauseJamKerja(api: AxiosInstance, id: number) {
  const { data } = await api.post<ApiResponse<PauseData>>(`/api/jam-kerja/${id}/pause`);
  return data;
}

/** Resume: POST /:id/resume TANPA body (kompat: bisa flip status atau buat segmen baru di BE) */
type ResumeData = { id: number; status: "AKTIF"; jamMulai: string };
export async function resumeJamKerja(api: AxiosInstance, id: number) {
  const { data } = await api.post<ApiResponse<ResumeData>>(`/api/jam-kerja/${id}/resume`);
  return data;
}

/** End: PATCH /:id/end TANPA body */
type EndData = { id: number; jamSelesai: string; totalJam: number; status?: "SELESAI" };
export async function endJamKerja(api: AxiosInstance, id: number) {
  const { data } = await api.patch<ApiResponse<EndData>>(`/api/jam-kerja/${id}/end`);
  return data;
}

/* =========================================================================
   KOMPAT: util untuk Dashboard (range)
   ========================================================================= */

export type JamKerjaItem = {
  id: number;
  username: string;
  mulai: string;
  selesai?: string | null;
  status: "AKTIF" | "SELESAI" | "JEDA";
  durasiDetik: number; // dari totalJam * 3600
  catatan?: string | null;
  tanggal?: string;
};

export function rowToItem(r: JamKerjaRow): JamKerjaItem {
  const detik = Math.max(0, Math.round((r.totalJam ?? 0) * 3600));
  return {
    id: r.id,
    username: r.username,
    mulai: r.jamMulai,
    selesai: r.jamSelesai ?? null,
    status: r.status,
    durasiDetik: detik,
    catatan: undefined,
    tanggal: r.tanggal,
  };
}

/**
 * getHistoriByRange — kompatibel untuk FE:
 * - Mengirim {from,to} ke BE (jika BE abaikan, kita filter sendiri di FE)
 * - Mengembalikan items yang sudah dikonversi (detik dari totalJam)
 */
export async function getHistoriByRange(
  api: AxiosInstance,
  username: string,
  fromISO: string, // YYYY-MM-DD
  toISO: string    // YYYY-MM-DD
): Promise<{ totalJamDetik: number; items: JamKerjaItem[] }> {
  const raw = await apiGet<any>(api, "/api/jam-kerja", { username, from: fromISO, to: toISO });

  // Unwrap fleksibel
  let rows: JamKerjaRow[] = [];
  const unwrapped = unwrap<any>(raw); // bisa array langsung
  if (Array.isArray(unwrapped)) {
    rows = unwrapped as JamKerjaRow[];
  } else if (unwrapped && typeof unwrapped === "object") {
    const anyObj = unwrapped as { items?: unknown; data?: unknown };
    if (Array.isArray(anyObj.items)) rows = anyObj.items as JamKerjaRow[];
    else if (Array.isArray(anyObj.data)) rows = anyObj.data as JamKerjaRow[];
  } else if (raw && typeof raw === "object") {
    // fallback bila apiGet sudah unwrap sebagian
    const anyObj = raw as { items?: unknown; data?: unknown };
    if (Array.isArray(anyObj.items)) rows = anyObj.items as JamKerjaRow[];
    else if (Array.isArray(anyObj.data)) rows = anyObj.data as JamKerjaRow[];
  }

  const inRange = (r: JamKerjaRow) => {
    const d = new Date(r.jamMulai).toISOString().slice(0, 10);
    return d >= fromISO && d <= toISO;
  };
  const filtered = rows.filter(inRange);

  const items = filtered.map(rowToItem);
  const totalJamDetik = Math.round(
    filtered.reduce((acc, r) => acc + (r.totalJam ?? 0) * 3600, 0)
  );

  return { totalJamDetik, items };
}

/* =========================
   SUMMARY endpoints
   ========================= */

export type StatusSaatIni = "AKTIF" | "JEDA" | "SELESAI" | "OFF";

export type RangeTotals = {
  totalJam: number;
  totalGaji: number;
};

export type UserPeriodTotals = {
  hari: RangeTotals;
  minggu: RangeTotals;
  bulan: RangeTotals;
  semua: RangeTotals;
};

export type OwnerUserSummary = {
  username: string;
  status: StatusSaatIni;
  sesiTerakhir?: {
    id: number;
    jamMulai: string;
    jamSelesai: string | null;
    status: "AKTIF" | "JEDA" | "SELESAI";
  } | null;
  totals: UserPeriodTotals;
};

export type OwnerSummaryDTO = {
  generatedAt: string;
  counts: { users: number; aktif: number; jeda: number };
  users: OwnerUserSummary[];
};

export async function getOwnerSummary(api: AxiosInstance, params?: { username?: string }) {
  const raw = await apiGet<any>(api, "/api/jam-kerja/summary", params);
  return unwrap<OwnerSummaryDTO>(raw);
}

export async function getUserSummary(api: AxiosInstance, username: string) {
  const raw = await apiGet<any>(api, "/api/jam-kerja/user-summary", { username });
  return unwrap<OwnerUserSummary>(raw);
}
