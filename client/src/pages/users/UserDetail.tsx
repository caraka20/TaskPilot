import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Switch } from "@heroui/react";
import { Activity, Banknote, BookOpenCheck, Eye, Save, Settings2, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import StatePanel from "../../components/common/StatePanel";
import { useApi } from "../../hooks/useApi";
import { deleteOverrideKonfigurasi, getKonfigurasi, type Konfigurasi } from "../../services/konfigurasi.service";
import { getUserSummary, type OwnerUserSummary } from "../../services/jamKerja.service";
import {
  getUserDetail,
  setCustomerBillingAccess,
  setTutonWorkExemption,
  setJedaOtomatis,
  setDailyRate,
  setUserActive,
  type UserDetail,
} from "../../services/users.service";
import { useAuthStore } from "../../store/auth.store";
import { resolveBackendAssetUrl } from "../../utils/media";
import { showApiError, showConfirm, showSuccess } from "../../utils/alert";

import KendaliJamKerjaCard from "./components/KendaliJamKerjaCard";
import SummaryCards from "./components/SummaryCards";
import UserHeader from "./components/UserHeader";
import UserIdentityCard from "./components/UserIdentityCard";
import UserPayrollBreakdown from "./components/UserPayrollBreakdown";
import WorkHistory from "./components/WorkHistory";
import type { WorkStatus } from "./components/WorkStatusBadge";

function resolveWorkStatus(detail: UserDetail | null): WorkStatus {
  const direct = (detail as any)?.status;
  if (typeof direct === "string") return direct as WorkStatus;
  const latest = (detail as any)?.jamKerja?.[0];
  return typeof latest?.status === "string" ? latest.status as WorkStatus : "OFF";
}

export default function UserDetailPage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const api = useApi();
  const { role, baseUrl } = useAuthStore();

  const [data, setData] = useState<UserDetail | null>(null);
  const [summary, setSummary] = useState<OwnerUserSummary | null>(null);
  const [globalCfg, setGlobalCfg] = useState<Konfigurasi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBillingAccess, setSavingBillingAccess] = useState(false);
  const [savingTutonAccess, setSavingTutonAccess] = useState(false);
  const [savingActive, setSavingActive] = useState(false);
  const [savingDailyRate, setSavingDailyRate] = useState(false);
  const [dailyRateInput, setDailyRateInput] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const formatHours = useCallback((value: number) => (Math.round(value * 10) / 10).toFixed(1), []);
  const formatRupiah = useCallback(
    (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value),
    []
  );

  const load = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!username) return;
    if (!options.silent) setLoading(true);
    setErr(null);
    try {
      const [detail, configuration, userSummary] = await Promise.all([
        getUserDetail(api, username),
        role === "OWNER" ? getKonfigurasi(api) : Promise.resolve(null),
        getUserSummary(api, username),
      ]);
      setData(detail);
      setDailyRateInput(String(Number(detail.dailyRate ?? 0)));
      if (configuration) setGlobalCfg(configuration);
      setSummary(userSummary);
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : "Gagal memuat detail pengguna.");
    } finally {
      if (!options.silent) setLoading(false);
    }
  }, [api, role, username]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggleJeda(next: boolean) {
    if (!data) return;
    setSaving(true);
    try {
      const result = await setJedaOtomatis(api, data.username, next);
      setData((current) => current ? { ...current, jedaOtomatis: result.jedaOtomatis } : current);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Gagal menyimpan konfigurasi jeda.");
    } finally {
      setSaving(false);
    }
  }

  async function onUseGlobalDefault() {
    if (!data) return;
    setSaving(true);
    try {
      await deleteOverrideKonfigurasi(api, data.username);
      setData((current) => current ? { ...current, jedaOtomatis: undefined } : current);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Gagal menghapus override.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggleBillingAccess(next: boolean) {
    if (!data) return;
    setSavingBillingAccess(true);
    try {
      const result = await setCustomerBillingAccess(api, data.username, next);
      setData((current) => current ? { ...current, canViewCustomerBilling: result.canViewCustomerBilling } : current);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Gagal memperbarui hak akses.");
    } finally {
      setSavingBillingAccess(false);
    }
  }

  async function onToggleTutonWorkExemption(next: boolean) {
    if (!data) return;
    setSavingTutonAccess(true);
    try {
      const result = await setTutonWorkExemption(api, data.username, next);
      setData((current) => current
        ? { ...current, canEditTutonWithoutWork: result.canEditTutonWithoutWork }
        : current);
      await showSuccess(
        next ? "Pengecualian diaktifkan" : "Kewajiban jam kerja diaktifkan",
        next
          ? `${data.namaLengkap} sekarang dapat mengubah Tuton tanpa memulai jam kerja.`
          : `${data.namaLengkap} harus memulai jam kerja sebelum mengubah Tuton.`,
      );
    } catch (cause) {
      await showApiError(cause);
    } finally {
      setSavingTutonAccess(false);
    }
  }

  async function onToggleActive(next: boolean) {
    if (!data) return;
    setSavingActive(true);
    try {
      const result = await setUserActive(api, data.username, next);
      setData((current) => current ? { ...current, isActive: result.isActive && !result.deletedAt } : current);
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : "Gagal memperbarui status akun.");
    } finally {
      setSavingActive(false);
    }
  }

  async function onSaveDailyRate() {
    if (!data) return;
    const nextRate = Number(dailyRateInput);
    if (!Number.isFinite(nextRate) || nextRate <= 0) {
      await showApiError(new Error("Tarif harian harus lebih dari Rp0."));
      return;
    }

    const confirmation = await showConfirm({
      title: "Simpan tarif harian?",
      text: `${data.namaLengkap} akan memakai tarif ${formatRupiah(nextRate)} untuk pekerjaan Harian berikutnya. Riwayat lama tidak berubah.`,
      confirmText: "Ya, simpan tarif",
      tone: "primary",
    });
    if (!confirmation.isConfirmed) return;

    setSavingDailyRate(true);
    try {
      const result = await setDailyRate(api, data.id, nextRate);
      setData((current) => current ? { ...current, dailyRate: result.dailyRate } : current);
      setDailyRateInput(String(result.dailyRate));
      await showSuccess(
        "Tarif harian tersimpan",
        `${formatRupiah(result.dailyRate)} akan berlaku untuk pekerjaan Harian berikutnya.`,
      );
    } catch (cause) {
      await showApiError(cause);
    } finally {
      setSavingDailyRate(false);
    }
  }

  const resolvedJeda = useMemo(() => {
    if (!data) return false;
    if (data.jedaOtomatis !== undefined) return Boolean(data.jedaOtomatis);
    return Boolean(globalCfg?.jedaOtomatisAktif);
  }, [data, globalCfg]);

  const canSeeJeda = role === "OWNER" || data?.jedaOtomatis !== undefined;
  const hasOverride = data?.jedaOtomatis !== undefined;
  const currentStatus = useMemo<WorkStatus>(() => resolveWorkStatus(data), [data]);
  const totalsAll = summary?.totals?.semua;
  const miniStats = useMemo(
    () => ({
      today: formatHours(summary?.totals?.hari?.totalJam ?? 0),
      week: formatHours(summary?.totals?.minggu?.totalJam ?? 0),
      month: formatHours(summary?.totals?.bulan?.totalJam ?? 0),
    }),
    [formatHours, summary]
  );

  const identityTotalJam = totalsAll
    ? `${formatHours(totalsAll.totalJam)} jam`
    : data
      ? `${formatHours((data.totalJamKerja as any) ?? 0)} jam`
      : "0.0 jam";
  const identityTotalGaji = data?.unifiedPayroll
    ? formatRupiah(data.unifiedPayroll.totalEarned)
    : totalsAll
      ? formatRupiah(totalsAll.totalGaji)
      : data
        ? formatRupiah((data.totalGaji as any) ?? 0)
        : formatRupiah(0);

  if (loading) {
    return <StatePanel kind="loading" title="Memuat profil user" description="Menyiapkan detail aktivitas, akses, dan payroll…" />;
  }

  if (err) {
    return (
      <StatePanel
        kind="error"
        title="Profil tidak dapat dimuat"
        description={err}
        actionLabel="Kembali ke daftar user"
        onAction={() => navigate("/users")}
      />
    );
  }

  if (!data) {
    return (
      <StatePanel
        title="User tidak ditemukan"
        description="Data user yang diminta tidak tersedia atau sudah dihapus."
        actionLabel="Kembali ke daftar user"
        onAction={() => navigate("/users")}
      />
    );
  }

  const ownerCanManage = role === "OWNER" && data.role !== "OWNER";

  return (
    <div data-workspace-page className="space-y-5 pb-8">
      <UserIdentityCard
        namaLengkap={data.namaLengkap}
        username={data.username}
        role={data.role}
        status={currentStatus}
        totalJam={identityTotalJam}
        totalGaji={identityTotalGaji}
        avatarUrl={resolveBackendAssetUrl(data.avatarUrl, baseUrl) ?? null}
        accountActive={data.isActive}
        billingAccess={data.canViewCustomerBilling}
      />

      <section className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]" aria-labelledby="user-access-title">
        <div className="flex items-start gap-3 border-b border-default-200/70 px-5 py-5 sm:px-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Settings2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Kontrol user</p>
            <h2 id="user-access-title" className="mt-0.5 text-lg font-bold text-foreground">Akses &amp; konfigurasi kerja</h2>
            <p className="mt-1 text-sm leading-6 text-foreground-500">Kelola status akun, hak akses customer, serta kebijakan jeda dari satu panel.</p>
          </div>
        </div>

        {ownerCanManage && (
          <div className="grid divide-y divide-default-200/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${data.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"}`}>
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-bold text-foreground">Status akun</p>
                  <p className="mt-1 text-xs leading-5 text-foreground-500">Atur akses login tanpa menghapus histori user.</p>
                </div>
              </div>
              <Switch color="success" isSelected={data.isActive} isDisabled={savingActive} onValueChange={onToggleActive}>
                {data.isActive ? "Aktif" : "Nonaktif"}
              </Switch>
            </div>

            <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${data.canViewCustomerBilling ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300" : "bg-default-100 text-foreground-500"}`}>
                  <Eye className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-bold text-foreground">Akses tagihan customer</p>
                  <p className="mt-1 text-xs leading-5 text-foreground-500">Izinkan lihat, update pembayaran, dan pelunasan.</p>
                </div>
              </div>
              <Switch color="primary" isSelected={Boolean(data.canViewCustomerBilling)} isDisabled={savingBillingAccess} onValueChange={onToggleBillingAccess}>
                {data.canViewCustomerBilling ? "Diizinkan" : "Dibatasi"}
              </Switch>
            </div>

            <div className="flex flex-col gap-4 px-5 py-5 sm:col-span-2 sm:border-t sm:border-default-200/70 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${data.canEditTutonWithoutWork ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : "bg-default-100 text-foreground-500"}`}>
                  <BookOpenCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-bold text-foreground">Tuton tanpa jam kerja</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-foreground-500">
                    Jika diizinkan, user dapat menambah atau mengubah progres Tuton walaupun belum memulai sesi kerja.
                  </p>
                </div>
              </div>
              <Switch
                color="secondary"
                isSelected={Boolean(data.canEditTutonWithoutWork)}
                isDisabled={savingTutonAccess}
                onValueChange={onToggleTutonWorkExemption}
              >
                {data.canEditTutonWithoutWork ? "Dikecualikan" : "Wajib jam kerja"}
              </Switch>
            </div>

            <div className="sm:col-span-2 sm:!border-l-0 sm:border-t sm:border-default-200/70">
              <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <Banknote className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-bold text-foreground">Tarif pekerjaan Harian</p>
                    <p className="mt-1 max-w-xl text-xs leading-5 text-foreground-500">
                      Tarif tetap per hari. Nilai disimpan sebagai snapshot saat user absen masuk dan baru masuk payroll setelah disetujui OWNER.
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
                  <Input
                    aria-label="Tarif harian"
                    label="Nominal per hari"
                    labelPlacement="outside"
                    min="1"
                    type="number"
                    value={dailyRateInput}
                    onValueChange={setDailyRateInput}
                    startContent={<span className="text-sm font-semibold text-foreground-400">Rp</span>}
                    className="sm:w-64"
                    classNames={{ inputWrapper: "min-h-11 rounded-xl" }}
                  />
                  <Button
                    color="primary"
                    isLoading={savingDailyRate}
                    isDisabled={savingDailyRate || Number(dailyRateInput) === Number(data.dailyRate)}
                    onPress={() => void onSaveDailyRate()}
                    startContent={!savingDailyRate ? <Save className="h-4 w-4" /> : null}
                    className="min-h-11 rounded-xl font-semibold"
                  >
                    Simpan tarif
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
          withTopBorder={ownerCanManage}
        />
      </section>

      <section aria-labelledby="work-operations-title">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Operasional</p>
            <h2 id="work-operations-title" className="mt-0.5 text-lg font-bold text-foreground">Aktivitas &amp; ringkasan kerja</h2>
            <p className="mt-1 text-sm text-foreground-500">Kendalikan sesi aktif dan pantau akumulasi jam pada periode berjalan.</p>
          </div>
        </div>
        <div className="space-y-4">
          <KendaliJamKerjaCard username={data.username} onChanged={load} userDetail={data} />
          <SummaryCards stats={miniStats} />
        </div>
      </section>

      {role === "OWNER" && data.unifiedPayroll ? (
        <UserPayrollBreakdown payroll={data.unifiedPayroll} />
      ) : null}

      <WorkHistory
        items={(data.jamKerja as any) ?? []}
        serverNow={(data as any)?.serverNow ?? null}
        title="Histori Jam Kerja"
        api={api}
        canEdit={role === "OWNER"}
        onUpdated={load}
      />
    </div>
  );
}
