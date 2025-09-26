import { JamKerja } from "../../generated/prisma";

export interface StartJamKerjaRequest {
  username: string;
}

export interface JamKerjaHistoryQuery {
  username: string;
}

export interface JamKerjaResponse {
  id: number;
  username: string;
  jamMulai: Date;
  jamSelesai: Date | null;
  totalJam: number;
  status: "AKTIF" | "JEDA" | "SELESAI";
  tanggal: Date;
}

export function toJamKerjaResponse(data: JamKerja): JamKerjaResponse {
  return {
    id: data.id,
    username: data.username,
    tanggal: data.tanggal,
    jamMulai: data.jamMulai,
    jamSelesai: data.jamSelesai,
    totalJam: data.totalJam,
    status: data.status as "AKTIF" | "JEDA" | "SELESAI",
  };
}

export interface RekapJamKerjaQuery {
  username: string;
  period: "minggu" | "bulan";
}

export interface RekapJamKerjaResponse {
  username: string;
  totalJam: number;
  periode: "minggu" | "bulan";
}

export function toRekapJamKerjaResponse(
  username: string,
  totalJam: number,
  periode: "minggu" | "bulan"
): RekapJamKerjaResponse {
  return {
    username,
    totalJam: parseFloat(totalJam.toFixed(2)),
    periode,
  };
}

export interface JamKerjaAktifQuery {
  username: string;
  period?: "minggu" | "bulan";
}

export interface JamKerjaAktifResponse {
  id: number;
  username: string;
  jamMulai: Date;
  status: "AKTIF";
}

export function toJamKerjaAktifResponse(data: JamKerja): JamKerjaAktifResponse {
  return {
    id: data.id,
    username: data.username,
    jamMulai: data.jamMulai,
    status: "AKTIF",
  };
}

/** ======== OWNER summary ======== */

export type PeriodKey = "hari" | "minggu" | "bulan" | "semua";

export interface RangeTotals {
  totalJam: number;
  totalGaji: number;
}

export interface UserPeriodTotals {
  hari: RangeTotals;
  minggu: RangeTotals;
  bulan: RangeTotals;
  semua: RangeTotals;
}

export type StatusSaatIni = "AKTIF" | "JEDA" | "OFF" | "SELESAI";

export interface OwnerUserSummary {
  username: string;
  status: StatusSaatIni;
  sesiTerakhir?: {
    id: number;
    jamMulai: Date;
    jamSelesai: Date | null;
    status: "AKTIF" | "JEDA" | "SELESAI";
  } | null;
  totals: UserPeriodTotals;
}

export interface OwnerSummaryResponse {
  generatedAt: Date;
  counts: {
    users: number;
    aktif: number;
    jeda: number;
  };
  users: OwnerUserSummary[];
}

export interface UpdateJamKerjaRequest {
  jamMulai?: string | Date;
  jamSelesai?: string | Date | null;
  status?: "AKTIF" | "JEDA" | "SELESAI";
  /** default true: hitung ulang totalJam & adjust agregat user secara delta */
  recalcGaji?: boolean;
}