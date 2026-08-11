// client/src/services/users.service.ts
import type { AxiosInstance } from "axios";
import type { ApiEnvelope } from "../lib/types";

export type UserListItem = {
  username: string;
  namaLengkap: string;
  role: "USER" | "OWNER";
  totalJamKerja: number;
  totalGaji: number;
};

export type RegisterUserBody = {
  username: string;
  password: string;
  namaLengkap: string;
};

export type RegisterUserResponse = {
  username: string;
  namaLengkap: string;
  role: "USER" | "OWNER";
};

/** Ringkasan minimal biar lint aman (kalau nanti butuh lengkap tinggal diperluas) */
export type JamKerjaBrief = {
  id?: number;
  tanggal?: string | Date;
  totalJam?: number;
};
export type TugasBrief = {
  id?: number;
  jenis?: string;
  status?: string;
};
export type RiwayatGajiBrief = {
  id?: number;
  tanggalBayar?: string | Date;
  jumlahBayar?: number;
};

export type UserDetail = {
  username: string;
  namaLengkap: string;
  role: "USER" | "OWNER";
  totalJamKerja: number;
  totalGaji: number;
  jedaOtomatis?: boolean; // ← opsional
  jamKerja: JamKerjaBrief[];
  tugas: TugasBrief[];
  riwayatGaji: RiwayatGajiBrief[];
};

/** ─────────────── existing APIs ─────────────── */

export async function registerUser(api: AxiosInstance, body: RegisterUserBody) {
  const { data } = await api.post<ApiEnvelope<RegisterUserResponse>>("/api/users/register", body);
  return data.data;
}

export async function listUsers(api: AxiosInstance) {
  const { data } = await api.get<ApiEnvelope<UserListItem[]>>("/api/users");
  return data.data;
}

export async function getUserDetail(api: AxiosInstance, username: string) {
  const { data } = await api.get<ApiEnvelope<UserDetail>>(`/api/users/${encodeURIComponent(username)}`);
  return data.data;
}

export async function setJedaOtomatis(api: AxiosInstance, username: string, aktif: boolean) {
  const { data } = await api.patch<ApiEnvelope<{ username: string; jedaOtomatis: boolean }>>(
    `/api/users/${encodeURIComponent(username)}/jeda-otomatis`,
    { aktif }
  );
  return data.data;
}

export async function logout(api: AxiosInstance) {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>("/api/users/logout");
  return data.data;
}

/** ─────────────── added APIs (baru) ─────────────── */

/** Profil user saat ini (berdasarkan token) */
export type MeResponse = {
  username: string;
  namaLengkap: string;
  role: "USER" | "OWNER";
};

export async function getMe(api: AxiosInstance) {
  const { data } = await api.get<ApiEnvelope<MeResponse>>("/api/users/me");
  return data.data;
}

/* ==== BARU: /api/users/:username/everything ==== */

export type StatusSaatIni = "AKTIF" | "JEDA" | "SELESAI" | "OFF";

export type JamKerjaItem = {
  id: number;
  username: string;
  jamMulai: string;            // ISO string
  jamSelesai: string | null;   // ISO string | null
  totalJam: number;
  status: "AKTIF" | "JEDA" | "SELESAI";
};

export type UserEverythingResponse = {
  profile: {
    username: string;
    namaLengkap: string;
    role: "OWNER" | "USER";
    createdAt: string;
    updatedAt: string;
    totals: { totalJamKerja: number; totalGaji: number };
  };
  konfigurasi: {
    gajiPerJam: number;
    batasJedaMenit: number;
    jedaOtomatisAktif: boolean;
    source: "override" | "global";
    updatedAt?: string;
  };
  jamKerja: {
    latestStatus: StatusSaatIni;
    activeSessionId: number | null;
    today: { items: JamKerjaItem[]; total: number };
    summary: {
      hari: { totalJam: number; totalGaji: number };
      minggu: { totalJam: number; totalGaji: number };
      bulan: { totalJam: number; totalGaji: number };
      semua: { totalJam: number; totalGaji: number };
    };
    history: {
      items: JamKerjaItem[];
      page: number;
      perPage: number;
      total: number;
      range?: { from?: string; to?: string };
    };
  };
  gaji: {
    gajiPerJam: number;
    summary: {
      totalJam: number;
      upahKeseluruhan: number;
      totalDiterima: number;
      belumDibayar: number;
    };
    riwayat: {
      items: Array<{ id: number; jumlahBayar: number; tanggalBayar: string; catatan?: string | null }>;
      page: number;
      perPage: number;
      total: number;
    };
  };
  tugas: Array<{
    id: number;
    deskripsi: string;
    jenisTugas: string;
    status: string;
    waktuSelesai: string | null;
    customer: { id: number; namaCustomer: string; nim: string; jurusan: string };
  }>;
};

export type UserEverythingQuery = Partial<{
  from: string;     // ISO date string (YYYY-MM-DD atau full ISO)
  to: string;       // ISO date string
  histPage: number;
  histLimit: number;
  payPage: number;
  payLimit: number;
}>;

export async function getUserEverything(
  api: AxiosInstance,
  username: string,
  params?: UserEverythingQuery
) {
  const { data } = await api.get<ApiEnvelope<UserEverythingResponse>>(
    `/api/users/${encodeURIComponent(username)}/everything`,
    { params }
  );
  return data.data;
}
