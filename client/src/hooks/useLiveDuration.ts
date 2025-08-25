import { useEffect, useMemo, useRef, useState } from "react";

type Status = "AKTIF" | "JEDA" | "TIDAK_AKTIF";

/**
 * Hitung durasi live:
 * - accumulatedSeconds: akumulasi dari server (TANPA delta segmen aktif)
 * - startedAt: ISO dari segmen aktif (null saat JEDA/TIDAK_AKTIF)
 * - serverNow: ISO waktu server saat fetch (opsional)
 *
 * Perbedaan penting: kita RESET tick setiap kali status/startedAt berubah,
 * agar tidak membawa "sisa detik" dari sesi sebelumnya.
 */
export function useLiveDuration(params: {
  status: Status;
  accumulatedSeconds: number;
  startedAt?: string | null;
  serverNow?: string | null;
}) {
  const { status, accumulatedSeconds, startedAt, serverNow } = params;

  // offset awal = selisih (serverNow - startedAt) saat ini aktif
  const initialOffset = useMemo(() => {
    if (status !== "AKTIF" || !startedAt) return 0;
    const startMs = new Date(startedAt).getTime();
    const nowMs = serverNow ? new Date(serverNow).getTime() : Date.now();
    return Math.max(0, Math.floor((nowMs - startMs) / 1000));
  }, [status, startedAt, serverNow]);

  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastMsRef = useRef<number>(0);

  // 🔁 Mulai/stop loop tiap kali status atau startedAt berubah
  useEffect(() => {
    // Selalu reset tick ketika status/startedAt berubah
    setTick(0);

    // Hanya jalan kalau AKTIF
    if (status !== "AKTIF" || !startedAt) return;

    lastMsRef.current = performance.now();
    const loop = (t: number) => {
      const delta = t - lastMsRef.current;
      if (delta >= 250) {
        setTick((s) => s + delta);
        lastMsRef.current = t;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onVis = () => { lastMsRef.current = performance.now(); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [status, startedAt]);

  // total detik live
  const liveSeconds = useMemo(() => {
    if (status !== "AKTIF") return accumulatedSeconds; // beku saat JEDA/TIDAK_AKTIF
    const extra = Math.floor(tick / 1000);
    return accumulatedSeconds + initialOffset + extra;
  }, [status, accumulatedSeconds, initialOffset, tick]);

  return liveSeconds;
}
