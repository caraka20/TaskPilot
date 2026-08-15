import { Button } from "@heroui/react";
import {
  ArrowRight,
  Banknote,
  Boxes,
  BriefcaseBusiness,
  Clock3,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { UserDetail } from "../../../services/users.service";

type Payroll = NonNullable<UserDetail["unifiedPayroll"]>;

type Props = {
  payroll: Payroll;
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatHours(value: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function UserPayrollBreakdown({ payroll }: Props) {
  const paidProgress = payroll.totalEarned > 0
    ? Math.min(100, Math.max(0, (payroll.totalPaid / payroll.totalEarned) * 100))
    : 0;

  const sources = [
    {
      label: "Jam-jaman",
      value: payroll.hourlyEarned,
      detail: `${formatHours(payroll.hourlyHours)} jam · ${payroll.hourlySessionCount} sesi selesai`,
      secondary: `${rupiah.format(payroll.hourlyRate)} per jam`,
      icon: Clock3,
      tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
      line: "bg-indigo-500",
    },
    {
      label: "Harian",
      value: payroll.dailyEarned,
      detail: `${payroll.dailyCount} pekerjaan disetujui`,
      secondary: "Mengikuti snapshot tarif harian",
      icon: BriefcaseBusiness,
      tone: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
      line: "bg-cyan-500",
    },
    {
      label: "Borongan",
      value: payroll.pieceworkEarned,
      detail: `${payroll.pieceworkCount} pekerjaan disetujui`,
      secondary: "Dihitung dari hasil produksi",
      icon: Boxes,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      line: "bg-emerald-500",
    },
  ];

  return (
    <section
      aria-labelledby="user-payroll-title"
      className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]"
    >
      <div className="flex flex-col gap-4 border-b border-default-200/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <WalletCards className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              Payroll terpadu
            </p>
            <h2 id="user-payroll-title" className="mt-0.5 text-lg font-bold text-foreground">
              Rincian pendapatan user
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-500">
              Hanya jam kerja selesai dan pekerjaan Absensi yang telah disetujui OWNER.
            </p>
          </div>
        </div>

        <Button
          as={Link}
          to="/attendance?view=payroll"
          color="primary"
          variant="flat"
          endContent={<ArrowRight className="h-4 w-4" />}
          className="min-h-11 shrink-0 rounded-xl font-semibold"
        >
          Kelola payroll
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_1.95fr]">
        <div className="bg-[#102f4c] px-5 py-5 text-white sm:px-6 lg:py-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sky-200/80">
              Total pendapatan
            </p>
            <Banknote className="h-5 w-5 text-cyan-200" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight">
            {rupiah.format(payroll.totalEarned)}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/[0.08] px-3.5 py-3 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Sudah dibayar</p>
              <p className="mt-1.5 text-base font-extrabold">{rupiah.format(payroll.totalPaid)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-400/10 px-3.5 py-3 ring-1 ring-emerald-300/20">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Sisa gaji</p>
              <p className="mt-1.5 text-base font-extrabold text-emerald-200">{rupiah.format(payroll.balance)}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-slate-300">
              <span>Progres pembayaran</span>
              <span>{Math.round(paidProgress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
                style={{ width: `${paidProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid divide-y divide-default-200/70 md:grid-cols-3 md:divide-x md:divide-y-0">
          {sources.map(({ label, value, detail, secondary, icon: Icon, tone, line }) => (
            <article key={label} className="relative min-w-0 px-5 py-5 sm:px-6 lg:py-6">
              <span aria-hidden="true" className={`absolute inset-x-5 top-0 h-0.5 rounded-full ${line} opacity-80 sm:inset-x-6`} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground-400">{label}</p>
                  <p className="mt-2 text-xl font-extrabold tracking-tight text-foreground">
                    {rupiah.format(value)}
                  </p>
                </div>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold text-foreground-600">{detail}</p>
              <p className="mt-1 text-[11px] leading-5 text-foreground-400">{secondary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
