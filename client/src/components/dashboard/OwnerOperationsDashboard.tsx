import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, Chip } from "@heroui/react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Landmark,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { currencyIDR, fmtDate, numberID } from "../../utils/format";

type Money = string | number;
type DashboardData = {
  activeUsers: number;
  workingNow: number;
  pendingApprovals: number;
  payroll: {
    hourlyHours: number;
    hourlyEarned: Money;
    dailyEarned: Money;
    pieceworkEarned: Money;
    totalEarned: Money;
    totalPaid: Money;
    balance: Money;
    dailyCount: number;
    totalItems: number;
    period?: { key: "week" | "month" | "year"; from: string; to: string };
  };
  customers: {
    total: number;
    services: { tuton: number; karil: number; metode: number };
  };
  recentEntries: Array<{
    id: string;
    workDate: string;
    mode: "DAILY" | "PIECEWORK";
    status: string;
    finalAmount: Money;
    user?: { name: string; username: string };
  }>;
  recentCustomerPayments: Array<{
    id: number;
    amount: number;
    tanggalBayar: string;
    customer: { id: number; namaCustomer: string; nim: string };
  }>;
};

export type OwnerDashboardHeaderSummary = {
  totalCustomers: number;
  activeUsers: number;
  pendingApprovals: number;
};

const money = (value: Money | undefined) => currencyIDR.format(Number(value ?? 0));

const ownerDashboardVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.1,
    },
  },
};

const ownerSectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.995,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.46,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

