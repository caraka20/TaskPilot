"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Boxes,
  ClipboardCheck,
  Clock3,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { api } from "@attendance/lib/api";
import { currency, formatDate, workModeLabel, workStatusLabel } from "@attendance/lib/format";
import type { WorkEntry } from "@attendance/types/api";
export type DashboardView =
  | "overview"
  | "approvals"
  | "calendar"
  | "products"
  | "tasks"
  | "notes"
  | "payroll"
  | "audit";
import { Badge } from "@attendance/components/ui/badge";
import { Button } from "@attendance/components/ui/button";
import { Card, CardContent, CardHeader } from "@attendance/components/ui/card";
import { Alert, EmptyState } from "@attendance/components/ui/feedback";
import { Page, PageHeader } from "@attendance/components/ui/page";

type DashboardData = {
  activeUsers: number;
  pendingApprovals: number;
  totalItems: number;
  totalEarned: string;
  totalPaid: string;
  balance: number;
  recentEntries: WorkEntry[];
};

const emptyDashboard: DashboardData = {
  activeUsers: 0,
  pendingApprovals: 0,
  totalItems: 0,
  totalEarned: "0",
  totalPaid: "0",
  balance: 0,
  recentEntries: [],
};

export function AdminOverviewPage({ navigate }: { navigate: (view: DashboardView) => void }) {
  const [data, setData] = useState(emptyDashboard);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardData>("/admin/dashboard")
      .then(setData)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Dashboard gagal dimuat."));
  }, []);

  const metrics = [
    { label: "Pengguna aktif", value: data.activeUsers.toLocaleString("id-ID"), icon: UsersRound, note: "Akun pekerja aktif", color: "blue" },
    { label: "Perlu diperiksa", value: data.pendingApprovals.toLocaleString("id-ID"), icon: ClipboardCheck, note: "Laporan menunggu admin", color: "amber" },
    { label: "Total produksi", value: data.totalItems.toLocaleString("id-ID"), icon: Boxes, note: "Item borongan disetujui", color: "purple" },
    { label: "Sisa kewajiban", value: currency.format(data.balance), icon: WalletCards, note: "Pendapatan belum dibayar", color: "green" },
  ] as const;

  return (
    <Page>
      <PageHeader
        title="Ringkasan operasional"
        description="Pantau absensi, produksi, dan kewajiban gaji dari satu halaman yang selalu mengikuti transaksi disetujui."
        action={<Button onClick={() => navigate("approvals")}><ClipboardCheck size={16} />Periksa absensi</Button>}
      />
      {error ? <Alert>{error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const colors = {
            blue: "bg-blue-50 text-blue-600",
            amber: "bg-amber-50 text-amber-600",
            purple: "bg-violet-50 text-violet-600",
            green: "bg-emerald-50 text-emerald-600",
          };
          return (
            <Card className="p-5" key={metric.label}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{metric.label}</p><p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{metric.value}</p></div>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${colors[metric.color]}`}><Icon size={20} /></span>
              </div>
              <p className="mt-5 text-[11px] font-semibold text-slate-400">{metric.note}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card>
          <CardHeader
            title="Aktivitas kerja terbaru"
            description="Perubahan laporan kerja paling baru dari seluruh pengguna."
            action={<Button size="sm" variant="ghost" onClick={() => navigate("approvals")}>Lihat semua <ArrowRight size={14} /></Button>}
          />
          {data.recentEntries.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Pengguna</th><th>Tanggal</th><th>Jenis</th><th>Status</th><th className="text-right">Nominal</th></tr></thead>
                <tbody>
                  {data.recentEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td><p className="font-extrabold text-slate-800">{entry.user?.name}</p><p className="mt-1 text-[10px] text-slate-400">@{entry.user?.username}</p></td>
                      <td>{formatDate(entry.workDate)}</td>
                      <td><Badge tone={entry.mode === "DAILY" ? "blue" : "purple"}>{workModeLabel(entry.mode)}</Badge></td>
                      <td><Badge tone={entry.status === "APPROVED" ? "green" : entry.status === "REJECTED" ? "red" : "amber"}>{workStatusLabel(entry.status)}</Badge></td>
                      <td className="text-right font-extrabold">{currency.format(Number(entry.finalAmount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="Belum ada aktivitas" description="Aktivitas absensi akan muncul setelah pengguna mulai mencatat pekerjaan." />}
        </Card>

        <Card>
          <CardHeader title="Posisi penggajian" description="Saldo berjalan tanpa periode tetap." />
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-[#0d294c] p-5 text-white">
              <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/60">Total pendapatan</p><Banknote className="text-blue-300" size={20} /></div>
              <p className="mt-4 text-2xl font-extrabold">{currency.format(Number(data.totalEarned))}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><span className="flex items-center gap-2 text-xs font-bold text-slate-500"><Clock3 size={16} />Sudah dibayar</span><strong className="text-sm">{currency.format(Number(data.totalPaid))}</strong></div>
            <Button className="w-full" variant="secondary" onClick={() => navigate("payroll")}>Buka penggajian <ArrowRight size={15} /></Button>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}