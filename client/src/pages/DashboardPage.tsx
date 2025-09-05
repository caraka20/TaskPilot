import { useEffect, useMemo, useState, useCallback } from "react";
import { Spacer } from "@heroui/react";

import { useAuthStore } from "../store/auth.store";
import { useApi } from "../hooks/useApi";

import {
  getEffectiveConfig,
  getGlobalConfig,
  type KonfigurasiResponse,
} from "../services/config.service";
import {
  getHistoriByRange,
  type JamKerjaItem,
  listJamKerja,
} from "../services/jamKerja.service";

import { useWorkStore } from "../store/work.store";
import GajiSection from "../components/gaji/GajiSection";

// OWNER widgets
import OwnerPayrollCards from "../components/owner/OwnerPayrollCards";
import OwnerGajiTable from "../components/owner/OwnerGajiTable";

// Config (UI)
import EffectiveConfigCard from "../components/config/EffectiveConfigCard";

// New tiny comps
import DashboardHeader from "../components/dashboard/DashboardHeader";
import ErrorBanner from "../components/dashboard/ErrorBanner";
import StatusCard from "../components/dashboard/StatusCard";
import KPICards from "../components/dashboard/KPICards";
import HistoriHariIniTable from "../components/dashboard/HistoriHariIniTable";

import { startOfWeek } from "../utils/format";

