// client/src/components/dashboard/DashboardHeader.tsx
import { Button } from "@heroui/react";
import {
  Activity,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  Gauge,
  RefreshCw,
  Timer,
  UsersRound,
} from "lucide-react";
import WorkspacePageHeader, {
  type WorkspaceHeaderMetric,
} from "../common/WorkspacePageHeader";
import type { OwnerDashboardHeaderSummary } from "./OwnerOperationsDashboard";

type Props = {
  role: "OWNER" | "USER";
  username?: string | null;
  loading?: boolean;
  status: "AKTIF" | "JEDA" | "TIDAK_AKTIF";
  weekHours: number;
  totalHours: number;
  ownerSummary: OwnerDashboardHeaderSummary | null;
  onRefresh: () => void;
};

const numberID = new Intl.NumberFormat("id-ID");

const dateID = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatHours(value: number) {
  return `${numberID.format(Number(value.toFixed(1)))} jam`;
}

export default function DashboardHeader({
  role,
  username,
  loading = false,
  status,
  weekHours,
  totalHours,
  ownerSummary,
  onRefresh,
}: Props) {
  const isOwner = role === "OWNER";
  const statusLabel = status === "AKTIF" ? "Sedang bekerja" : status === "JEDA" ? "Sedang jeda" : "Belum bekerja";

  const metrics: [WorkspaceHeaderMetric, WorkspaceHeaderMetric, WorkspaceHeaderMetric] = isOwner
    ? [
        {
          label: "Total customer",
          value: ownerSummary ? `${numberID.format(ownerSummary.totalCustomers)} customer` : "Memuat…",
          icon: UsersRound,
          tone: "cyan",
        },
        {
          label: "Pekerja aktif",
          value: ownerSummary ? `${numberID.format(ownerSummary.activeUsers)} pengguna` : "Memuat…",
          icon: Activity,
          tone: "emerald",
        },
        {
          label: "Perlu persetujuan",
          value: ownerSummary ? `${numberID.format(ownerSummary.pendingApprovals)} laporan` : "Memuat…",
          icon: ClipboardCheck,
          tone: ownerSummary?.pendingApprovals ? "amber" : "emerald",
        },
      ]
    : [
        {
          label: "Status kerja",
          value: statusLabel,
          icon: Activity,
          tone: status === "AKTIF" ? "emerald" : status === "JEDA" ? "amber" : "cyan",
        },
        {
          label: "Jam minggu ini",
          value: formatHours(weekHours),
          icon: CalendarRange,
          tone: "cyan",
        },
        {
          label: "Akumulasi jam",
          value: formatHours(totalHours),
          icon: Timer,
          tone: "indigo",
        },
      ];

  return (
    <WorkspacePageHeader
      eyebrow={isOwner ? "ARTECH • Business command center" : "ARTECH • Personal workspace"}
      title={isOwner ? "Dashboard operasional" : `Halo, ${username || "pengguna"}`}
      description={
        isOwner
          ? "Ringkasan kondisi bisnis, aktivitas tim, customer, dan pekerjaan yang memerlukan perhatian."
          : "Pantau status kerja, akumulasi waktu, pendapatan, dan aktivitas terbaru dalam satu tampilan."
      }
      icon={Gauge}
      actions={
        <>
          <div className="hidden min-h-11 items-center gap-3 rounded-xl bg-white/[0.08] px-4 ring-1 ring-white/15 backdrop-blur sm:flex">
            <CalendarDays className="h-4 w-4 text-cyan-200" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">Hari ini</p>
              <p className="text-xs font-semibold capitalize text-white">{dateID.format(new Date())}</p>
            </div>
          </div>
          <Button
            onPress={onRefresh}
            isLoading={loading}
            startContent={!loading ? <RefreshCw className="h-4 w-4" /> : undefined}
            className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#0b2948] shadow-sm hover:bg-slate-50"
          >
            Perbarui data
          </Button>
        </>
      }
      metrics={metrics}
    />
  );
}
