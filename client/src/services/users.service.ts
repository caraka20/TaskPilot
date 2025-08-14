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
  jedaOtomatis?: boolean;    // ← opsional
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