function Metric({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
  tone: "indigo" | "cyan" | "amber";
}) {
  const tones = {
    indigo: "from-indigo-500/16 to-indigo-500/0 text-indigo-600 dark:text-indigo-300",
    cyan: "from-cyan-500/16 to-cyan-500/0 text-cyan-700 dark:text-cyan-300",
    amber: "from-amber-500/18 to-amber-500/0 text-amber-700 dark:text-amber-300",
  };

  return (
    <article className="group relative overflow-hidden rounded-[24px] bg-white p-5 shadow-[0_12px_38px_rgba(15,23,42,.055)] ring-1 ring-slate-200/55 transition hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(15,23,42,.08)] dark:bg-slate-900 dark:ring-slate-800 sm:p-6">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tones[tone]}`} />
      <div className="relative flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-white/80 dark:bg-slate-800/80 dark:ring-slate-700 ${tones[tone].split(" ").slice(2).join(" ")}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-slate-400">{label}</p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-[28px]">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{note}</p>
        </div>
      </div>
    </article>
  );
}

function ActivityPanel({ title, description, icon, children, footer }: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[26px] bg-white shadow-[0_14px_42px_rgba(15,23,42,.055)] ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">{icon}</span>
        <div className="min-w-0">
          <h2 className="font-black text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
      {footer ? <div className="px-5 py-4 sm:px-6">{footer}</div> : null}
    </section>
  );
}

type Props = {
  refreshKey?: number;
  onSummaryChange?: (summary: OwnerDashboardHeaderSummary) => void;
  onLoadingChange?: (loading: boolean) => void;
};

export default function OwnerOperationsDashboard({
  refreshKey = 0,
  onSummaryChange,
  onLoadingChange,
}: Props) {
  const api = useApi();
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [payrollPeriod, setPayrollPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    let active = true;
    setError("");
    onLoadingChange?.(true);
    api.get<DashboardData>(`/api/attendance/admin/dashboard?period=${payrollPeriod}`)
      .then(({ data: response }) => {
        if (!active) return;
        setData(response);
        onSummaryChange?.({
          totalCustomers: response.customers.total,
          activeUsers: response.activeUsers,
          pendingApprovals: response.pendingApprovals,
        });
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Dashboard OWNER gagal dimuat.");
      })
      .finally(() => {
        if (active) onLoadingChange?.(false);
      });
    return () => { active = false; };
  }, [api, onLoadingChange, onSummaryChange, payrollPeriod, refreshKey]);

  const serviceRows = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Tuton", value: data.customers.services.tuton, color: "bg-indigo-500", soft: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" },
      { label: "Karya Ilmiah", value: data.customers.services.karil, color: "bg-cyan-500", soft: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300" },
      { label: "Metode Penelitian", value: data.customers.services.metode, color: "bg-emerald-500", soft: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
    ];
  }, [data]);
  const serviceMax = Math.max(1, ...serviceRows.map((row) => row.value));

  if (error) {
    return <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>;
  }
  if (!data) {
    return <div className="grid min-h-72 place-items-center rounded-3xl bg-white text-sm text-slate-400 dark:bg-slate-900">Menyiapkan ringkasan operasional…</div>;
  }

  const payrollSources = [
    { label: "Jam-jaman", value: data.payroll.hourlyEarned, note: `${data.payroll.hourlyHours.toFixed(2)} jam`, icon: <Clock3 size={18} />, tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300" },
    { label: "Harian", value: data.payroll.dailyEarned, note: `${data.payroll.dailyCount} pekerjaan`, icon: <BriefcaseBusiness size={18} />, tone: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300" },
    { label: "Borongan", value: data.payroll.pieceworkEarned, note: `${numberID.format(data.payroll.totalItems)} item`, icon: <Boxes size={18} />, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" },
  ];
  const payrollPeriodLabel = payrollPeriod === "week" ? "Minggu ini" : payrollPeriod === "year" ? "Tahun ini" : "Bulan ini";

  return (
    <motion.div
      className="space-y-5"
      variants={ownerDashboardVariants}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
    >
      <motion.div className="grid gap-4 md:grid-cols-3" variants={ownerSectionVariants}>
        <Metric
          label="Total customer"
          value={numberID.format(data.customers.total)}
          note={`${data.customers.services.tuton} Tuton · ${data.customers.services.karil} Karil · ${data.customers.services.metode} Metode Penelitian`}
          icon={<UsersRound size={21} />}
          tone="indigo"
        />
        <Metric
          label="Pekerja aktif"
          value={numberID.format(data.activeUsers)}
          note={`${data.workingNow} orang sedang bekerja atau mengambil jeda`}
          icon={<BriefcaseBusiness size={21} />}
          tone="cyan"
        />
        <Metric
          label="Perlu persetujuan"
          value={numberID.format(data.pendingApprovals)}
          note={data.pendingApprovals ? "Laporan menunggu pemeriksaan OWNER" : "Tidak ada laporan yang tertunda"}
          icon={<ClipboardCheck size={21} />}
          tone="amber"
        />
      </motion.div>

      <motion.section variants={ownerSectionVariants} className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_48px_rgba(15,23,42,.065)] ring-1 ring-slate-200/65 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f2fb] text-[#174d73] dark:bg-sky-400/10 dark:text-sky-300"><Landmark size={20} /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-slate-950 dark:text-white">Payroll terpadu</h2><Chip size="sm" variant="flat" className="bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">{payrollPeriodLabel}</Chip></div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Jam-jaman, harian, borongan, dan pembayaran dihitung pada periode yang sama.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800" aria-label="Periode payroll">
            {([
              ["week", "Minggu"],
              ["month", "Bulan"],
              ["year", "Tahun"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPayrollPeriod(value)}
                className={`min-h-9 rounded-xl px-3 text-xs font-extrabold transition ${payrollPeriod === value ? "bg-white text-[#174d73] shadow-sm dark:bg-[#17354e] dark:text-sky-200" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.08fr_.92fr]">
          <div className="rounded-[24px] bg-[#f3f7fb] p-5 ring-1 ring-[#dce8f2] dark:bg-[#102438] dark:ring-[#214158] sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#4c7392] dark:text-sky-300">Total upah · {payrollPeriodLabel}</p>
            <p className="mt-2 break-words text-3xl font-black tracking-tight text-[#102f4a] dark:text-white sm:text-4xl">{money(data.payroll.totalEarned)}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 dark:bg-white/[.055] dark:ring-white/10"><p className="text-xs text-slate-500 dark:text-slate-400">Pembayaran dicatat</p><p className="mt-2 text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{money(data.payroll.totalPaid)}</p></div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 dark:bg-white/[.055] dark:ring-white/10"><p className="text-xs text-slate-500 dark:text-slate-400">Selisih periode</p><p className="mt-2 text-lg font-extrabold text-amber-700 dark:text-amber-300">{money(data.payroll.balance)}</p></div>
            </div>
            <Button as={Link} to="/attendance?view=payroll" className="mt-5 min-h-11 bg-[#174d73] font-bold text-white" endContent={<ArrowRight size={16} />}>Kelola payroll</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {payrollSources.map((item) => (
              <article className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/65" key={item.label}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.tone}`}>{item.icon}</span>
                <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.label}</p><p className="mt-1 truncate text-lg font-black text-slate-950 dark:text-white">{money(item.value)}</p></div>
                <p className="shrink-0 text-[11px] font-semibold text-slate-400">{item.note}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section variants={ownerSectionVariants} className="rounded-[26px] bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,.055)] ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-800 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300"><GraduationCap size={21} /></span>
          <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-cyan-600 dark:text-cyan-300">Komposisi layanan</p><h2 className="mt-0.5 text-lg font-black text-slate-950 dark:text-white">Customer per layanan</h2></div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {serviceRows.map((service) => (
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/65" key={service.label}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{service.label}</span>
                <span className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm font-black ${service.soft}`}>{numberID.format(service.value)}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700"><div className={`h-full rounded-full ${service.color}`} style={{ width: `${Math.max(5, (service.value / serviceMax) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.div className="grid gap-5 xl:grid-cols-2" variants={ownerSectionVariants}>
        <ActivityPanel title="Aktivitas kerja terbaru" description="Harian dan borongan dari modul Absensi" icon={<Clock3 size={19} />}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentEntries.length ? data.recentEntries.map((entry) => (
              <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6" key={entry.id}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${entry.mode === "DAILY" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>{entry.mode === "DAILY" ? <BriefcaseBusiness size={17} /> : <Boxes size={17} />}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">{entry.user?.name || entry.user?.username}</p><p className="mt-0.5 text-xs text-slate-400">{fmtDate(entry.workDate)} · {entry.mode === "DAILY" ? "Harian" : "Borongan"}</p></div>
                <div className="text-right"><p className="text-sm font-black">{money(entry.finalAmount)}</p><Chip size="sm" variant="flat" color={entry.status === "APPROVED" ? "success" : entry.status === "PENDING" ? "warning" : "default"}>{entry.status}</Chip></div>
              </div>
            )) : <p className="px-6 py-10 text-center text-sm text-slate-400">Belum ada aktivitas kerja.</p>}
          </div>
        </ActivityPanel>

        <ActivityPanel
          title="Pembayaran customer terbaru"
          description="Transaksi pembayaran yang terakhir dicatat"
          icon={<Banknote size={20} />}
          footer={<Button as={Link} to="/customers" variant="flat" color="primary" className="min-h-11 w-full font-bold" endContent={<ArrowRight size={15} />}>Buka data customer</Button>}
        >
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentCustomerPayments.length ? data.recentCustomerPayments.map((payment) => (
              <Link className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-6" key={payment.id} to={`/customers/${payment.customer.id}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 size={18} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">{payment.customer.namaCustomer}</p><p className="mt-0.5 text-xs text-slate-400">{fmtDate(payment.tanggalBayar)} · NIM {payment.customer.nim}</p></div>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{money(payment.amount)}</p>
              </Link>
            )) : <p className="px-6 py-10 text-center text-sm text-slate-400">Belum ada transaksi customer.</p>}
          </div>
        </ActivityPanel>
      </motion.div>
    </motion.div>
  );
}
