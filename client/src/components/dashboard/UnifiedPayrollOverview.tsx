import { useEffect, useState } from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { ArrowRight, Banknote, Boxes, BriefcaseBusiness, CalendarDays, CircleDollarSign, ClipboardCheck, Clock3, History, Pin, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { currencyIDR } from "../../utils/format";

type PayrollData = {
  totalEarned: string | number;
  totalPaid: string | number;
  balance: string | number;
  attendanceCount?: number;
  totalWorkCount?: number;
  hourlyHours?: number;
  hourlyEarned?: string | number;
  dailyEarned?: string | number;
  pieceworkEarned?: string | number;
};
type Note = { id: string; title?: string | null; message: string };
type Payment = { id: string; paymentDate: string; amount: string | number; note?: string | null };

export default function UnifiedPayrollOverview({ owner }: { owner: boolean }) {
  const api = useApi();
  const [payroll, setPayroll] = useState<PayrollData | null>(null);
  const [pending, setPending] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!owner) {
      Promise.all([
        api.get("/api/attendance/dashboard/me"),
        api.get("/api/attendance/payroll/me"),
      ]).then(([dashboardResponse, payrollResponse]) => {
        setPayroll(payrollResponse.data.summary ?? dashboardResponse.data.summary);
        setNotes(Array.isArray(dashboardResponse.data.notes) ? dashboardResponse.data.notes : []);
        setPayments(Array.isArray(payrollResponse.data.payments) ? payrollResponse.data.payments : []);
      }).catch((cause) => setError(cause instanceof Error ? cause.message : "Ringkasan payroll gagal dimuat."));
      return;
    }

    api.get("/api/attendance/admin/dashboard").then(({ data }) => {
      if (owner) {
        setPayroll(data);
        setPending(Number(data.pendingApprovals ?? 0));
      }
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Ringkasan payroll gagal dimuat."));
  }, [api, owner]);

  const cards = [
    { label: "Total upah disetujui", value: payroll?.totalEarned, icon: CircleDollarSign, color: "from-indigo-500/15 to-cyan-500/5 text-indigo-600 dark:text-indigo-300" },
    { label: "Sudah dibayarkan", value: payroll?.totalPaid, icon: Banknote, color: "from-emerald-500/15 to-teal-500/5 text-emerald-600 dark:text-emerald-300" },
    { label: "Belum dibayarkan", value: payroll?.balance, icon: WalletCards, color: "from-amber-500/15 to-orange-500/5 text-amber-700 dark:text-amber-300" },
  ];

  return (
    <section className="space-y-4" aria-labelledby="unified-payroll-title">
      {!owner && notes.length ? (
        <div className="relative overflow-hidden rounded-3xl border border-amber-300/90 bg-[#fff9e8] p-4 shadow-[0_14px_36px_rgba(180,83,9,.10)] dark:border-amber-400/25 dark:bg-amber-400/10 sm:p-5">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-amber-300/25 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400 text-amber-950 shadow-sm"><Pin size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[.15em] text-amber-800 dark:text-amber-200">Catatan penting dari owner</p>
                <Chip size="sm" variant="flat" color="warning">{notes.length} pesan aktif</Chip>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {notes.map((note) => (
                  <article className="rounded-2xl border border-amber-200/80 bg-white/75 p-3.5 dark:border-amber-300/10 dark:bg-slate-950/30" key={note.id}>
                    <p className="font-black text-slate-900 dark:text-white">{note.title || "Informasi pekerjaan"}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{note.message}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden border border-indigo-200/70 bg-white shadow-[0_18px_55px_rgba(15,23,42,.07)] dark:border-indigo-400/20 dark:bg-slate-900">
        <div className="h-1 bg-gradient-to-r from-[#1b4f75] via-sky-500 to-teal-500" />
        <CardBody className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-300">ARTECH Workforce</p>
                <Chip size="sm" color="success" variant="flat">Tiga sumber tergabung</Chip>
                {owner && pending > 0 ? <Chip size="sm" color="danger" variant="solid" startContent={<ClipboardCheck size={13} />}>{pending} perlu persetujuan</Chip> : null}
              </div>
              <h2 id="unified-payroll-title" className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">Ringkasan upah terpadu</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jam-jaman ARTECH, pekerjaan harian, dan borongan Absensi digabung tanpa menghitung arsip migrasi dua kali.</p>
            </div>
            <Button as={Link} to={owner ? "/attendance" : "/attendance?view=earnings"} color="primary" endContent={<ArrowRight size={16} />} className="min-h-11 bg-[#1b4f75] font-bold text-white">{owner ? "Buka Absensi & Payroll" : "Lihat seluruh penghasilan"}</Button>
          </div>
          {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map(({ label, value, icon: Icon, color }) => (
              <div className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br p-4 dark:border-slate-700 ${color}`} key={label}>
                <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p><Icon size={19} /></div>
                <p className="mt-4 break-words text-xl font-black tracking-tight text-slate-950 dark:text-white">{currencyIDR.format(Number(value ?? 0))}</p>
              </div>
            ))}
          </div>
          {!owner ? (
            <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60 sm:grid-cols-3">
              {[
                { label: "Jam-jaman", value: payroll?.hourlyEarned, note: `${Number(payroll?.hourlyHours ?? 0).toFixed(2)} jam`, icon: Clock3 },
                { label: "Harian", value: payroll?.dailyEarned, note: "Absensi harian", icon: BriefcaseBusiness },
                { label: "Borongan", value: payroll?.pieceworkEarned, note: "Hasil produksi", icon: Boxes },
              ].map(({ label, value, note, icon: Icon }) => (
                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 dark:bg-slate-900" key={label}>
                  <Icon className="shrink-0 text-indigo-500" size={17} />
                  <div className="min-w-0"><p className="text-[11px] font-bold text-slate-400">{label} · {note}</p><p className="truncate text-sm font-black text-slate-800 dark:text-slate-100">{currencyIDR.format(Number(value ?? 0))}</p></div>
                </div>
              ))}
            </div>
          ) : null}
          {!owner && typeof payroll?.totalWorkCount === "number" ? <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total pekerjaan tercatat: {payroll.totalWorkCount.toLocaleString("id-ID")} entri dari seluruh sistem kerja.</p> : null}
        </CardBody>
      </Card>

      {!owner ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,.055)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 text-[#1b4f75] dark:bg-sky-400/10 dark:text-sky-300"><History size={19} /></span>
              <div><h3 className="font-black text-slate-950 dark:text-white">Histori pengambilan gaji</h3><p className="mt-0.5 text-xs text-slate-400">Pembayaran terbaru yang sudah dicatat owner.</p></div>
            </div>
            <Button as={Link} to="/attendance?view=earnings" size="sm" variant="flat" className="font-bold text-[#1b4f75] dark:text-sky-300" endContent={<ArrowRight size={14} />}>Lihat semua</Button>
          </div>
          {payments.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.slice(0, 3).map((payment) => (
                <div className="flex items-center gap-3 px-5 py-3.5" key={payment.id}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><CalendarDays size={17} /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">{payment.note || "Pembayaran gaji"}</p><p className="mt-0.5 text-xs text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(payment.paymentDate))}</p></div>
                  <p className="shrink-0 text-sm font-black text-emerald-700 dark:text-emerald-300">{currencyIDR.format(Number(payment.amount))}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center"><Banknote className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-500">Belum ada pengambilan gaji.</p></div>
          )}
        </div>
      ) : null}
    </section>
  );
}
