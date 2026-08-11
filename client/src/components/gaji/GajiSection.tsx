import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useAuthStore } from "../../store/auth.store";
import { getGajiMe, getGajiMeSummary, type GajiItem, type Paginated, type GajiMeSummary } from "../../services/gaji.service";
import { getUserSummary } from "../../services/jamKerja.service";
import GajiSummaryCard from "./GajiSummaryCard";
import GajiPaymentsTable from "./GajiPaymentsTable";
import { pickNum, toNum, PAGE_SIZE } from "./helpers";

export default function GajiSection() {
  const api = useApi();
  const { username } = useAuthStore();

  // list (tabel)
  const [loadingList, setLoadingList] = useState(false);
  const [rows, setRows] = useState<GajiItem[]>([]);
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // summary
  const [loadingSum, setLoadingSum] = useState(false);
  const [sum, setSum] = useState<GajiMeSummary | null>(null);
  const [upahKeseluruhan, setUpahKeseluruhan] = useState<number>(0);

  const fetchSummary = useCallback(async () => {
    if (!username) return;
    setLoadingSum(true);
    try {
      const s = await getGajiMeSummary(api).catch(() => null);
      setSum(s ?? null);

      const us = await getUserSummary(api, username).catch(() => null as any);
      setUpahKeseluruhan(toNum(us?.totals?.semua?.totalGaji));
    } finally {
      setLoadingSum(false);
    }
  }, [api, username]);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res: Paginated<GajiItem> = await getGajiMe(api, { page, limit, sort: "desc" });
      setRows(res.items ?? []);
      const totalAll = toNum(res?.pagination?.total);
      setTotal(totalAll);
      setTotalPages(res?.pagination?.totalPages ?? Math.max(1, Math.ceil(totalAll / limit)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat gaji");
    } finally {
      setLoadingList(false);
    }
  }, [api, page, limit]);

  useEffect(() => { void fetchSummary(); }, [fetchSummary]);
  useEffect(() => { void fetchList(); }, [fetchList]);

  // Derive angka ringkasan
  const totalDiterima: number = useMemo(() => {
    const fromSummary = pickNum(sum, ["totalDiterima", "totalDibayar", "totalBayar", "totalPaid", "sudahDibayar"], NaN);
    if (Number.isFinite(fromSummary)) return fromSummary;
    return (rows ?? []).reduce((a, r) => a + toNum(r.jumlahBayar), 0);
  }, [sum, rows]);

  const belumDibayar: number = useMemo(() => {
    const fromSummary = pickNum(sum, ["belumDibayar", "sisa", "remaining"], NaN);
    if (Number.isFinite(fromSummary)) return Math.max(0, fromSummary);
    return Math.max(0, toNum(upahKeseluruhan) - toNum(totalDiterima));
  }, [sum, upahKeseluruhan, totalDiterima]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <GajiSummaryCard
        upahKeseluruhan={upahKeseluruhan}
        totalDiterima={totalDiterima}
        belumDibayar={belumDibayar}
        loading={loadingSum}
      />
      <GajiPaymentsTable
        rows={rows}
        total={total}
        page={page}
        totalPages={totalPages}
        loading={loadingList}
        error={error}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
}
