// src/utils/format.ts
export const numberID = new Intl.NumberFormat("id-ID")

export const currencyIDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

export const dtID = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function toHMS(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "-"
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}

export function fmtDate(d: Date | string | number) {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d
  return dtID.format(date)
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Monday=0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  d.setHours(0, 0, 0, 0)
  return d
}

// === Tambahan utils (tempel di paling bawah file ini) ===

// Normalisasi ke objek Date
function _asDate(d: Date | string | number) {
  return typeof d === "string" || typeof d === "number" ? new Date(d) : d;
}

// Mulai hari lokal (00:00:00.000)
export function startOfDay(date: Date | string | number = new Date()) {
  const d = new Date(_asDate(date));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Akhir hari lokal (23:59:59.999)
export function endOfDay(date: Date | string | number = new Date()) {
  const d = new Date(_asDate(date));
  d.setHours(23, 59, 59, 999);
  return d;
}

// Akhir minggu lokal (Senin–Minggu), konsisten dengan startOfWeek() kamu
export function endOfWeek(date: Date | string | number = new Date()) {
  const start = startOfWeek(_asDate(date)); // Monday = 0 (sesuai util kamu)
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Akhir bulan lokal (hari terakhir, 23:59:59.999)
export function endOfMonth(date: Date | string | number = new Date()) {
  const d0 = _asDate(date);
  const end = new Date(d0.getFullYear(), d0.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Konversi detik → jam desimal (mis. 3660s → 1.02 jam)
export function secondsToHours(seconds: number, fractionDigits = 2) {
  if (!Number.isFinite(seconds)) return 0;
  const hours = seconds / 3600;
  return Number(hours.toFixed(fractionDigits));
}

// Konversi jam desimal → detik (mis. 1.5 jam → 5400s)
export function hoursToSeconds(hours: number) {
  if (!Number.isFinite(hours)) return 0;
  return Math.max(0, Math.floor(hours * 3600));
}

// Format HH:MM (tanpa detik) dari total detik
export function toHM(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "-";
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

// Cek apakah dua tanggal berada di hari kalender lokal yang sama
export function isSameLocalDay(a: Date | string | number, b: Date | string | number) {
  const da = _asDate(a), db = _asDate(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
