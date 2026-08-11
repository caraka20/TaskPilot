// Konstanta kolom & helper
export const SESSIONS = [
  { key: "D1", label: "D1", sesi: 1 },
  { key: "D2", label: "D2", sesi: 2 },
  { key: "T1", label: "T1", sesi: 3, tugas: true },
  { key: "D4", label: "D4", sesi: 4 },
  { key: "T2", label: "T2", sesi: 5, tugas: true },
  { key: "D6", label: "D6", sesi: 6 },
  { key: "T3", label: "T3", sesi: 7, tugas: true },
  { key: "D8", label: "D8", sesi: 8 },
] as const;

export const isDiskusi = (s: number) => [1, 2, 4, 6, 8].includes(s);
export const isTugas = (s: number) => s === 3 || s === 5 || s === 7;
