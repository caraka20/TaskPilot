// client/src/pages/customers/components/matrix/useConflictIds.ts
import { useEffect, useState } from "react";
import { listConflicts, type ConflictGroupResponse } from "../../../services/tuton.service";

let cachedConflictIds: Set<number> | null = null;

export function useConflictIds() {
  const [ids, setIds] = useState<Set<number>>(cachedConflictIds ?? new Set());
  const [loading, setLoading] = useState(!cachedConflictIds);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const groups: ConflictGroupResponse[] = await listConflicts();
        const dupeIds: number[] = [];

        for (const g of groups) {
          for (const c of g.customers || []) {
            if (c.isDuplicate) dupeIds.push(c.courseId);
          }
        }

        const newSet = new Set(dupeIds);
        cachedConflictIds = newSet; // ✅ cache hasil ke variabel global

        if (alive) {
          setIds(newSet);
          setErr(null);
        }
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Gagal memuat conflict ids");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { conflictIds: ids, loading, err };
}
