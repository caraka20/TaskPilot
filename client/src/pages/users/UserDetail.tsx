// client/src/pages/users/UserDetail.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Spinner } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

import { useApi } from "../../hooks/useApi";
import { useAuthStore } from "../../store/auth.store";

import {
  getUserDetail,
  setJedaOtomatis,
  type UserDetail,
} from "../../services/users.service";
import {
  getKonfigurasi,
  deleteOverrideKonfigurasi,
  type Konfigurasi,
} from "../../services/konfigurasi.service";

import {
  getUserSummary,
  type OwnerUserSummary,
} from "../../services/jamKerja.service";

// Komponen
import UserHeader from "./components/UserHeader";
import KendaliJamKerjaCard from "./components/KendaliJamKerjaCard";
import SummaryCards from "./components/SummaryCards";
import GajiSummary from "./components/GajiSummary";
import WorkHistory from "./components/WorkHistory";
import UserIdentityCard from "./components/UserIdentityCard";

import type { WorkStatus } from "./components/WorkStatusBadge";

/* ---------- helper aman untuk ambil status dari berbagai bentuk API ---------- */
function resolveWorkStatus(d: UserDetail | null): WorkStatus {
  const direct = (d as any)?.status;
  if (typeof direct === "string") return direct as WorkStatus;
  const latest = (d as any)?.jamKerja?.[0];
  const st = latest?.status;
  if (typeof st === "string") return st as WorkStatus;
  return "OFF";
}

export default function UserDetailPage() {
  const { username = "" } = useParams();
  const api = useApi();
  const { role } = useAuthStore();

  const [data, setData] = useState<UserDetail | null>(null);
  const [summary, setSummary] = useState<OwnerUserSummary | null>(null);
  const [globalCfg, setGlobalCfg] = useState<Konfigurasi | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fmtHours = useCallback(
    (n: number) => (Math.round(n * 10) / 10).toFixed(1),
    []
  );
  const fmtRupiah = useCallback(
    (n: number) =>
      `Rp. ${new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
      }).format(n)}`,
    []
  );

  async function load() {
    if (!username) return;
    setLoading(true);
    setErr(null);
    try {
      const [d, cfg, s] = await Promise.all([
        getUserDetail(api, username),
        role === "OWNER" ? getKonfigurasi(api) : Promise.resolve(null),
        getUserSummary(api, username),
      ]);
      setData(d);
      if (cfg) setGlobalCfg(cfg);
      setSummary(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memuat detail";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, role]);

  async function onToggleJeda(next: boolean) {
    if (!data) return;
    setSaving(true);
    try {
      const res = await setJedaOtomatis(api, data.username, next);
      setData((s) => (s ? { ...s, jedaOtomatis: res.jedaOtomatis } : s));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function onUseGlobalDefault() {
    if (!data) return;
    setSaving(true);
    try {
      await deleteOverrideKonfigurasi(api, data.username);
      setData((s) => (s ? { ...s, jedaOtomatis: undefined } : s));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menghapus override");
    } finally {
      setSaving(false);
    }
  }

  const resolvedJeda = useMemo(() => {
    if (!data) return false;
    if (data.jedaOtomatis !== undefined) return !!data.jedaOtomatis;
    return !!globalCfg?.jedaOtomatisAktif;
  }, [data, globalCfg]);

  const canSeeJeda = role === "OWNER" || data?.jedaOtomatis !== undefined;
  const hasOverride = data?.jedaOtomatis !== undefined;

  const currentStatus = useMemo<WorkStatus>(() => resolveWorkStatus(data), [data]);

  // Konsistensi angka dari summary
  const totalsAll = summary?.totals?.semua;

  // === FIX: SummaryCards butuh { today, week, month } ===
  const miniStats = useMemo(
    () => ({
      today: fmtHours(summary?.totals?.hari?.totalJam ?? 0),
      week: fmtHours(summary?.totals?.minggu?.totalJam ?? 0),
      month: fmtHours(summary?.totals?.bulan?.totalJam ?? 0),
    }),
    [summary, fmtHours]
  );

  // angka untuk kartu identitas (total sepanjang waktu)
  const identityTotalJam =
    totalsAll ? `${fmtHours(totalsAll.totalJam)} jam`
    : data ? `${fmtHours((data.totalJamKerja as any) ?? 0)} jam`
    : "0.0 jam";

  const identityTotalGaji =
    totalsAll ? fmtRupiah(totalsAll.totalGaji)
    : data ? fmtRupiah((data.totalGaji as any) ?? 0)
    : "Rp. 0";

  // total gaji diterima (riwayat)
  const totalDiterima = useMemo(() => {
    if (!Array.isArray(data?.riwayatGaji)) return 0;
    return data!.riwayatGaji.reduce(
      (acc, r) => acc + (Number((r as any).jumlahBayar) || 0),
      0
    );
  }, [data]);

  return (
    <div className="p-4 space-y-5">
      <Button
        as={Link}
        to="/users"
        variant="flat"
        startContent={<ArrowLeft className="h-4 w-4" />}
        className="mb-1"
      >
        Kembali
      </Button>

      {loading ? (
        <div className="py-16 grid place-items-center">
          <Spinner label="Memuat detail..." color="primary" />
        </div>
      ) : err ? (
        <div className="text-center py-12">
          <p className="text-danger font-semibold">{err}</p>
          <Button
            as={Link}
            to="/users"
            variant="flat"
            startContent={<ArrowLeft className="h-4 w-4" />}
            className="mt-4"
          >
            Kembali ke Users
          </Button>
        </div>
      ) : !data ? (
        <div className="text-center py-12">
          <p className="text-foreground-600">Data tidak ditemukan</p>
          <Button
            as={Link}
            to="/users"
            variant="flat"
            startContent={<ArrowLeft className="h-4 w-4" />}
            className="mt-4"
          >
            Kembali ke Users
          </Button>
        </div>
      ) : (
        <>
          {/* === DETAIL PENGGUNA — PALING ATAS === */}
          <UserIdentityCard
            namaLengkap={data.namaLengkap}
            username={data.username}
            role={data.role}
            status={currentStatus}
            totalJam={identityTotalJam}
            totalGaji={identityTotalGaji}
          />

          {/* Header (switch jeda otomatis, dsb) */}
          <UserHeader
            data={data}
            role={role}
            currentStatus={currentStatus}
            canSeeJeda={canSeeJeda}
            hasOverride={hasOverride}
            resolvedJeda={resolvedJeda}
            globalCfg={globalCfg}
            saving={saving}
            onToggleJeda={onToggleJeda}
            onUseGlobalDefault={onUseGlobalDefault}
          />

          {/* Kendali jam kerja (SELF vs OWNER) */}
          <KendaliJamKerjaCard
            username={data.username}
            onChanged={load}
            userDetail={data}
          />

          {/* Ringkasan kecil (Hari/Minggu/Bulan) */}
          <SummaryCards stats={miniStats} />

          {/* Gaji: kartu elegan + filter periode */}
          <GajiSummary
            username={data.username}
            namaLengkap={data.namaLengkap}
            summary={summary}
            totalDiterima={totalDiterima}
          />

          {/* Histori jam kerja + filter + pagination */}
          <WorkHistory
            items={(data.jamKerja as any) ?? []}
            serverNow={(data as any)?.serverNow ?? null}
            title="Histori Jam Kerja"
          />
        </>
      )}
    </div>
  );
}