/* ===== Utils: tanggal hari ini & clamp durasi ke rentang hari ini ===== */
function startOfToday(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfToday(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function clampDurationMs(row: JamKerjaItem, now: Date) {
  const s = new Date(row.mulai);
  const e = row.selesai ? new Date(row.selesai) : now;
  const a = Math.max(s.getTime(), startOfToday(now).getTime());
  const b = Math.min(e.getTime(), endOfToday(now).getTime());
  return Math.max(0, b - a);
}

export default function DashboardPage() {
  const api = useApi();
  const { role: rawRole, username } = useAuthStore();
  const role = (rawRole ?? "USER").toUpperCase() as "OWNER" | "USER";
  const isOwner = role === "OWNER";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<KonfigurasiResponse | null>(null);

  // USER data
  const [historiHariIni, setHistoriHariIni] = useState<JamKerjaItem[]>([]);
  const [statusLabel, setStatusLabel] =
    useState<"AKTIF" | "JEDA" | "TIDAK_AKTIF">("TIDAK_AKTIF");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [durasiBerjalanDetik, setDurasiBerjalanDetik] = useState(0);
  // const [jamHariIni, setJamHariIni] = useState(0);

  // KPI lain
  const [jamMingguIni, setJamMingguIni] = useState(0);
  const [totalJamAll, setTotalJamAll] = useState(0);

  // Sumber untuk KPI "Jam Hari Ini" live
  const [detikHariIniAccum, setDetikHariIniAccum] = useState(0);
  const [activeStartedAt, setActiveStartedAt] = useState<string | null>(null);
  const [serverNowIso, setServerNowIso] = useState<string | null>(null);

  const setWorkStatus = useWorkStore((s) => s.setStatus);

  const refresh = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError(null);

    try {
      // Ambil konfigurasi efektif (tidak ditampilkan ke USER, hanya untuk logic status)
      const eff = await getEffectiveConfig(api, username);
      const cfg = eff ?? (await getGlobalConfig(api));
      setConfig(cfg);

      if (!isOwner) {
        const todayISO = new Date().toISOString().slice(0, 10);

        // Histori hari ini (untuk status real-time & tabel mini)
        const histToday = await getHistoriByRange(api, username, todayISO, todayISO);
        // Pastikan terbaru di index 0
        const itemsToday = (histToday.items ?? []).slice().sort(
          (a, b) => new Date(b.mulai).getTime() - new Date(a.mulai).getTime()
        );
        setHistoriHariIni(itemsToday);

        // Hitung durasi hari ini (clamp realtime)
        const now = new Date();
        const totalMs = itemsToday.reduce((acc, r) => acc + clampDurationMs(r, now), 0);
        // setJamHariIni(totalMs / 1000 / 3600);

        // Status terkini & sumber live
        const last = itemsToday[0];
        let nextStatus: "AKTIF" | "JEDA" | "TIDAK_AKTIF" = "TIDAK_AKTIF";
        let nextActiveId: number | null = null;
        let nextDetikBadge = 0;
        let accumForLive = Math.floor(totalMs / 1000);
        let startedAtISO: string | null = null;

        if (last?.status === "AKTIF") {
          nextStatus = "AKTIF";
          nextActiveId = last.id ?? null;
          nextDetikBadge = last.durasiDetik ?? 0;
          if (last.mulai) {
            const segStart = new Date(last.mulai);
            const sinceStart = Math.max(0, Math.floor((now.getTime() - segStart.getTime()) / 1000));
            accumForLive = Math.max(0, accumForLive - sinceStart);
            startedAtISO = segStart.toISOString();
          }
        } else if (last?.status === "JEDA") {
          nextStatus = "JEDA";
          nextActiveId = last.id ?? null;
          nextDetikBadge = last.durasiDetik ?? 0;
          startedAtISO = null; // jeda → tidak tambah delta
          // accumForLive tetap totalMs detik
        } else {
          nextStatus = "TIDAK_AKTIF";
          nextActiveId = null;
          nextDetikBadge = 0;
          startedAtISO = null;
          // accumForLive tetap totalMs detik
        }

        setStatusLabel(nextStatus);
        setActiveSessionId(nextActiveId);
        setDurasiBerjalanDetik(nextDetikBadge);
        setDetikHariIniAccum(accumForLive);
        setActiveStartedAt(startedAtISO);
        setServerNowIso(now.toISOString());

        // === Jam MINGGU INI (LIVE): histori Senin–hari ini + delta segmen AKTIF
        const weekStart = startOfWeek(new Date());
        const today = new Date();
        const histWeek = await getHistoriByRange(api, username, isoDate(weekStart), isoDate(today));
        const weekMs = (histWeek.items ?? []).reduce((acc, r) => {
          const s = new Date(r.mulai);
          const e = r.selesai ? new Date(r.selesai) : (r.status === "AKTIF" ? today : s);
          // clamp ke rentang minggu ini
          const a = Math.max(s.getTime(), weekStart.getTime());
          const b = Math.min(e.getTime(), today.getTime());
          return acc + Math.max(0, b - a);
        }, 0);
        setJamMingguIni(weekMs / 3600000);

        // === Seluruh JAM (LIVE): semua sesi + delta aktif (jika ada)
        const allRows = await listJamKerja(api, username); // JamKerjaRow[]
        const nowAll = new Date();
        const allMs = (allRows ?? []).reduce((acc, row) => {
          const s = new Date(row.jamMulai).getTime();
          const e = row.jamSelesai
            ? new Date(row.jamSelesai).getTime()
            : (row.status === "AKTIF" ? nowAll.getTime() : s);
          return acc + Math.max(0, e - s);
        }, 0);
        setTotalJamAll(allMs / 3600000);

        // (Opsional) Jika tetap ingin simpan rekap mingguan dari BE untuk perbandingan:
        // const rekapMinggu = await getRekapJam(api, username, "minggu");
        // console.debug("rekap (SELESAI saja) vs live:", rekapMinggu.totalJam, weekMs / 3600000);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  }, [api, username, isOwner]);

  // Sinkron status ke topbar
  useEffect(() => {
    if (!isOwner) setWorkStatus(statusLabel, durasiBerjalanDetik);
  }, [isOwner, statusLabel, durasiBerjalanDetik, setWorkStatus]);

  // Tick detik berjalan saat AKTIF (badge kecil di kiri)
  useEffect(() => {
    if (isOwner || statusLabel !== "AKTIF") return;
    const t = setInterval(() => setDurasiBerjalanDetik((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isOwner, statusLabel]);

  // Initial load
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Histori hari ini (durasi baris aktif dijalankan realtime)
  const historiView = useMemo(() => {
    if (isOwner) return [];
    const now = new Date();
    return (historiHariIni ?? []).map((r) => {
      if (r.selesai) return r;
      const detik = Math.floor(clampDurationMs(r, now) / 1000);
      return { ...r, durasiDetik: detik };
    });
  }, [isOwner, historiHariIni, durasiBerjalanDetik]);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <DashboardHeader role={role} onRefresh={refresh} />

      <Spacer y={3} />
      {error && (
        <>
          <ErrorBanner message={error} />
          <Spacer y={3} />
        </>
      )}

      {isOwner ? (
        <>
          <OwnerPayrollCards />
          <Spacer y={4} />
          <OwnerGajiTable />
          <Spacer y={4} />
          <EffectiveConfigCard
            username={username || ""}
            data={config}
            loading={loading}
            onRefresh={refresh}
          />
        </>
      ) : (
        <>
          <StatusCard
            statusLabel={statusLabel}
            activeSessionId={activeSessionId}
            detikBerjalan={detikHariIniAccum}
            startedAt={activeStartedAt}
            serverNow={serverNowIso}
            jedaOtomatisAktif={config?.jedaOtomatisAktif}
            batasJedaMenit={config?.batasJedaMenit}
            onChanged={refresh}
          />

          <Spacer y={4} />

          <KPICards
            status={statusLabel}
            detikHariIni={detikHariIniAccum}
            startedAt={activeStartedAt}
            serverNow={serverNowIso}
            jamMingguIni={jamMingguIni}
            totalJamAll={totalJamAll}
          />

          <Spacer y={4} />
          <GajiSection />

          <Spacer y={4} />
          <HistoriHariIniTable rows={historiView} />
        </>
      )}

      {loading && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur grid place-items-center">
          <div className="animate-pulse text-sm px-4 py-2 bg-background rounded-large border">
            Memuat dashboard…
          </div>
        </div>
      )}
    </div>
  );
}
