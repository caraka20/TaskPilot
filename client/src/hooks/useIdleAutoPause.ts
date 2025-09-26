// client/src/hooks/useIdleAutoPause.ts
import { useEffect, useRef } from "react";

type Params = {
  status: "AKTIF" | "JEDA" | "TIDAK_AKTIF";
  activeSessionId?: number | null;
  /** Batas idle dari DB (detik). <=0 untuk menonaktifkan */
  idleLimitSec: number;
  /** Dipanggil saat harus auto-pause */
  onAutoPause: (sessionId: number) => Promise<void> | void;
  /** Nama channel broadcast (opsional) */
  channelName?: string;
};

/**
 * Auto-pause ketika idle >= idleLimitSec.
 * - Reset timer saat ada aktivitas (pointer/keyboard/scroll/focus) + event kustom "tuton:activity".
 * - Sinkron lintas tab via BroadcastChannel dan localStorage event.
 */
export function useIdleAutoPause({
  status,
  activeSessionId,
  idleLimitSec,
  onAutoPause,
  channelName = "work-activity",
}: Params) {
  const lastActRef = useRef<number>(Date.now());
  const pausingRef = useRef(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const touch = (at = Date.now()) => {
    lastActRef.current = at;
    try { localStorage.setItem("wk:lastActivity", String(at)); } catch {}
    try { bcRef.current?.postMessage({ t: "act", at }); } catch {}
  };

  useEffect(() => {
    if (!idleLimitSec || idleLimitSec <= 0) return; // nonaktif
    const bc = new BroadcastChannel(channelName);
    bcRef.current = bc;

    const onBC = (e: MessageEvent) => {
      if (e?.data?.t === "act" && typeof e.data.at === "number") {
        if (e.data.at > lastActRef.current) lastActRef.current = e.data.at;
      }
    };
    bc.addEventListener("message", onBC);

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "wk:lastActivity" && ev.newValue) {
        const at = Number(ev.newValue);
        if (!Number.isNaN(at) && at > lastActRef.current) lastActRef.current = at;
      }
    };
    window.addEventListener("storage", onStorage);

    const bump = () => touch();
    const events = ["pointerdown", "keydown", "scroll", "mousemove", "touchstart", "focus"];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));

    const onCustom = () => touch();
    window.addEventListener("tuton:activity", onCustom as EventListener);

    // cek tiap 3 detik
    const iv = window.setInterval(async () => {
      if (status !== "AKTIF") { pausingRef.current = false; return; }
      if (!activeSessionId)   { pausingRef.current = false; return; }
      if (pausingRef.current) return;

      const idleSec = Math.floor((Date.now() - lastActRef.current) / 1000);
      if (idleSec >= idleLimitSec) {
        pausingRef.current = true;
        try { await onAutoPause(activeSessionId); } finally { /* tunggu status eksternal berubah */ }
      }
    }, 3000);

    // seed awal
    touch();

    return () => {
      window.clearInterval(iv);
      events.forEach((ev) => window.removeEventListener(ev, bump));
      window.removeEventListener("tuton:activity", onCustom as EventListener);
      window.removeEventListener("storage", onStorage);
      try { bc.removeEventListener("message", onBC); bc.close(); } catch {}
      bcRef.current = null;
    };
  }, [status, activeSessionId, idleLimitSec, onAutoPause, channelName]);
}
