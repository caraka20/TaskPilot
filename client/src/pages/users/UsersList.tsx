import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";

import { useApi } from "../../hooks/useApi";
import { getOwnerSummary, type OwnerSummary } from "../../services/jamKerja.service";
import { listUsers } from "../../services/users.service";
import { useAuthStore } from "../../store/auth.store";
import { resolveBackendAssetUrl } from "../../utils/media";

import StatsStrip from "./components/StatsStrip";
import UserListHeader from "./components/UserListHeader";
import UserListTable from "./components/UserListTable";
import UserListToolbar from "./components/UserListToolbar";
import type { RangeKey, RowItem } from "./components/userlist.types";

export default function UsersList() {
  const api = useApi();
  const { role, baseUrl } = useAuthStore();

  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RangeKey>("TODAY");
  const [countAktif, setCountAktif] = useState(0);
  const [countJeda, setCountJeda] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);

      const [summary, profiles] = await Promise.all([
        getOwnerSummary(api),
        listUsers(api),
      ]);
      const typedSummary: OwnerSummary = summary;
      const profileByUsername = new Map((profiles ?? []).map((profile) => [profile.username, profile]));

      setCountAktif(Number(typedSummary?.counts?.aktif ?? 0));
      setCountJeda(Number(typedSummary?.counts?.jeda ?? 0));

      const mapped: RowItem[] = (typedSummary.users ?? []).map((user) => {
        const profile = profileByUsername.get(user.username);
        return {
          username: user.username,
          namaLengkap: profile?.namaLengkap || user.username,
          role: profile?.role,
          avatarUrl: resolveBackendAssetUrl(profile?.avatarUrl, baseUrl) ?? null,
          accountIsActive: profile?.isActive !== false,
          canViewCustomerBilling: Boolean(profile?.canViewCustomerBilling),
          statusNow: user.status,
          isActive: user.status === "AKTIF",
          totalJamHariIni: Number(user?.totals?.hari?.totalJam ?? 0),
          totalGajiHariIni: Number(user?.totals?.hari?.totalGaji ?? 0),
          totalJamMingguIni: Number(user?.totals?.minggu?.totalJam ?? 0),
          totalGajiMingguIni: Number(user?.totals?.minggu?.totalGaji ?? 0),
          totalJamBulanIni: Number(user?.totals?.bulan?.totalJam ?? 0),
          totalGajiBulanIni: Number(user?.totals?.bulan?.totalGaji ?? 0),
          totalJamSemua: Number(user?.totals?.semua?.totalJam ?? 0),
          totalGajiSemua: Number(user?.totals?.semua?.totalGaji ?? 0),
        };
      });

      setRows(mapped);
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : "Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  }, [api, baseUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((user) =>
      [user.username, user.namaLengkap, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [rows, search]);

  return (
    <div data-workspace-page className="space-y-5 pb-8">
      <UserListHeader
        role={role}
        countUsers={rows.length}
        countAktif={countAktif}
        countJeda={countJeda}
        loading={loading}
        onRefresh={() => void load()}
      />

      <section className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]">
        <UserListToolbar
          search={search}
          onSearchChange={setSearch}
          range={range}
          onRangeChange={setRange}
        />

        <StatsStrip users={filtered} range={range} />

        <div className="border-t border-default-200/70">
          {loading ? (
            <div className="grid min-h-64 place-items-center py-16" role="status">
              <Spinner label="Memuat data pengguna…" color="primary" />
            </div>
          ) : err ? (
            <div className="px-5 py-16 text-center" role="alert">
              <p className="font-bold text-danger">Data pengguna tidak dapat dimuat</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-foreground-500">{err}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <UserListTable rows={filtered} range={range} />
          )}
        </div>
      </section>
    </div>
  );
}
