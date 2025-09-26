import { useEffect, useState } from "react";
import { listConflicts, type ConflictGroupResponse } from "../../../services/tuton.service";

/** Ambil Set courseId yang DUPLIKAT (bukan entry pertama). */
export function useConflictIds() {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const groups: ConflictGroupResponse[] = await listConflicts();
        const dupeIds: number[] = [];
        for (const g of groups) {
          for (const c of g.customers || []) {
            if (c.isDuplicate) dupeIds.push(c.courseId);
          }
        }
        if (alive) setIds(new Set(dupeIds)); // penting: Set baru (immutable)
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Gagal memuat conflict ids");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { conflictIds: ids, loading, err };
}
