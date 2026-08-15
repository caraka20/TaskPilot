// client/src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Spacer } from "@heroui/react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import { useUIStore } from "../store/ui.store"; // ⬅️ for smooth transition on sidebar toggle
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
  type JamKerjaRow,
  listJamKerja,
} from "../services/jamKerja.service";

import { useWorkStore } from "../store/work.store";
import UnifiedPayrollOverview from "../components/dashboard/UnifiedPayrollOverview";
import OwnerOperationsDashboard, {
  type OwnerDashboardHeaderSummary,
} from "../components/dashboard/OwnerOperationsDashboard";

// New tiny comps
import DashboardHeader from "../components/dashboard/DashboardHeader";
import ErrorBanner from "../components/dashboard/ErrorBanner";
import StatusCard from "../components/dashboard/StatusCard";
import KPICards from "../components/dashboard/KPICards";
import WorkHistory from "./users/components/WorkHistory";

import { startOfWeek } from "../utils/format";
import { computeRunningSecondsAndStart } from "../utils/jamkerja";
import { WORK_STARTED_EVENT, WORK_ACTIVITY_EVENT } from "../utils/workActivity";

const dashboardEntranceVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.04,
      staggerChildren: 0.09,
    },
  },
};

const dashboardSectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.994,
    filter: "blur(3px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

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
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const reduceMotion = useReducedMotion();
  const { role: rawRole, username } = useAuthStore();
  const role = (rawRole ?? "USER").toUpperCase() as "OWNER" | "USER";
  const isOwner = role === "OWNER";

  // Mulai dalam kondisi loading agar animasi masuk tidak selesai di balik
  // overlay sebelum data USER siap ditampilkan.
  const [loading, setLoading] = useState(!isOwner);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<KonfigurasiResponse | null>(null);

  // USER data
  const [historiHariIni, setHistoriHariIni] = useState<JamKerjaItem[]>([]);
  const [historiSemua, setHistoriSemua] = useState<JamKerjaRow[]>([]);
  const [statusLabel, setStatusLabel] =
    useState<"AKTIF" | "JEDA" | "TIDAK_AKTIF">("TIDAK_AKTIF");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [durasiBerjalanDetik, setDurasiBerjalanDetik] = useState(0);

  // KPI lain
  const [jamMingguIni, setJamMingguIni] = useState(0);
  const [totalJamAll, setTotalJamAll] = useState(0);
  const [firstWorkDate, setFirstWorkDate] = useState<string | null>(null);
  const [ownerRefreshKey, setOwnerRefreshKey] = useState(0);
  const [ownerHeaderSummary, setOwnerHeaderSummary] = useState<OwnerDashboardHeaderSummary | null>(null);
  const [ownerDashboardLoading, setOwnerDashboardLoading] = useState(isOwner);

  // Sumber untuk KPI "Jam Hari Ini" live
  const [detikHariIniAccum, setDetikHariIniAccum] = useState(0);
  const [activeStartedAt, setActiveStartedAt] = useState<string | null>(null);
  const [serverNowIso, setServerNowIso] = useState<string | null>(null);

  const setWorkStatus = useWorkStore((s) => s.setStatus);

  // ⬇️ Smooth anim saat sidebar open/close
  const { sidebarCollapsed: collapsed } = useUIStore();
  const [resizing, setResizing] = useState(false);
  useEffect(() => {
    setResizing(true);
    const t = setTimeout(() => setResizing(false), 320); // match duration-300
    return () => clearTimeout(t);
  }, [collapsed]);

  const refresh = useCallback(async () => {
    if (!username) return;

    // Dashboard OWNER memakai endpoint operasional terpadu. Hindari request
    // konfigurasi legacy dan pemuatan ganda pada render pertama.
    if (isOwner) {
      setOwnerDashboardLoading(true);
      setOwnerRefreshKey((value) => value + 1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ambil konfigurasi efektif (tidak ditampilkan ke USER, hanya untuk logic status)
      const eff = await getEffectiveConfig(api, username);
      const cfg = eff ?? (await getGlobalConfig(api));
      setConfig(cfg);

      if (!isOwner) {
        const todayISO = isoDate(new Date());
        const weekStart = startOfWeek(new Date());
        const today = new Date();
        const [histToday, histWeek, allRows] = await Promise.all([
          getHistoriByRange(api, username, todayISO, todayISO),
          getHistoriByRange(api, username, isoDate(weekStart), isoDate(today)),
          listJamKerja(api, username),
        ]);

        // Histori hari ini (untuk status real-time & tabel mini)
        // Pastikan terbaru di index 0
        const itemsToday = (histToday.items ?? [])
          .slice()
          .sort((a, b) => new Date(b.mulai).getTime() - new Date(a.mulai).getTime());
        setHistoriHariIni(itemsToday);
        setHistoriSemua(allRows ?? []);

        // ====== hitung baseline & startedAt (konsisten dgn Owner)
        const adapted = itemsToday.map((r) => ({
          jamMulai: r.mulai,
          jamSelesai: r.selesai ?? null,
          totalJam: (r.durasiDetik ?? 0) / 3600,
          status: r.status as "AKTIF" | "JEDA" | "SELESAI",
        }));
        const { seconds: baseSeconds, startedAt } = computeRunningSecondsAndStart(adapted);

        // Status terkini (berdasar entry terbaru)
        const last = itemsToday[0];
        let nextStatus: "AKTIF" | "JEDA" | "TIDAK_AKTIF" = "TIDAK_AKTIF";
        let nextActiveId: number | null = null;
        let nextBadge = 0;

        if (last?.status === "AKTIF") {
          nextStatus = "AKTIF";
          nextActiveId = last.id ?? null;
          nextBadge = last.durasiDetik ?? 0;
        } else if (last?.status === "JEDA") {
          nextStatus = "JEDA";
          nextActiveId = last.id ?? null;
          nextBadge = last.durasiDetik ?? 0;
        } else {
          nextStatus = "TIDAK_AKTIF";
          nextActiveId = null;
          nextBadge = 0;
        }

        setStatusLabel(nextStatus);
        setActiveSessionId(nextActiveId);
        setDurasiBerjalanDetik(nextBadge);

        // Detik hari ini (baseline) + startedAt untuk hook live
        setDetikHariIniAccum(baseSeconds);
        setActiveStartedAt(startedAt);
        setServerNowIso(new Date().toISOString());

        // === Jam MINGGU INI
        const weekMs = (histWeek.items ?? []).reduce((acc, r) => {
          const s = new Date(r.mulai);
          const e = r.selesai ? new Date(r.selesai) : (r.status === "AKTIF" ? today : s);
          const a = Math.max(s.getTime(), weekStart.getTime());
          const b = Math.min(e.getTime(), today.getTime());
          return acc + Math.max(0, b - a);
        }, 0);
        setJamMingguIni(weekMs / 3600000);

        // === Semua JAM
        const nowAll = new Date();
        const allMs = (allRows ?? []).reduce((acc, row) => {
          const s = new Date(row.jamMulai).getTime();
          const e = row.jamSelesai
            ? new Date(row.jamSelesai).getTime()
            : (row.status === "AKTIF" ? nowAll.getTime() : s);
          return acc + Math.max(0, e - s);
        }, 0);
        setTotalJamAll(allMs / 3600000);
        const first = [...(allRows ?? [])]
          .map((row) => row.jamMulai)
          .filter(Boolean)
          .sort((a, b) => +new Date(a) - +new Date(b))[0]
        setFirstWorkDate(first ?? null)
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
    if (!isOwner) void refresh();
  }, [isOwner, refresh]);

  // 🔔 Auto-refresh ketika ada WORK_STARTED_EVENT (start/resume dari mana pun)
  useEffect(() => {
    const onStarted = () => { void refresh(); };
    const onActivity = () => { /* opsional: bisa dipakai nanti */ };

    window.addEventListener(WORK_STARTED_EVENT, onStarted as any);
    window.addEventListener(WORK_ACTIVITY_EVENT, onActivity as any);
    return () => {
      window.removeEventListener(WORK_STARTED_EVENT, onStarted as any);
      window.removeEventListener(WORK_ACTIVITY_EVENT, onActivity as any);
    };
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
  // Tick durasi memang diperlukan agar baris sesi aktif ikut diperbarui setiap detik.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, historiHariIni, durasiBerjalanDetik]);

  const dashboardReady = isOwner ? !ownerDashboardLoading : !loading;

  return (
    <div
      data-workspace-page
      className={[
        "w-full",
        "transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
        "motion-reduce:transition-none",
        resizing ? "opacity-95 scale-[.997] will-change-transform" : "",
      ].join(" ")}
    >
      <motion.div
        data-dashboard-entrance
        className="w-full"
        variants={dashboardEntranceVariants}
        initial={reduceMotion ? false : "hidden"}
        animate={dashboardReady || reduceMotion ? "visible" : "hidden"}
      >
        <motion.div variants={dashboardSectionVariants}>
          <DashboardHeader
            role={role}
            username={username}
            loading={isOwner ? ownerDashboardLoading : loading}
            status={statusLabel}
            weekHours={jamMingguIni}
            totalHours={totalJamAll}
            ownerSummary={ownerHeaderSummary}
            onRefresh={refresh}
          />
        </motion.div>

        <Spacer y={3} />
        {error && (
          <motion.div variants={dashboardSectionVariants}>
            <ErrorBanner message={error} />
            <Spacer y={3} />
          </motion.div>
        )}

        {isOwner ? (
          <motion.div variants={dashboardSectionVariants}>
            <OwnerOperationsDashboard
              refreshKey={ownerRefreshKey}
              onSummaryChange={setOwnerHeaderSummary}
              onLoadingChange={setOwnerDashboardLoading}
            />
          </motion.div>
        ) : (
          <>
            <motion.div variants={dashboardSectionVariants}>
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
            </motion.div>

            <Spacer y={4} />

            <motion.div variants={dashboardSectionVariants}>
              <KPICards
                status={statusLabel}
                detikHariIni={detikHariIniAccum}
                startedAt={activeStartedAt}
                serverNow={serverNowIso}
                jamMingguIni={jamMingguIni}
                totalJamAll={totalJamAll}
                firstWorkDate={firstWorkDate}
              />
            </motion.div>

            <Spacer y={4} />
            <motion.div variants={dashboardSectionVariants}>
              <UnifiedPayrollOverview owner={false} />
            </motion.div>

            <Spacer y={4} />
            <motion.div variants={dashboardSectionVariants}>
              <WorkHistory
                items={historiSemua.map((row) => {
                  const liveRow = historiView.find((item) => item.id === row.id);
                  return liveRow
                    ? { ...row, totalJam: liveRow.durasiDetik / 3600 }
                    : row;
                })}
                serverNow={serverNowIso}
                title="Histori Jam Kerja"
                api={api}
                canEdit={false}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {loading && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-background/60 backdrop-blur" role="status" aria-live="polite">
          <div className="animate-pulse text-sm px-4 py-2 bg-background rounded-large border">
            Memuat dashboard…
          </div>
        </div>
      )}
    </div>
  );
}
