// client/src/services/public.tuton.service.ts
import type { AxiosInstance } from "axios";
import type { ApiEnvelope } from "../lib/types";

// ====== Types dari BE (disederhanakan sesuai response) ======

export type PublicItemView = {
  jenis: "DISKUSI" | "TUGAS" | "ABSEN";
  sesi: number;
  status: string;                 // contoh: "SELESAI" | "BELUM" | dll
  nilai?: number | null;
  selesaiAt?: string | null;
  deskripsi?: string | null;
  copasSoal?: boolean;            // FE akan tampilkan sebagai "proses"
};

export type PublicCourseView = {
  courseId: number;
  matkul: string;
  items: {
    DISKUSI: PublicItemView[];
    TUGAS: PublicItemView[];
    ABSEN: PublicItemView[];
  };
  totalItems: number;
  completedItems: number;
  progress: number;               // 0..1 (PERHATIKAN: ini bukan %)
  createdAt?: string;
  updatedAt?: string;
};

export type PublicCustomerSelfViewResponse = {
  nim: string;
  namaCustomer: string;
  jurusan: string;
  jenis: string;                  // JenisUT (string di FE sudah cukup)
  totalCourses: number;
  totalItems: number;
  totalCompleted: number;
  overallProgress: number;        // 0..1
  courses: PublicCourseView[];
};

// ====== Service function ======

/**
 * Ambil laporan publik TUTON berdasarkan NIM (tanpa auth).
 * BE membungkus response dalam ApiEnvelope { status, data }.
 */
export async function getPublicTutonByNim(
  api: AxiosInstance,
  nim: string
): Promise<PublicCustomerSelfViewResponse> {
  const url = `/api/public/customers/${encodeURIComponent(nim)}/tuton`;
  const { data } = await api.get<ApiEnvelope<PublicCustomerSelfViewResponse>>(url);
  return data.data;
}
