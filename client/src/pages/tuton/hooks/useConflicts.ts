import { useEffect, useState } from "react";
import { listConflicts, type ConflictGroupResponse } from "../../../services/tuton.service";

const norm = (s: string) => (s || "").trim().replace(/\s+/g, " ").toUpperCase();

/** Ambil daftar nama matkul yang terdeteksi konflik (duplicate) dari API. */
export function useMatkulConflicts() {
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const groups: ConflictGroupResponse[] = await listConflicts();
        const names = groups
          .filter((g) => (g?.matkul || "").trim().length > 0 && (g?.total ?? 0) > 1)
          .map((g) => g.matkul);
        if (alive) setConflicts(new Set(names.map(norm))); // Set BARU (immutable)
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Gagal memuat konflik");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { conflicts, loading, err };
}
