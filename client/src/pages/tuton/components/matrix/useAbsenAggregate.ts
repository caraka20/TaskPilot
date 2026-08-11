import type { Pair } from "./types";

/** hitung target label header absen per sesi dari pairs yang ada */
export function computeAbsenHeaderMode(pairsByCourse: Record<number, Pair[]>) {
  const mode: Record<number, "SELESAI" | "BELUM"> = {};
  for (let sesi = 1; sesi <= 8; sesi++) {
    let total = 0, done = 0;
    for (const arr of Object.values(pairsByCourse)) {
      const p = (arr as Pair[]).find((x) => x.sesi === sesi);
      if (p?.absen) {
        total++;
        if (String(p.absen.status) === "SELESAI") done++;
      }
    }
    // jika semua absen sudah SELESAI ⇒ tampilkan "SELESAI"; kalau tidak ⇒ "BELUM"
    mode[sesi] = total > 0 && done === total ? "SELESAI" : "BELUM";
  }
  return mode;
}
