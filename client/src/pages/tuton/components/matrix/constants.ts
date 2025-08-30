export const SESSIONS = [
  { key: "D1", label: "D1", sesi: 1 },
  { key: "D2", label: "D2", sesi: 2 },
  { key: "D3T1", label: "D3 & T1", sesi: 3, tugas: true },
  { key: "D4", label: "D4", sesi: 4 },
  { key: "D5T2", label: "D5 & T2", sesi: 5, tugas: true },
  { key: "D6", label: "D6", sesi: 6 },
  { key: "D7T3", label: "D7 & T3", sesi: 7, tugas: true },
  { key: "D8", label: "D8", sesi: 8 },
] as const;

export const isTugas = (sesi: number) => sesi === 3 || sesi === 5 || sesi === 7;
