// client/src/pages/customers/hooks/useCustomerDetail.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../../store/auth.store";
import {
  addCustomerPayment,
  getCustomerById,
  getTutonSummary,
} from "../../../services/customer.service";
import {
  getKarilDetail,
  upsertKarilDetail,
  type KarilDetail as KarilDetailType,
  type UpsertKarilPayload,
} from "../../../services/karil.service";
import type { CustomerDetail as DetailType } from "../../../utils/customer";
import { closeAlert, showApiError, showLoading, showSuccess } from "../../../utils/alert";

function withDerived(k: any) {
  const done = [k.tugas1, k.tugas2, k.tugas3, k.tugas4].filter(Boolean).length;
  return { ...k, totalTasks: 4, doneTasks: done, progress: done / 4 };
}

export function useCustomerDetail(idNum: number) {
  const isOwner = useAuthStore((s) => s.role === "OWNER");

  const [data, setData] = useState<DetailType | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [karil, setKaril] = useState<KarilDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKaril, setSavingKaril] = useState(false);

  // ✅ guard agar tidak setState setelah unmount
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    if (isMounted.current) setLoading(true);
    try {
      const d = await getCustomerById(idNum);
      if (!isMounted.current) return;
      setData(d);

      try {
        const kd = await getKarilDetail(idNum);
        if (!isMounted.current) return;
        setKaril(kd ?? null);
      } catch {
        if (!isMounted.current) return;
        setKaril(null);
      }

      const s = await getTutonSummary(idNum);
      if (!isMounted.current) return;
      setSummary(s);
    } catch (e) {
      if (!isMounted.current) return;
      await showApiError(e);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [idNum]);

  useEffect(() => {
    isMounted.current = true;
    refresh();
    return () => {
      isMounted.current = false;
    };
  }, [refresh]);

  // ===== Derived flags =====
  const jenisNormalized = useMemo(
    () => String(data?.jenis ?? "").trim().toUpperCase(),
    [data?.jenis]
  );
  const isKarilLike = jenisNormalized === "KARIL" || jenisNormalized === "TK";
  const karilLabel: "KARIL" | "TK" = jenisNormalized === "TK" ? "TK" : "KARIL";
  const showTutonMatrix = jenisNormalized === "TUTON" || jenisNormalized === "TK";

  const courses: Array<any> = useMemo(() => {
    if (Array.isArray(summary?.courses)) return summary.courses;
    if (Array.isArray(summary)) return summary;
    return [];
  }, [summary]);

  const singleCourseId = useMemo(() => {
    if (courses.length !== 1) return null;
    const c = courses[0] ?? null;
    return c ? (c.courseId ?? c.id ?? null) : null;
  }, [courses]);

  // ===== Actions =====
  const addPayment = useCallback(
    async (payload: { amount: number; catatan?: string; tanggalBayar?: string }) => {
      showLoading("Mencatat pembayaran...");
      try {
        await addCustomerPayment(idNum, payload);
        closeAlert();
        await showSuccess("Pembayaran tercatat");
        await refresh();
      } catch (e) {
        closeAlert();
        await showApiError(e);
      }
    },
    [idNum, refresh]
  );

  const saveKaril = useCallback(
    async (payload: UpsertKarilPayload) => {
      setSavingKaril(true);
      showLoading(`Menyimpan ${karilLabel}…`);
      try {
        const optimisticBase = karil ?? {
          customerId: idNum,
          judul: payload.judul ?? "",
          tugas1: !!payload.tugas1,
          tugas2: !!payload.tugas2,
          tugas3: !!payload.tugas3,
          tugas4: !!payload.tugas4,
          keterangan: payload.keterangan ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const optimistic = withDerived({ ...optimisticBase, ...payload });
        if (isMounted.current) setKaril(optimistic);

        await upsertKarilDetail(idNum, payload);
        closeAlert();
        await showSuccess(`${karilLabel} tersimpan`);

        // refresh data terbaru
        await refresh();
      } catch (e) {
        closeAlert();
        await showApiError(e);
      } finally {
        if (isMounted.current) setSavingKaril(false);
      }
    },
    [idNum, karil, karilLabel, refresh]
  );

  return {
    // state
    loading,
    data,
    summary,
    karil,
    savingKaril,
    isOwner,

    // derived
    jenisNormalized,
    isKarilLike,
    karilLabel,
    showTutonMatrix,
    singleCourseId,

    // actions
    addPayment,
    saveKaril,
    refresh,
  };
}
