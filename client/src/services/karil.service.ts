// client/src/services/karil.service.ts
import httpClient from "../lib/httpClient";

// Mini helpers mengikuti pola response API kamu (data di field "data")
async function apiGet<T>(url: string, params?: any): Promise<T> {
  const res = await httpClient.get(url, { params });
  return res.data?.data as T;
}
async function apiPut<T, B>(url: string, body: B): Promise<T> {
  const res = await httpClient.put(url, body);
  return res.data?.data as T;
}

export type UpsertKarilPayload = {
  judul: string;
  tugas1?: boolean;
  tugas2?: boolean;
  tugas3?: boolean;
  tugas4?: boolean;
  keterangan?: string | null;
};

export type KarilListParams = {
  q?: string;
  page?: number;
  limit?: number;
  /** "all" (default), "complete" (semua tugas true), "incomplete" */
  progress?: "all" | "complete" | "incomplete";
  sortBy?: "updatedAt" | "createdAt" | "namaCustomer" | "nim";
  sortDir?: "asc" | "desc";
};

export type KarilListItem = {
  id: number;                 // karilDetail.id
  customerId: number;
  namaCustomer: string;
  nim: string;
  jurusan: string;
  judul: string;
  tugas1: boolean;
  tugas2: boolean;
  tugas3: boolean;
  tugas4: boolean;
  totalTasks: number;         // 4
  doneTasks: number;          // 0..4
  progress: number;           // 0..1 (server-computed)
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Alias untuk detail agar import di komponen tetap mulus */
export type KarilDetail = KarilListItem;

export type KarilListResponse = {
  items: KarilListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

/** GET /api/karil  (list & filter) */
export function listKaril(params: KarilListParams) {
  return apiGet<KarilListResponse>("/api/karil", params);
}

/** GET /api/customers/:id/karil  (detail per-customer) */
export function getKarilDetail(customerId: number | string) {
  return apiGet<KarilDetail>(`/api/customers/${customerId}/karil`);
}

/** PUT /api/customers/:id/karil  (upsert) */
export function upsertKarilDetail(customerId: number | string, payload: UpsertKarilPayload) {
  return apiPut<KarilDetail, UpsertKarilPayload>(`/api/customers/${customerId}/karil`, payload);
}
