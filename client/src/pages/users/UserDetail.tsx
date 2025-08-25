// client/src/pages/users/UserDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Chip,
  Divider,
  Spinner,
  Switch,
  Button,
  Tooltip,
} from "@heroui/react";
import { ArrowLeft, ShieldCheck, User as UserIcon, Pause, Play, Undo2 } from "lucide-react";

import { useApi } from "../../hooks/useApi";
import { useAuthStore } from "../../store/auth.store";

import { getUserDetail, setJedaOtomatis, type UserDetail } from "../../services/users.service";
import { getKonfigurasi, deleteOverrideKonfigurasi, type Konfigurasi } from "../../services/konfigurasi.service";

import WorkStatusChip from "../../components/jam-kerja/WorkStatusChip";
// import GajiPerJamCard from "../../components/jam-kerja/GajiPerJamCard";
import JamControlsComp from "../../components/jam-kerja/JamControls";
const JamControls = JamControlsComp as any;

// ---------- helper aman untuk ambil status ----------
type WorkStatus = "AKTIF" | "JEDA" | "SELESAI" | "OFF";
function resolveWorkStatus(d: UserDetail | null): WorkStatus {
  // beberapa API mungkin menaruh langsung: data.status
  const direct = (d as any)?.status;
  if (typeof direct === "string") return direct as WorkStatus;

  // fallback: dari entri jamKerja terbaru (tipenya mungkin JamKerjaBrief tanpa 'status')
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
  const [globalCfg, setGlobalCfg] = useState<Konfigurasi | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [d, cfg] = await Promise.all([
        getUserDetail(api, username),
        role === "OWNER" ? getKonfigurasi(api) : Promise.resolve(null),
      ]);
      setData(d);
      if (cfg) setGlobalCfg(cfg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memuat detail";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (username) void load();
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

  const fmtHours = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  const fmtRupiah = (n: number) =>
    `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n)}`;

  const resolvedJeda = useMemo(() => {
    if (!data) return false;
    if (data.jedaOtomatis !== undefined) return !!data.jedaOtomatis;
    return !!globalCfg?.jedaOtomatisAktif;
  }, [data, globalCfg]);

  const canSeeJeda = role === "OWNER" || data?.jedaOtomatis !== undefined;
  const hasOverride = data?.jedaOtomatis !== undefined;

  // ✅ sekarang aman & tidak bentrok tipe
  const currentStatus = useMemo<WorkStatus>(() => resolveWorkStatus(data), [data]);

  const stats = useMemo(
    () => ({
      jam: data ? fmtHours(data.totalJamKerja) : "0.0",
      gaji: data ? fmtRupiah(data.totalGaji) : "Rp. 0",
      nJamKerja: data && Array.isArray(data.jamKerja) ? data.jamKerja.length : 0,
      nTugas: data && Array.isArray(data.tugas) ? data.tugas.length : 0,
      nGaji: data && Array.isArray(data.riwayatGaji) ? data.riwayatGaji.length : 0,
    }),
    [data]
  );

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
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 grid place-items-center shadow-md">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {data.namaLengkap}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Chip size="sm" variant="flat" className="font-mono">
                    {data.username}
                  </Chip>
                  <Chip
                    size="sm"
                    color={data.role === "OWNER" ? "primary" : "secondary"}
                    variant="flat"
                    startContent={<ShieldCheck className="h-3.5 w-3.5" />}
                  >
                    {data.role}
                  </Chip>

                  <WorkStatusChip status={currentStatus as any} />

                  {canSeeJeda && (
                    <Chip
                      size="sm"
                      color={hasOverride ? "warning" : "success"}
                      variant="flat"
                      className="ml-1"
                    >
                      {hasOverride ? "Override" : "Default (Global)"}
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {canSeeJeda && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground-500">
                  Jeda Otomatis
                  {!hasOverride && typeof globalCfg?.jedaOtomatisAktif !== "undefined" && (
                    <span className="ml-2 text-foreground-400">
                      (Global: {globalCfg?.jedaOtomatisAktif ? "Aktif" : "Nonaktif"})
                    </span>
                  )}
                </span>

                <Tooltip
                  content={
                    role !== "OWNER"
                      ? "Hanya OWNER yang dapat mengubah"
                      : resolvedJeda
                      ? "Nonaktifkan jeda otomatis"
                      : "Aktifkan jeda otomatis"
                  }
                >
                  <Switch
                    isDisabled={role !== "OWNER" || saving}
                    isSelected={resolvedJeda}
                    onValueChange={(v) => void onToggleJeda(v)}
                    color="primary"
                  >
                    <span className="inline-flex items-center gap-1">
                      {resolvedJeda ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {resolvedJeda ? "Aktif" : "Nonaktif"}
                    </span>
                  </Switch>
                </Tooltip>

                {role === "OWNER" && hasOverride && (
                  <Tooltip content="Hapus override & pakai default global">
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<Undo2 className="h-4 w-4" />}
                      onPress={() => void onUseGlobalDefault()}
                      isLoading={saving}
                    >
                      Gunakan Default Global
                    </Button>
                  </Tooltip>
                )}
              </div>
            )}
          </div>

          {/* <GajiPerJamCard username={data.username} className="mt-2" /> */}

          {/* Kendali Jam Kerja */}
          <Card shadow="sm" className="border border-default-100">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-foreground-500">Kendali Jam Kerja</div>
                <Chip size="sm" variant="flat" className="font-mono">{data.username}</Chip>
              </div>
              <JamControls
                username={data.username}
                onChanged={() => void load()}
              />
            </CardBody>
          </Card>

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card shadow="sm" className="border border-default-100">
              <CardBody className="p-4">
                <p className="text-sm text-foreground-500">Total Jam Kerja</p>
                <p className="text-2xl font-extrabold tracking-tight tabular-nums">
                  {data ? fmtHours(data.totalJamKerja) : "0.0"}
                  <span className="text-sm font-medium text-foreground-500"> jam</span>
                </p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="border border-default-100">
              <CardBody className="p-4">
                <p className="text-sm text-foreground-500">Total Gaji</p>
                <p className="text-2xl font-extrabold tracking-tight tabular-nums">
                  {data ? fmtRupiah(data.totalGaji) : "Rp. 0"}
                </p>
              </CardBody>
            </Card>
            <Card shadow="sm" className="border border-default-100">
              <CardBody className="p-4">
                <p className="text-sm text-foreground-500">Ringkasan Entri</p>
                <div className="mt-1 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-foreground-500">Jam Kerja</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {data && Array.isArray(data.jamKerja) ? data.jamKerja.length : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500">Tugas</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {data && Array.isArray(data.tugas) ? data.tugas.length : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500">Riwayat Gaji</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {data && Array.isArray(data.riwayatGaji) ? data.riwayatGaji.length : 0}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Detail blocks */}
          <Card className="mt-2" shadow="sm">
            <CardBody>
              <h2 className="font-semibold">Detail Pengguna</h2>
              <Divider className="my-3" />
              <div className="grid gap-3 text-sm">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-3 text-foreground-500">Nama Lengkap</div>
                  <div className="col-span-12 sm:col-span-9 font-medium">{data.namaLengkap}</div>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-3 text-foreground-500">Username</div>
                  <div className="col-span-12 sm:col-span-9 font-mono">{data.username}</div>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-3 text-foreground-500">Role</div>
                  <div className="col-span-12 sm:col-span-9">
                    <Chip size="sm" color={data.role === "OWNER" ? "primary" : "secondary"} variant="flat">
                      {data.role}
                    </Chip>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-3 text-foreground-500">Total Jam Kerja</div>
                  <div className="col-span-12 sm:col-span-9 tabular-nums">
                    {data ? fmtHours(data.totalJamKerja) : "0.0"} jam
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-3 text-foreground-500">Total Gaji</div>
                  <div className="col-span-12 sm:col-span-9 font-semibold tabular-nums">
                    {data ? fmtRupiah(data.totalGaji) : "Rp. 0"}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
