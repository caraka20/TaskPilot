import type { AxiosInstance } from "axios";
import type { ApiEnvelope } from "../lib/types";

export type Konfigurasi = {
  gajiPerJam: number;
  batasJedaMenit: number;
  jedaOtomatisAktif: boolean;
};

// OWNER only
export async function getKonfigurasi(api: AxiosInstance) {
  const { data } = await api.get<ApiEnvelope<Konfigurasi>>("/api/konfigurasi");
  return data.data;
}

// OWNER or USER (effective untuk user yang sedang login)
// (Tidak dipakai di UserDetail OWNER melihat user lain, tapi disediakan kalau kamu butuh)
export async function getKonfigurasiEffective(api: AxiosInstance) {
  const { data } = await api.get<ApiEnvelope<Konfigurasi>>("/api/konfigurasi/effective");
  return data.data;
}

// OWNER only — set override untuk user (pakai subset dari Konfigurasi)
export async function putOverrideKonfigurasi(
  api: AxiosInstance,
  username: string,
  body: Partial<Konfigurasi>
) {
  const { data } = await api.put<ApiEnvelope<Konfigurasi>>(
    `/api/konfigurasi/override/${encodeURIComponent(username)}`,
    body
  );
  return data.data;
}

// OWNER only — hapus override user, kembali ke default global
export async function deleteOverrideKonfigurasi(api: AxiosInstance, username: string) {
  const { data } = await api.delete<ApiEnvelope<{ ok: true }>>(
    `/api/konfigurasi/override/${encodeURIComponent(username)}`
  );
  return data.data;
}
