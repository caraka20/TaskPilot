"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Banknote, BriefcaseBusiness, Check, CircleDollarSign, Clock3, Fingerprint, Info, ListChecks, LogOut, MessageSquareText, PackageOpen, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@attendance/lib/api";
import { currency, formatTime, workStatusLabel } from "@attendance/lib/format";
import type { DashboardNote, PayrollSummary, Product, TaskOccurrence, WorkEntry, WorkMode } from "@attendance/types/api";
import { Badge } from "@attendance/components/ui/badge";
import { Button } from "@attendance/components/ui/button";
import { Card, CardContent, CardHeader } from "@attendance/components/ui/card";
import { Alert, EmptyState } from "@attendance/components/ui/feedback";
import { Field, Input, Textarea } from "@attendance/components/ui/form";
import { Page, PageHeader } from "@attendance/components/ui/page";

type DashboardData = {
  workEntry: WorkEntry | null;
  notes: DashboardNote[];
  summary: PayrollSummary;
  tasks: TaskOccurrence[];
  dailyRate: string | number;
};

function EntryStatusNotice({ entry }: { entry: WorkEntry }) {
  if (entry.status === "PENDING") {
    return <Alert tone="info">Laporan sudah dikirim dan menunggu persetujuan OWNER. Nominal akan masuk ke payroll setelah disetujui.</Alert>;
  }
  if (entry.status === "APPROVED") {
    return <Alert tone="success">Laporan sudah disetujui dan nominalnya telah masuk ke payroll terpadu.</Alert>;
  }
  if (entry.status === "REJECTED") {
    return <Alert>Laporan ditolak. Hubungi OWNER untuk koreksi data pekerjaan.</Alert>;
  }
  return null;
}

