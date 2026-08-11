// client/src/services/gaji.service.ts
import type { AxiosInstance } from "axios";
import { apiPost, apiPatch, apiDelete } from "../lib/http";

/* ========================= Types ========================= */

export type GajiItem = {
  id: number;
  username: string;
  jumlahBayar: number;
  catatan?: string | null;
  tanggalBayar: string; // ISO dari BE
  namaLengkap?: string;
};

export type Paginated<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages?: number };
};

export type SummaryPeriod = "total" | "minggu" | "bulan";

export type OwnerListQuery = {
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
  username?: string;
  fromISO?: string; // YYYY-MM-DD
  toISO?: string;   // YYYY-MM-DD
};

export type CreateGajiPayload = {
  username: string;
  jumlahBayar: number;
  catatan?: string | null;
};

export type UpdateGajiPayload = {
  jumlahBayar?: number;
  catatan?: string | null;
};

export type GajiMeSummary = {
  username: string;
  totalJam: number;
  gajiPerJam: number;
  upahKeseluruhan: number;
  totalDiterima: number;
  belumDibayar: number;
};

/* ========================= Helpers ========================= */

const toNum = (x: any, d = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : d;
};

function unwrap<T>(res: any): T {
  // handle { status, data } envelope
  if (res && typeof res === "object" && "status" in res && "data" in res) {
    return res.data as T;
  }
  return res as T;
}

function toItem(row: any): GajiItem {
  return {
    id: toNum(row?.id),
    username: String(row?.username ?? ""),
    jumlahBayar: toNum(row?.jumlahBayar ?? row?.jumlah_bayar ?? row?.amount),
    catatan: (row?.catatan ?? row?.note ?? null) as string | null,
    tanggalBayar: String(
      row?.tanggalBayar ?? row?.tanggal_bayar ?? row?.paidAt ?? row?.createdAt ?? new Date().toISOString()
    ),
    namaLengkap: row?.namaLengkap ?? row?.fullname ?? undefined,
  };
}

/* ========================= API: OWNER ========================= */

/** GET /api/gaji (OWNER) */
export async function getAllGaji(
  api: AxiosInstance,
  q: OwnerListQuery = {}
): Promise<Paginated<GajiItem>> {
  const params: Record<string, string | number> = {
    page: q.page ?? 1,
    limit: q.limit ?? 10,
    sort: q.sort ?? "desc",
  };
  if (q.username) params.username = q.username;
  if (q.fromISO) params["tanggalBayar.gte"] = q.fromISO;
  if (q.toISO) params["tanggalBayar.lte"] = q.toISO;

  const res = await api.get("/api/gaji", { params });
  const payload = unwrap<any>(res.data);

  // BE umum: { page, perPage, total, data: [...] }
  const page = toNum(payload?.page ?? payload?.pagination?.page ?? params.page, 1);
  const limit = toNum(payload?.perPage ?? payload?.pagination?.limit ?? params.limit, 10);
  const total = toNum(payload?.total ?? payload?.pagination?.total);
  const rawItems = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.items) ? payload.items : [];
  const items: GajiItem[] = rawItems.map(toItem);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))),
    },
  };
}

/** POST /api/gaji (OWNER) */
export async function createGaji(
  api: AxiosInstance,
  payload: CreateGajiPayload
): Promise<GajiItem> {
  return apiPost<GajiItem, CreateGajiPayload>(api, "/api/gaji", payload);
}

/** PATCH /api/gaji/:id (OWNER) */
export async function updateGaji(
  api: AxiosInstance,
  id: number,
  payload: UpdateGajiPayload
): Promise<GajiItem> {
  return apiPatch<GajiItem, UpdateGajiPayload>(api, `/api/gaji/${id}`, payload);
}

/** DELETE /api/gaji/:id (OWNER) */
export async function deleteGaji(api: AxiosInstance, id: number): Promise<void> {
  await apiDelete<null>(api, `/api/gaji/${id}`);
}

