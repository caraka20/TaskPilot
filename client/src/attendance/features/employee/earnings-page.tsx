"use client";

import { useEffect, useState } from "react";
import { Banknote, BriefcaseBusiness, CalendarCheck2, Clock3, PackageOpen, ReceiptText, WalletCards } from "lucide-react";
import { api } from "@attendance/lib/api";
import { currency, formatDate } from "@attendance/lib/format";
import type { Payment, PayrollSummary } from "@attendance/types/api";
import { Card, CardContent, CardHeader } from "@attendance/components/ui/card";
import { Alert, EmptyState } from "@attendance/components/ui/feedback";
import { Page, PageHeader } from "@attendance/components/ui/page";

export function EarningsPage() {
  const [summary, setSummary] = useState<PayrollSummary>({
    hourlyHours: 0,
    hourlyRate: "0",
    hourlyEarned: "0",
    hourlySessionCount: 0,
    dailyEarned: "0",
    dailyCount: 0,
    pieceworkEarned: "0",
    pieceworkCount: 0,
    attendanceEarned: "0",
    totalEarned: "0",
    totalPaid: "0",
    balance: "0",
    attendanceCount: 0,
    totalWorkCount: 0,
    totalItems: 0,
  }); const [payments, setPayments] = useState<Payment[]>([]); const [error, setError] = useState("");
  useEffect(() => { api<{ summary: PayrollSummary; payments: Payment[] }>("/payroll/me").then((result) => { setSummary(result.summary); setPayments(result.payments); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Penghasilan gagal dimuat.")); }, []);
  const metrics = [
    {
      label: "Total pendapatan",
      value: currency.format(Number(summary.totalEarned)),
      detail: `${summary.totalWorkCount.toLocaleString("id-ID")} catatan kerja disetujui`,
      icon: Banknote,
      color: "bg-sky-50 text-[#1b4f75] dark:bg-sky-400/10 dark:text-sky-300",
    },
    {
      label: "Sudah dibayar",
      value: currency.format(Number(summary.totalPaid)),
      detail: `${payments.length.toLocaleString("id-ID")} transaksi pembayaran`,
      icon: WalletCards,
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    },
    {
      label: "Sisa gaji",
      value: currency.format(Number(summary.balance)),
      detail: "Saldo yang masih dapat dibayarkan",
      icon: ReceiptText,
      color: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    },
    {
      label: "Jam kerja",
      value: `${Number(summary.hourlyHours).toFixed(2)} jam`,
      detail: `${currency.format(Number(summary.hourlyEarned))} • ${summary.hourlySessionCount.toLocaleString("id-ID")} sesi`,
      icon: Clock3,
      color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300",
    },
    {
      label: "Kerja harian",
      value: `${summary.dailyCount.toLocaleString("id-ID")} pekerjaan`,
      detail: currency.format(Number(summary.dailyEarned)),
      icon: BriefcaseBusiness,
      color: "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300",
    },
    {
      label: "Produksi borongan",
      value: `${Number(summary.totalItems).toLocaleString("id-ID")} item`,
      detail: `${currency.format(Number(summary.pieceworkEarned))} • ${summary.pieceworkCount.toLocaleString("id-ID")} pekerjaan`,
      icon: PackageOpen,
      color: "bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300",
    },
  ];

  return (
    <Page>
      <PageHeader title="Pendapatan & pengambilan gaji" description="Lihat rincian pendapatan disetujui, saldo berjalan, dan seluruh pembayaran yang sudah kamu terima." />
      {error ? <Alert>{error}</Alert> : null}

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0d2945] via-[#123f60] to-[#0e5960] p-5 text-white shadow-[0_22px_60px_rgba(13,41,69,.20)] sm:p-6">
        <p className="text-[10px] font-black uppercase tracking-[.16em] text-sky-200">Saldo pendapatan saat ini</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <div><p className="text-sm text-slate-300">Total upah terakumulasi</p><p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{currency.format(Number(summary.totalEarned))}</p></div>
          <div className="rounded-2xl bg-white/[.08] px-5 py-4 ring-1 ring-white/10"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Sudah diterima</p><p className="mt-1 text-xl font-black">{currency.format(Number(summary.totalPaid))}</p></div>
          <div className="rounded-2xl bg-emerald-300/10 px-5 py-4 ring-1 ring-emerald-200/15"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Sisa gaji</p><p className="mt-1 text-xl font-black text-emerald-200">{currency.format(Number(summary.balance))}</p></div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card className="p-4 sm:p-5" key={metric.label}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">{metric.value}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">{metric.detail}</p>
                </div>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${metric.color}`}><Icon size={18} /></span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Riwayat pengambilan gaji" description="Semua pembayaran sebagian maupun pelunasan ditampilkan dari yang terbaru." />
        {payments.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((payment) => (
              <CardContent className="flex items-center gap-4" key={payment.id}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><CalendarCheck2 size={18} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">{payment.note || "Pembayaran gaji"}</p><p className="mt-1 text-xs text-slate-400">Diterima {formatDate(payment.paymentDate)}</p></div>
                <p className="shrink-0 font-black text-emerald-700 dark:text-emerald-300">{currency.format(Number(payment.amount))}</p>
              </CardContent>
            ))}
          </div>
        ) : <EmptyState title="Belum ada pembayaran" description="Riwayat akan muncul setelah owner mencatat pengambilan gaji." />}
      </Card>
    </Page>
  );
}
