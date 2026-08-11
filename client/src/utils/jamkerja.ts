// utils/jamkerja.ts
export function ymdLocalStr(x?: string | Date | null) {
  if (!x) return "";
  const d = typeof x === "string" ? new Date(x) : x;
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

/**
 * Hitung detik akumulasi untuk HARI LOKAL yang sama:
 *  - jumlah total segmen SELESAI pada hari tsb
 *  - + baseline dari segmen OPEN (AKTIF/JEDA): pakai totalJam existing (tanpa delta live)
 *  - startedAt diisi HANYA jika status AKTIF → hook yang menambahkan delta live
 */
export function computeRunningSecondsAndStart(rows: Array<any>) {
  if (!Array.isArray(rows)) return { seconds: 0, startedAt: null as string | null };

  // segmen open (jamSelesai null) & terbaru sbg fallback
  const open = rows.find((r) => r && r.jamSelesai == null) ?? null;
  const latest = open ?? rows[0] ?? null;

  const basisHari = ymdLocalStr(open?.jamMulai ?? new Date());

  const selesaiTodaySec = rows
    .filter((r) => r?.jamSelesai != null && ymdLocalStr(r?.jamMulai) === basisHari)
    .reduce((acc, r) => acc + Math.max(0, Math.round(((r.totalJam ?? 0) as number) * 3600)), 0);

  const openBaselineSec = open ? Math.max(0, Math.round(((open.totalJam ?? 0) as number) * 3600)) : 0;

  const seconds = selesaiTodaySec + openBaselineSec;

  const status = latest?.status as "AKTIF" | "JEDA" | "SELESAI" | undefined;
  const startedAt = status === "AKTIF" ? (open?.jamMulai ?? null) : null;

  return { seconds, startedAt };
}
