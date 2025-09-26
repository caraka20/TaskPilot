// client/src/App.tsx
import { useEffect } from "react";
import AppRouter from "./app/routes/AppRouter";

import { initWorkActivityAutoStart } from "./utils/workActivity";
import { useWorkStore } from "./store/work.store";
import { useAuthStore } from "./store/auth.store";
import { useApi } from "./hooks/useApi";

import {
  startJamKerja,
  resumeJamKerja,
  listJamKerja,
  deriveStatusAndActiveId,
  type JamKerjaRow,
} from "./services/jamKerja.service";

export default function App() {
  const api = useApi();

  useEffect(() => {
    // ===== State lokal (tanpa re-render)
    const getState = () => {
      try {
        const s: any = useWorkStore.getState?.() || {};
        const status = (s.status ?? "TIDAK_AKTIF") as "AKTIF" | "JEDA" | "TIDAK_AKTIF";
        const activeSessionId =
          "activeSessionId" in s ? (s.activeSessionId as number | null | undefined) ?? null : null;
        const resumeTargetId =
          "resumeTargetId" in s ? (s.resumeTargetId as number | null | undefined) ?? null : null;
        return { status, activeSessionId, resumeTargetId };
      } catch {
        return { status: "TIDAK_AKTIF" as const, activeSessionId: null, resumeTargetId: null };
      }
    };

    // ===== State fresh (server) — penting untuk deteksi JEDA
    const getFreshState = async () => {
      try {
        const username = (useAuthStore.getState?.() as any)?.username;
        if (!username) return getState();

        const rows: JamKerjaRow[] = await listJamKerja(api, username);
        const { status, activeSessionId } = deriveStatusAndActiveId(rows);
        const latest = rows?.[0];

        // Map OFF -> TIDAK_AKTIF
        const mapped = (status === "OFF" ? "TIDAK_AKTIF" : (status as any)) as
          | "AKTIF"
          | "JEDA"
          | "TIDAK_AKTIF";

        // Saat JEDA: gunakan latest.id jika ada (baik jeda open/closed)
        const resumeTargetId =
          mapped === "JEDA" ? (latest?.id ?? activeSessionId ?? null) : null;

        return { status: mapped, activeSessionId: activeSessionId ?? null, resumeTargetId };
      } catch {
        return getState();
      }
    };

    // ===== Callers ke server
    const startNow = async () => {
      const res = await startJamKerja(api);
      if (res.status !== "success") throw new Error(res.message || "Gagal mulai");
    };
    const resumeNow = async (id: number) => {
      const res = await resumeJamKerja(api, id);
      if (res.status !== "success") throw new Error(res.message || "Gagal lanjutkan");
    };

    const cleanup = initWorkActivityAutoStart(startNow, resumeNow, getState, getFreshState);
    return cleanup;
  }, [api]);

  return <AppRouter />;
}