/* ========================= API: USER ========================= */

/** GET /api/gaji/me (USER) */
export async function getGajiMe(
  api: AxiosInstance,
  query: {
    page?: number;
    limit?: number;
    sort?: "asc" | "desc";
    "tanggalBayar.gte"?: string;
    "tanggalBayar.lte"?: string;
  }
): Promise<Paginated<GajiItem>> {
  const res = await api.get("/api/gaji/me", { params: query });
  const payload = unwrap<any>(res.data);

  const data = payload?.items ? payload : payload?.data; // {items,pagination} bisa di root atau di data
  const items: GajiItem[] = Array.isArray(data?.items) ? data.items.map(toItem) : [];

  const p = data?.pagination ?? {};
  const page = toNum(p.page ?? query.page, 1);
  const limit = toNum(p.limit ?? p.perPage ?? query.limit, 10);
  const total = toNum(p.total);
  const totalPages = toNum(p.totalPages, Math.max(1, Math.ceil(total / Math.max(1, limit))));

  return {
    items,
    pagination: { page, limit, total, totalPages },
  };
}

/* ========================= API: SUMMARY (OWNER) ========================= */

/** GET /api/gaji/summary?period=total|minggu|bulan (legacy: scope=all -> total) */
export async function getGajiSummary(
  api: AxiosInstance,
  opts: { period?: SummaryPeriod; scope?: "all" } = {}
): Promise<{ period: SummaryPeriod; totalGaji: number; totalDibayar: number; belumDibayar: number }> {
  const params: Record<string, string> = {};
  if (opts.scope === "all") params.scope = "all";
  else params.period = (opts.period ?? "total") as SummaryPeriod;

  const res = await api.get("/api/gaji/summary", { params });
  const d = unwrap<any>(res.data);

  const period = (d?.period ?? "total") as SummaryPeriod;
  const totalGaji = toNum(d?.totalGaji ?? d?.upahKeseluruhan ?? d?.totalUpah);
  const totalDibayar = toNum(d?.totalDibayar ?? d?.totalDiterima ?? d?.sudahDibayar ?? d?.paid);
  // jika server tidak kirim sisa, hitung sendiri
  const belumDibayar = toNum(d?.belumDibayar, Math.max(0, totalGaji - totalDibayar));

  return { period, totalGaji, totalDibayar, belumDibayar };
}

/* ========================= API: SUMMARY (USER) ========================= */

/** GET /api/gaji/me/summary (USER) – normalisasi bentuk apapun ke shape konsisten */
export async function getGajiMeSummary(api: AxiosInstance): Promise<GajiMeSummary> {
  const res = await api.get("/api/gaji/me/summary");
  const raw = unwrap<any>(res.data);

  const username = String(raw?.username ?? "");
  const totalJam = toNum(raw?.totalJam ?? raw?.jam);
  const gajiPerJam = toNum(raw?.gajiPerJam ?? raw?.rate ?? raw?.upahPerJam);
  const upahKeseluruhan = toNum(raw?.upahKeseluruhan ?? raw?.totalGaji ?? raw?.totalUpah);
  const totalDiterima = toNum(raw?.totalDiterima ?? raw?.totalDibayar ?? raw?.sudahDibayar ?? raw?.paid);

  // jika BE tidak kasih atau kasih 0 default, tetap hitung dari selisih
  const sisaFromServer = toNum(raw?.belumDibayar ?? raw?.sisa ?? raw?.remaining, NaN);
  const computedRemaining = Math.max(0, upahKeseluruhan - totalDiterima);
  const belumDibayar =
    Number.isFinite(sisaFromServer) ? Math.max(computedRemaining, sisaFromServer) : computedRemaining;

  return {
    username,
    totalJam,
    gajiPerJam,
    upahKeseluruhan,
    totalDiterima,
    belumDibayar,
  };
}
