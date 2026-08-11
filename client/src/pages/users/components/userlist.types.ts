// Types & konstanta yang dipakai lintas komponen (nilai NON-komponen taruh di sini)
export type RangeKey = "TODAY" | "WEEK" | "MONTH" | "ALL";

export const RANGE_LABEL: Record<RangeKey, string> = {
  TODAY: "Hari ini",
  WEEK: "Minggu ini",
  MONTH: "Bulan ini",
  ALL: "Semua",
};

export type RowItem = {
  username: string;
  statusNow: "AKTIF" | "JEDA" | "SELESAI" | "OFF" | string;
  isActive: boolean;

  totalJamHariIni: number;   totalGajiHariIni: number;
  totalJamMingguIni: number; totalGajiMingguIni: number;
  totalJamBulanIni: number;  totalGajiBulanIni: number;
  totalJamSemua: number;     totalGajiSemua: number;
};
