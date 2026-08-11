// Helpers kecil biar bisa dipakai lintas komponen
export const PAGE_SIZE = 8;

export const toNum = (x: any) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

/** Ambil angka valid pertama dari beberapa alias properti */
export function pickNum(obj: any, keys: string[], def = 0): number {
  if (!obj || typeof obj !== "object") return def;
  for (const k of keys) {
    if (k in obj) {
      const v = toNum((obj as any)[k]);
      if (Number.isFinite(v)) return v;
    }
  }
  return def;
}

export const fmtTanggalHari = (d: string | Date) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
