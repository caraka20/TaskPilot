import httpClient from "../lib/httpClient";

async function apiGet<T>(url: string, params?: any): Promise<T> {
  const res = await httpClient.get(url, { params });
  return res.data?.data as T;
}

async function apiPut<T, B>(url: string, body: B): Promise<T> {
  console.log("[karil.service] PUT", url, "payload:", body);
  const res = await httpClient.put(url, body);
  console.log("[karil.service] response:", res.status, res.data);
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
  progress?: "all" | "complete" | "incomplete";
  sortBy?: "updatedAt" | "createdAt" | "namaCustomer" | "nim";
  sortDir?: "asc" | "desc";
};

export type KarilListItem = {
  id: number;
  customerId: number;
  namaCustomer: string;
  nim: string;
  jurusan: string;
  judul: string;
  tugas1: boolean;
  tugas2: boolean;
  tugas3: boolean;
  tugas4: boolean;
  totalTasks: number;
  doneTasks: number;
  progress: number;
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KarilDetail = KarilListItem;

export type KarilListResponse = {
  items: KarilListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function listKaril(params: KarilListParams) {
  return apiGet<KarilListResponse>("/api/karil", params);
}

export function getKarilDetail(customerId: number | string) {
  return apiGet<KarilDetail>(`/api/customers/${customerId}/karil`);
}

export function upsertKarilDetail(customerId: number | string, payload: UpsertKarilPayload) {
  return apiPut<KarilDetail, UpsertKarilPayload>(`/api/customers/${customerId}/karil`, payload);
}
