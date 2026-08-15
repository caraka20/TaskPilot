// client/src/pages/customers/hooks/useCustomerDetail.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../../store/auth.store";
import {
  addCustomerPayment,
  settleCustomerPayment,
  updateInvoiceTotal,
  getCustomerById,
  getTutonSummary,
} from "../../../services/customer.service";
import {
  getKarilDetail,
  upsertKarilDetail,
  type KarilDetail as KarilDetailType,
  type UpsertKarilPayload,
} from "../../../services/karil.service";
import {
  getMetodePenelitianDetail,
  upsertMetodePenelitianDetail,
  type MetodePenelitianDetail,
  type MetodePenelitianPayload,
} from "../../../services/metodePenelitian.service";
import type {
  CustomerDetail as DetailType,
  CustomerLayanan,
} from "../../../utils/customer";
import { closeAlert, showApiError, showLoading, showSuccess, showToast } from "../../../utils/alert";

function withDerived(k: any) {
  const done = [k.tugas1, k.tugas2, k.tugas3, k.tugas4].filter(Boolean).length;
  return { ...k, totalTasks: 4, doneTasks: done, progress: done / 4 };
}

export function useCustomerDetail(idNum: number) {
  const isOwner = useAuthStore((s) => s.role === "OWNER");

  const [data, setData] = useState<DetailType | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [karil, setKaril] = useState<KarilDetailType | null>(null);
  const [metodePenelitian, setMetodePenelitian] = useState<MetodePenelitianDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKaril, setSavingKaril] = useState(false);
  const [savingMetodePenelitian, setSavingMetodePenelitian] = useState(false);

  // ✅ guard agar tidak setState setelah unmount
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!Number.isFinite(idNum)) return;
    if (isMounted.current) setLoading(true);
    try {
      const d = await getCustomerById(idNum);
      if (!isMounted.current) return;
      setData(d);

      const layanan = new Set(
        d.layanan?.length
          ? d.layanan
          : [d.jenis]
      );
      const [kd, md, s] = await Promise.all([
        layanan.has("KARIL") ? getKarilDetail(idNum).catch(() => null) : Promise.resolve(null),
        layanan.has("METODE_PENELITIAN")
          ? getMetodePenelitianDetail(idNum).catch(() => null)
          : Promise.resolve(null),
        layanan.has("TUTON") ? getTutonSummary(idNum).catch(() => null) : Promise.resolve(null),
      ]);
      if (!isMounted.current) return;
      setKaril(kd);
      setMetodePenelitian(md);
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
  const layanan = useMemo<CustomerLayanan[]>(() => {
    if (data?.layanan?.length) return data.layanan;
    if (jenisNormalized === "TUTON" || jenisNormalized === "KARIL") {
      return [jenisNormalized];
    }
    return [];
  }, [data?.layanan, jenisNormalized]);
  const isKarilLike = layanan.includes("KARIL");
  const isMetodePenelitian = layanan.includes("METODE_PENELITIAN");
  const karilLabel = "KARIL" as const;
  const showTutonMatrix = layanan.includes("TUTON");

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

  const settlePayment = useCallback(async () => {
    showLoading("Mencatat pelunasan...")
    try {
      await settleCustomerPayment(idNum)
      closeAlert()
      await showSuccess("Customer sudah lunas")
      await refresh()
    } catch (error) {
      closeAlert()
      await showApiError(error)
    }
  }, [idNum, refresh])

  const updateInvoice = useCallback(async (totalBayar: number) => {
    showLoading("Memperbarui nilai tagihan...")
    try {
      await updateInvoiceTotal(idNum, { totalBayar })
      closeAlert()
      await showSuccess("Nilai tagihan diperbarui")
      await refresh()
    } catch (error) {
      closeAlert()
      await showApiError(error)
    }
  }, [idNum, refresh])

  const saveKaril = useCallback(
    async (payload: UpsertKarilPayload) => {
      setSavingKaril(true);
      try {
        const saved = await upsertKarilDetail(idNum, payload);
        if (!saved) throw new Error("Server tidak mengembalikan data KARIL yang tersimpan.");
        if (isMounted.current) setKaril(withDerived(saved));
        void showToast(`${karilLabel} berhasil disimpan`);
        return true;
      } catch (e) {
        void showApiError(e);
        return false;
      } finally {
        if (isMounted.current) setSavingKaril(false);
      }
    },
    [idNum, karilLabel]
  );

  const saveMetodePenelitian = useCallback(
    async (payload: MetodePenelitianPayload) => {
      setSavingMetodePenelitian(true);
      try {
        const saved = await upsertMetodePenelitianDetail(idNum, payload);
        if (!saved) throw new Error("Server tidak mengembalikan data Metode Penelitian yang tersimpan.");
        if (isMounted.current) setMetodePenelitian(withDerived(saved));
        void showToast("Metode Penelitian berhasil disimpan");
        return true;
      } catch (error) {
        void showApiError(error);
        return false;
      } finally {
        if (isMounted.current) setSavingMetodePenelitian(false);
      }
    },
    [idNum]
  );

  return {
    // state
    loading,
    data,
    summary,
    karil,
    metodePenelitian,
    savingKaril,
    savingMetodePenelitian,
    isOwner,

    // derived
    jenisNormalized,
    isKarilLike,
    isMetodePenelitian,
    karilLabel,
    showTutonMatrix,
    singleCourseId,

    // actions
    addPayment,
    settlePayment,
    updateInvoice,
    saveKaril,
    saveMetodePenelitian,
    refresh,
  };
}
