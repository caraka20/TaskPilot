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
  totalJam: number;
  periode: "minggu" | "bulan";
};

export type ApiSuccess<T = unknown> = { status: "success"; message?: string; data: T };
export type ApiError = { status: "error" | "failed"; message: string };
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/* ============================================================
 * Helper: unwrap response yang mungkin dibalut ResponseHandler
 * ============================================================ */
function unwrap<T>(res: any): T {
  if (res && typeof res === "object" && "status" in res) {
    const s = (res as { status?: string }).status;
    if (s === "success") return (res as ApiSuccess<T>).data as T;
    if (s === "error" || s === "failed") {
      const msg = (res as ApiError).message || "Gagal";
      throw new Error(msg);
    }
  }
  // fallback: data langsung
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

/** Rekap "aktif" agregat (opsional) */
export async function getAktifRekap(
  api: AxiosInstance,
  username: string,
  period: "minggu" | "bulan"
) {
  const raw = await apiGet<any>(api, "/api/jam-kerja/aktif", { username, period });
  return unwrap<RekapResp>(raw);
}

/* =========================
   Mutations (SELF)
   ========================= */

/** Start (SELF): controller baca username dari token */
type StartData = { id: number; username: string; jamMulai: string; status: "AKTIF" };
export async function startJamKerja(api: AxiosInstance) {
  const { data } = await api.post<ApiResponse<StartData>>("/api/jam-kerja/start");
  return data; // biarkan caller yang cek status untuk toast lama
}

/** Versi strict (unwrap & throw) — non-breaking add-on */
export async function startJamKerjaStrict(api: AxiosInstance) {
  const { data } = await api.post<ApiResponse<StartData>>("/api/jam-kerja/start");
  return unwrap<StartData>(data);
}

/** Pause: POST /:id/pause */
type PauseData = { id: number; status: "JEDA"; jamMulai?: string; jamSelesai?: string | null; totalJam?: number };
export async function pauseJamKerja(api: AxiosInstance, id: number) {
  const { data } = await api.post<ApiResponse<PauseData>>(`/api/jam-kerja/${id}/pause`);
  return data;
}
export async function pauseJamKerjaStrict(api: AxiosInstance, id: number) {
  const { data } = await api.post<ApiResponse<PauseData>>(`/api/jam-kerja/${id}/pause`);
  return unwrap<PauseData>(data);
}

/** Resume: POST /:id/resume */
type ResumeData = { id: number; status: "AKTIF"; jamMulai: string };
export async function resumeJamKerja(api: AxiosInstance, id: number) {
  const { data } = await api.post<ApiResponse<ResumeData>>(`/api/jam-kerja/${id}/resume`);
  return data;
}
export async function resumeJamKerjaStrict(api: AxiosInstance, id: number) {
  const { data } = await api.post<ApiResponse<ResumeData>>(`/api/jam-kerja/${id}/resume`);
  return unwrap<ResumeData>(data);
}

/** End: PATCH /:id/end */
type EndData = { id: number; jamSelesai: string; totalJam: number; status?: "SELESAI" };
export async function endJamKerja(api: AxiosInstance, id: number) {
  const { data } = await api.patch<ApiResponse<EndData>>(`/api/jam-kerja/${id}/end`);
  return data;
}
export async function endJamKerjaStrict(api: AxiosInstance, id: number) {
  const { data } = await api.patch<ApiResponse<EndData>>(`/api/jam-kerja/${id}/end`);
  return unwrap<EndData>(data);
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

/** Range helper – BE boleh abaikan range; kita filter di FE */
export async function getHistoriByRange(
  api: AxiosInstance,
  username: string,
  fromISO: string, // YYYY-MM-DD
  toISO: string    // YYYY-MM-DD
): Promise<{ totalJamDetik: number; items: JamKerjaItem[] }> {
  const raw = await apiGet<any>(api, "/api/jam-kerja", { username, from: fromISO, to: toISO });

  let rows: JamKerjaRow[] = [];
  const unwrapped = unwrap<any>(raw);
  if (Array.isArray(unwrapped)) rows = unwrapped;
  else if (unwrapped && typeof unwrapped === "object") {
    const o = unwrapped as { items?: unknown; data?: unknown };
    if (Array.isArray(o.items)) rows = o.items as JamKerjaRow[];
    else if (Array.isArray(o.data)) rows = o.data as JamKerjaRow[];
  }

  const inRange = (r: JamKerjaRow) => {
    const d = new Date(r.jamMulai).toISOString().slice(0, 10);
    return d >= fromISO && d <= toISO;
  };
  const filtered = rows.filter(inRange);

  const items = filtered.map(rowToItem);
  const totalJamDetik = Math.round(filtered.reduce((acc, r) => acc + (r.totalJam ?? 0) * 3600, 0));

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

/* =========================
   EXTRA helpers (baru, tidak breaking)
   ========================= */

/** Ambil entry terbaru (paling atas) — berguna buat dapatkan activeSessionId setelah start */
export async function getLatestEntry(api: AxiosInstance, username: string) {
  const rows = await listJamKerja(api, username);
  return rows[0] ?? null;
}

/** Derive status & activeSessionId dari list */
export function deriveStatusAndActiveId(rows: JamKerjaRow[]) {
  const latest = rows?.[0];
  const status = (latest?.status ?? "OFF") as StatusSaatIni;
  const activeSessionId =
    latest && (latest.status === "AKTIF" || (latest.status === "JEDA" && latest.jamSelesai == null))
      ? latest.id
      : null;
  return { status, activeSessionId };
}

export type OwnerSummary = {
  counts?: { aktif?: number; jeda?: number };
  users: Array<{
    username: string;
    status: "AKTIF" | "JEDA" | "SELESAI" | "OFF" | string;
    totals?: {
      hari?:    { totalJam?: number; totalGaji?: number };
      minggu?:  { totalJam?: number; totalGaji?: number };
      bulan?:   { totalJam?: number; totalGaji?: number };
      semua?:   { totalJam?: number; totalGaji?: number };
    };
  }>;
};

// =========================
// Mutations (OWNER only)
// =========================

export type UpdateJamKerjaPayload = Partial<{
  jamMulai: string | Date;
  jamSelesai: string | Date | null;
  status: "AKTIF" | "JEDA" | "SELESAI";
  recalcGaji: boolean; // default server: true
}>;

type UpdateResp = JamKerjaRow & { isOpen?: boolean };

function toIsoOrNull(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/** Normalisasi payload: Date -> ISO & drop undefined keys */
function normalizeUpdatePayload(patch: UpdateJamKerjaPayload) {
  const out: any = {};
  if (patch.jamMulai !== undefined) out.jamMulai = toIsoOrNull(patch.jamMulai);
  if (patch.jamSelesai !== undefined) out.jamSelesai = toIsoOrNull(patch.jamSelesai);
  if (patch.status !== undefined) out.status = patch.status;
  if (patch.recalcGaji !== undefined) out.recalcGaji = patch.recalcGaji;
  return out;
}

/** PATCH /api/jam-kerja/:id (OWNER only) — return envelope apa adanya */
export async function updateJamKerja(
  api: AxiosInstance,
  id: number,
  patch: UpdateJamKerjaPayload
) {
  const body = normalizeUpdatePayload(patch);
  const { data } = await api.patch<ApiResponse<UpdateResp>>(`/api/jam-kerja/${id}`, body);
  return data;
}

/** Versi strict (unwrap & throw) */
export async function updateJamKerjaStrict(
  api: AxiosInstance,
  id: number,
  patch: UpdateJamKerjaPayload
) {
  const body = normalizeUpdatePayload(patch);
  const { data } = await api.patch<ApiResponse<UpdateResp>>(`/api/jam-kerja/${id}`, body);
  return unwrap<UpdateResp>(data);
}

/* ====== convenience helpers (opsional) ====== */

/** Tandai selesai dgn jamSelesai (default: sekarang) */
export async function finishJamKerjaNow(
  api: AxiosInstance,
  id: number,
  opts?: { when?: Date | string; recalcGaji?: boolean }
) {
  const whenIso = toIsoOrNull(opts?.when ?? new Date());
  return updateJamKerja(api, id, { status: "SELESAI", jamSelesai: whenIso!, recalcGaji: opts?.recalcGaji });
}

/** Koreksi jamMulai (mis. mundurkan 10 menit) */
export async function correctStartTime(
  api: AxiosInstance,
  id: number,
  newStart: Date | string,
  recalcGaji = true
) {
  return updateJamKerja(api, id, { jamMulai: newStart, recalcGaji });
}

/** Set ke JEDA open (tanpa jamSelesai) */
export async function setJedaOpen(api: AxiosInstance, id: number) {
  return updateJamKerja(api, id, { status: "JEDA", jamSelesai: null });
}

/** Set ke JEDA closed (dengan jamSelesai spesifik) */
export async function setJedaClosed(
  api: AxiosInstance,
  id: number,
  when: Date | string,
  recalcGaji = true
) {
  return updateJamKerja(api, id, { status: "JEDA", jamSelesai: when, recalcGaji });
}