export function EmployeeTodayPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<WorkMode>("DAILY");
  const [note, setNote] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [dashboard, productResult] = await Promise.all([
        api<DashboardData>("/dashboard/me"),
        api<{ products: Product[] }>("/products"),
      ]);
      setData(dashboard);
      setProducts(productResult.products);
      if (dashboard.workEntry) {
        setMode(dashboard.workEntry.mode);
        setNote(dashboard.workEntry.note ?? "");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data pekerjaan hari ini gagal dimuat.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function checkIn() {
    setLoading(true);
    setError("");
    try {
      await api("/work-entries/check-in", { method: "POST", body: JSON.stringify({ mode, note }) });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Absen masuk gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function checkOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data?.workEntry) return;
    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));
    setLoading(true);
    setError("");
    try {
      await api(`/work-entries/${data.workEntry.id}/check-out`, { method: "PATCH", body: JSON.stringify({ note, items }) });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Absen pulang gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task: TaskOccurrence) {
    try {
      await api(`/tasks/${task.id}/complete`, { method: "PATCH", body: JSON.stringify({ completed: task.status !== "COMPLETED" }) });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Status tugas gagal diperbarui.");
    }
  }

  const entry = data?.workEntry;
  const dailyRate = Number(entry?.dailyRateSnapshot ?? data?.dailyRate ?? 0);
  const dailyRateReady = dailyRate > 0;
  const expectedAmount = Number(entry?.finalAmount || entry?.dailyRateSnapshot || 0);
  const completedTasks = data?.tasks.filter((task) => task.status === "COMPLETED").length ?? 0;

  return (
    <Page>
      <PageHeader
        eyebrow="ARTECH Workforce"
        title="Absensi & pekerjaan"
        description="Jalankan pekerjaan Harian atau Borongan, kirim laporan, lalu pantau proses persetujuannya."
        action={<Link to="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-[#174c6d] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300">Ringkasan dashboard <ArrowRight size={15} /></Link>}
      />

      {error ? <Alert>{error}</Alert> : null}

      {data?.notes.length ? (
        <section aria-label="Catatan penting dari owner" className="overflow-hidden rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 shadow-sm dark:border-amber-400/25 dark:from-amber-500/15 dark:via-orange-500/10 dark:to-rose-500/10">
          <div className="flex items-center gap-2 border-b border-amber-200/70 px-4 py-3 text-xs font-black uppercase tracking-[.14em] text-amber-800 dark:border-amber-400/15 dark:text-amber-200"><Pin size={15} /> Catatan penting dari OWNER</div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {data.notes.map((adminNote) => (
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70" key={adminNote.id}>
                <div className="flex gap-3"><MessageSquareText className="shrink-0 text-indigo-600 dark:text-indigo-300" size={19} /><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">{adminNote.title || "Informasi pekerjaan"}</p><p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{adminNote.message}</p></div></div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tarif Harian", value: dailyRateReady ? currency.format(dailyRate) : "Belum diatur", note: "Tarif efektif per hari", icon: BriefcaseBusiness, tone: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
          { label: "Status hari ini", value: entry ? workStatusLabel(entry.status) : "Belum absen", note: entry?.mode === "PIECEWORK" ? "Mode Borongan" : "Mode Harian", icon: Clock3, tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" },
          { label: "Nominal laporan", value: currency.format(expectedAmount), note: entry?.status === "APPROVED" ? "Sudah masuk payroll" : "Masuk setelah disetujui", icon: CircleDollarSign, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
          { label: "Tugas hari ini", value: `${completedTasks}/${data?.tasks.length ?? 0} selesai`, note: "Checklist operasional", icon: ListChecks, tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
        ].map(({ label, value, note: statNote, icon: Icon, tone }) => (
          <Card className="p-4" key={label}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 truncate text-base font-extrabold text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-[10px] text-slate-400">{statNote}</p></div><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span></div></Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.18fr_.82fr]">
        <Card className="overflow-hidden">
          <CardHeader title="Pekerjaan hari ini" description="Satu tanggal hanya dapat menggunakan satu mode pekerjaan." action={entry ? <Badge tone={entry.status === "APPROVED" ? "green" : entry.status === "REJECTED" ? "red" : "amber"}>{workStatusLabel(entry.status)}</Badge> : null} />
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
              {(["DAILY", "PIECEWORK"] as WorkMode[]).map((value) => (
                <button className={`flex min-h-12 items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition ${mode === value ? "bg-white text-[#12335d] shadow-sm dark:bg-slate-900 dark:text-sky-300" : "text-slate-400 hover:text-slate-600"}`} disabled={!!entry} key={value} onClick={() => setMode(value)} type="button">{value === "DAILY" ? <BriefcaseBusiness size={17} /> : <PackageOpen size={17} />}{value === "DAILY" ? "Harian" : "Borongan"}</button>
              ))}
            </div>

            {mode === "DAILY" && !dailyRateReady && !entry ? <Alert>Tarif Harian akun ini masih Rp0. Minta OWNER mengaturnya melalui menu Users sebelum memulai pekerjaan Harian.</Alert> : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Waktu Indonesia Barat</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">{new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })}</p>
              {entry ? <p className="mt-2 text-xs text-slate-500">Masuk pukul {formatTime(entry.clockIn)}{entry.clockOut ? ` · Pulang pukul ${formatTime(entry.clockOut)}` : ""}</p> : <p className="mt-2 text-xs text-slate-500">Nominal pekerjaan dikunci sebagai snapshot saat absen masuk.</p>}
            </div>

            {!entry ? <div className="space-y-4"><Field label="Catatan pekerjaan" hint="Boleh dilengkapi kembali saat absen pulang."><Textarea onChange={(event) => setNote(event.target.value)} placeholder="Apa yang akan dikerjakan hari ini?" value={note} /></Field><Button className="w-full" disabled={mode === "DAILY" && !dailyRateReady} loading={loading} onClick={() => void checkIn()}><Fingerprint size={17} /> Absen masuk {mode === "DAILY" && dailyRateReady ? `· ${currency.format(dailyRate)}` : ""}</Button></div> : null}

            {entry?.status === "IN_PROGRESS" ? (
              <form className="space-y-4" onSubmit={checkOut}>
                {mode === "PIECEWORK" ? <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"><div className="border-b border-slate-100 p-4 dark:border-slate-800"><p className="text-xs font-extrabold">Hasil produksi</p><p className="mt-1 text-[10px] text-slate-400">Masukkan semua produk yang dikerjakan hari ini.</p></div><div className="grid gap-3 p-4 sm:grid-cols-2">{products.map((product) => <Field hint={`${currency.format(Number(product.rate))}/${product.unit}`} key={product.id} label={product.name}><Input min="0" onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: Number(event.target.value) }))} placeholder="0" type="number" /></Field>)}</div></div> : null}
                <Field label="Catatan pekerjaan"><Textarea onChange={(event) => setNote(event.target.value)} value={note} /></Field>
                <Button className="w-full" loading={loading} type="submit" variant="danger"><LogOut size={17} /> Absen pulang dan kirim</Button>
              </form>
            ) : null}

            {entry && entry.status !== "IN_PROGRESS" ? <div className="space-y-3"><EntryStatusNotice entry={entry} /><div className="rounded-2xl bg-slate-50 p-5 text-center dark:bg-slate-800/60"><Check className="mx-auto text-emerald-600" size={28} /><p className="mt-3 text-sm font-extrabold">Laporan hari ini sudah dikirim</p><p className="mt-1 text-xs leading-5 text-slate-500">Status dan nominal akan diperbarui setelah OWNER memeriksanya.</p></div></div> : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card><CardHeader title="Ringkasan penghasilan" description="Hanya pekerjaan berstatus Disetujui yang dihitung." /><CardContent className="space-y-3"><div className="rounded-2xl bg-gradient-to-br from-[#123c5b] to-[#176f69] p-5 text-white"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-white/70">Sisa gaji tersedia</p><Banknote size={20} /></div><p className="mt-3 text-2xl font-black">{currency.format(Number(data?.summary.balance ?? 0))}</p></div><div className="flex items-start gap-3 rounded-2xl bg-sky-50 p-4 text-sky-800 dark:bg-sky-500/10 dark:text-sky-200"><Info className="mt-0.5 shrink-0" size={17} /><p className="text-xs font-semibold leading-5">Dashboard menampilkan ringkasan semua upah. Pencatatan Harian dan Borongan tetap dilakukan di halaman Absensi ini.</p></div></CardContent></Card>

          <Card>
            <CardHeader title="Tugas hari ini" description="Tandai selesai tanpa menunggu persetujuan laporan." />
            {data?.tasks.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{data.tasks.map((task) => <button className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60" key={task.id} onClick={() => void toggleTask(task)} type="button"><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${task.status === "COMPLETED" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}>{task.status === "COMPLETED" ? <Check size={12} /> : null}</span><span><span className={`block text-xs font-extrabold ${task.status === "COMPLETED" ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}>{task.schedule.template.title}</span><span className="mt-1 block text-[10px] leading-5 text-slate-400">{task.schedule.template.description}</span></span></button>)}</div> : <EmptyState title="Tidak ada tugas" description="OWNER belum memetakan tugas untuk hari ini." />}
          </Card>
        </div>
      </div>
    </Page>
  );
}
