import { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { useApi } from "../../hooks/useApi";
import { useAuthStore } from "../../store/auth.store";
import { getOwnerSummary, type OwnerSummary } from "../../services/jamKerja.service";

import UserListHeader from "./components/UserListHeader";
import UserListToolbar from "./components/UserListToolbar";
import UserListTable from "./components/UserListTable";
import StatsStrip from "./components/StatsStrip";
import type { RangeKey, RowItem } from "./components/userlist.types";

export default function UsersList() {
  const api = useApi();
  const { role } = useAuthStore();

  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RangeKey>("TODAY");

  // header counts dari API
  const [countAktif, setCountAktif] = useState(0);
  const [countJeda, setCountJeda] = useState(0);

  // ---- Fetch summary OWNER
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

      // ↓ pastikan summary bertipe OwnerSummary
      const summary: OwnerSummary = await getOwnerSummary(api);

      // header counts (aman pakai optional-chaining)
      setCountAktif(Number(summary?.counts?.aktif ?? 0));
      setCountJeda(Number(summary?.counts?.jeda ?? 0));

      // map users → rows
      const mapped: RowItem[] = (summary.users ?? []).map(
        (u: OwnerSummary["users"][number]) => ({
          username: u.username,
          statusNow: u.status,
          isActive: u.status === "AKTIF",

          totalJamHariIni:   Number(u?.totals?.hari?.totalJam   ?? 0),
          totalGajiHariIni:  Number(u?.totals?.hari?.totalGaji  ?? 0),

          totalJamMingguIni: Number(u?.totals?.minggu?.totalJam ?? 0),
          totalGajiMingguIni:Number(u?.totals?.minggu?.totalGaji?? 0),

          totalJamBulanIni:  Number(u?.totals?.bulan?.totalJam  ?? 0),
          totalGajiBulanIni: Number(u?.totals?.bulan?.totalGaji ?? 0),

          totalJamSemua:     Number(u?.totals?.semua?.totalJam  ?? 0),
          totalGajiSemua:    Number(u?.totals?.semua?.totalGaji ?? 0),
        })
      );
      setRows(mapped);

      } catch (e) {
        setErr(e instanceof Error ? e.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  // ---- Filter pencarian
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) => u.username.toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 px-2 py-4 sm:space-y-5 sm:px-4 lg:px-6">
      {/* Header */}
      <UserListHeader role={role} countAktif={countAktif} countJeda={countJeda} />

      {/* Search + Range */}
      <UserListToolbar
        search={search}
        onSearchChange={setSearch}
        range={range}
        onRangeChange={setRange}
      />

      {/* Aggregate stats (indah & ringkas) */}
      <StatsStrip users={filtered} range={range} />

      {/* Table */}
      <Card
        shadow="sm"
        className="overflow-hidden rounded-2xl border border-default-200/80 bg-content1"
      >
        <CardBody className="p-0">
          {loading ? (
            <div className="grid min-h-52 place-items-center py-14" role="status">
              <Spinner label="Memuat ringkasan..." color="primary" />
            </div>
          ) : err ? (
            <div className="space-y-2 px-4 py-12 text-center" role="alert">
              <p className="text-danger font-semibold">Gagal memuat data</p>
              <p className="text-foreground-500 text-sm">{err}</p>
            </div>
          ) : (
            <UserListTable rows={filtered} range={range} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
