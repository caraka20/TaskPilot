"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Banknote,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageSquareText,
  PencilLine,
  ReceiptText,
  ShieldCheck,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { api, download } from "@attendance/lib/api";
import { currency, formatDate, todayInput } from "@attendance/lib/format";
import type { Payment, PayrollSummary, User, WorkEntry } from "@attendance/types/api";
import { Button } from "@attendance/components/ui/button";
import { Card } from "@attendance/components/ui/card";
import { Alert, EmptyState } from "@attendance/components/ui/feedback";
import { DateField, Field, Input, Textarea } from "@attendance/components/ui/form";
import { Modal } from "@attendance/components/ui/modal";
import { Page, PageHeader } from "@attendance/components/ui/page";
import { useFeedback } from "@attendance/components/ui/feedback-provider";

type PayrollRow = User & PayrollSummary;
type PayrollDetail = { user: User; summary: PayrollSummary; payments: Payment[]; entries: WorkEntry[] };

const rupiahInputFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function normalizeRupiahInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // Hilangkan nol di depan agar nilai seperti 0005000 tidak terlihat sebagai
  // placeholder dan tetap dikirim ke API sebagai angka mentah.
  return digits.replace(/^0+(?=\d)/, "").slice(0, 15);
}

type PayrollPaymentFormProps = {
  payment: Payment | "new";
  detail: PayrollDetail | null;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function PayrollPaymentForm({
  payment,
  detail,
  saving,
  error,
  onCancel,
  onSubmit,
}: PayrollPaymentFormProps) {
  const isNew = payment === "new";
  const initialAmount = isNew ? "" : String(payment.amount);
  const [paymentDate, setPaymentDate] = useState(
    isNew ? todayInput() : payment.paymentDate.slice(0, 10),
  );
  const [amount, setAmount] = useState(initialAmount);
  const [note, setNote] = useState(isNew ? "" : payment.note ?? "");
  const [reason, setReason] = useState("");

  const balance = Number(detail?.summary.balance ?? 0);
  const numericAmount = Number(amount);
  const validAmount = amount !== "" && Number.isFinite(numericAmount) && numericAmount > 0;
  const previewAmount = validAmount ? numericAmount : 0;
  const remainingBalance = isNew && validAmount ? Math.max(0, balance - numericAmount) : balance;
  const amountExceedsBalance = isNew && validAmount && numericAmount > balance;
  const formattedAmount = amount ? rupiahInputFormatter.format(numericAmount) : "";

  const quickAmounts = isNew
    ? [
        { label: "25% saldo", value: Math.floor(balance * 0.25) },
        { label: "50% saldo", value: Math.floor(balance * 0.5) },
        { label: "Lunasi saldo", value: balance },
      ].filter(
        (item, index, items) =>
          item.value > 0 && items.findIndex((candidate) => candidate.value === item.value) === index,
      )
    : [];

  return (
    <form className="min-h-full" onSubmit={onSubmit}>
      <div className="mx-auto grid w-full max-w-4xl gap-5">
        <section className="relative overflow-hidden rounded-2xl bg-[#102a4c] p-5 text-white shadow-[0_18px_50px_-28px_rgba(15,42,76,.9)] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-sky-200">
                <CircleDollarSign className="h-4 w-4" />
                {isNew ? "Nominal pembayaran" : "Koreksi nominal"}
              </div>
              <p className="break-words text-3xl font-black tracking-tight sm:text-4xl">
                {currency.format(previewAmount)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {isNew
                  ? `Dari saldo tersedia ${currency.format(balance)}`
                  : `Nominal sebelumnya ${currency.format(Number(payment.amount))}`}
              </p>
            </div>

            <div className="grid min-w-[14rem] grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[.08] p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isNew ? "Sisa saldo" : "Status"}
                </p>
                <p className="mt-1 text-sm font-extrabold text-white">
                  {isNew ? currency.format(remainingBalance) : "Koreksi"}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  Pencatatan
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Audit
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,.45)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <ReceiptText className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                Detail transaksi
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Pastikan tanggal dan nominal sudah sesuai sebelum pembayaran disimpan.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/80 dark:bg-slate-950/50 dark:ring-slate-700">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                <CalendarDays className="h-4 w-4 text-indigo-500" />
                Tanggal pengambilan
              </div>
              <DateField
                label="Pilih tanggal"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
                max={todayInput()}
                name="paymentDate"
                required
              />
            </div>

            <div className="rounded-xl bg-slate-50/80 p-4 ring-1 ring-slate-200/80 dark:bg-slate-950/50 dark:ring-slate-700">
              <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                <Banknote className="h-4 w-4 text-emerald-500" />
                Nominal pembayaran
              </div>
              <Field
                label="Jumlah yang dibayarkan"
                hint={
                  amountExceedsBalance
                    ? `Maksimal pembayaran ${currency.format(balance)}.`
                    : "Format Rupiah diterapkan otomatis saat Anda mengetik."
                }
              >
                <div
                  className={`grid min-h-[3.25rem] grid-cols-[3.5rem_minmax(0,1fr)] overflow-hidden rounded-xl border bg-white transition focus-within:ring-4 dark:bg-slate-900 ${
                    amountExceedsBalance
                      ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/15"
                      : "border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-500/15 dark:border-slate-700"
                  }`}
                >
                  <span className="grid place-items-center border-r border-slate-200 bg-slate-50 text-sm font-black text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    Rp
                  </span>
                  <input
                    aria-invalid={amountExceedsBalance}
                    aria-label="Jumlah pembayaran dalam Rupiah"
                    autoComplete="off"
                    autoFocus
                    className="min-w-0 bg-transparent px-4 py-3 text-lg font-black tabular-nums text-slate-950 outline-none placeholder:text-transparent dark:text-white"
                    inputMode="numeric"
                    required
                    value={formattedAmount}
                    onChange={(event) => setAmount(normalizeRupiahInput(event.target.value))}
                    type="text"
                  />
                  <input name="amount" type="hidden" value={amount} />
                </div>
              </Field>
            </div>
          </div>

          {quickAmounts.length ? (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[.13em] text-slate-400">
                Pilihan cepat
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {quickAmounts.map((item) => {
                  const selectedAmount = numericAmount === item.value;
                  return (
                    <button
                      key={`${item.label}-${item.value}`}
                      type="button"
                      onClick={() => setAmount(String(item.value))}
                      className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                        selectedAmount
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-200"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                      }`}
                    >
                      <span className="block">{item.label}</span>
                      <span className="mt-0.5 block text-[11px] font-semibold opacity-70">
                        {currency.format(item.value)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-5">
            <Field label="Keterangan" hint="Opsional, tetapi membantu saat memeriksa riwayat payroll.">
              <div className="relative">
                <MessageSquareText className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
                <Textarea
                  className="min-h-28 pl-11"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  name="note"
                  placeholder="Contoh: Pengambilan gaji sebagian"
                />
              </div>
            </Field>

            {!isNew ? (
              <Field label="Alasan koreksi" hint="Wajib diisi dan akan disimpan pada audit aktivitas.">
                <Input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  minLength={3}
                  name="reason"
                  placeholder="Contoh: Koreksi nominal salah input"
                  required
                />
              </Field>
            ) : null}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
            <p>
              Pembayaran akan mengurangi saldo gaji pengguna dan tercatat pada riwayat serta audit sistem.
            </p>
          </div>
        </section>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="hidden max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400 sm:block">
          Periksa kembali nominal karena transaksi langsung memengaruhi sisa gaji.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            className="min-h-12 sm:min-w-28"
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Batal
          </Button>
          <Button
            className="min-h-12 bg-[#102a4c] px-6 shadow-[0_12px_30px_-16px_rgba(15,42,76,.9)] sm:min-w-48"
            type="submit"
            loading={saving}
            disabled={amountExceedsBalance}
          >
            {!saving ? <Check size={16} /> : null}
            {isNew ? "Simpan pembayaran" : "Simpan koreksi"}
          </Button>
        </div>
      </div>
    </form>
  );
}

type PayrollDetailWorkspaceProps = {
  detail: PayrollDetail;
  onCreatePayment: () => void;
  onEditPayment: (payment: Payment) => void;
  onRemovePayment: (payment: Payment) => void;
  onDownloadSlip: () => void;
};

function PayrollDetailWorkspace({
  detail,
  onCreatePayment,
  onEditPayment,
  onRemovePayment,
  onDownloadSlip,
}: PayrollDetailWorkspaceProps) {
  const summary = detail.summary;
  const balance = Number(summary.balance);

  const earnings = [
    {
      label: "Jam-jaman",
      value: Number(summary.hourlyEarned),
      meta: `${Number(summary.hourlyHours).toFixed(2)} jam`,
      icon: Clock3,
      tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200",
    },
    {
      label: "Harian",
      value: Number(summary.dailyEarned),
      meta: `${summary.dailyCount} pekerjaan`,
      icon: BriefcaseBusiness,
      tone: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200",
    },
    {
      label: "Borongan",
      value: Number(summary.pieceworkEarned),
      meta: `${summary.totalItems} item`,
      icon: Boxes,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    },
  ];

  return (
    <div className="mx-auto grid w-full max-w-none gap-6">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(118deg,#102a4c_0%,#174766_58%,#0f766e_135%)] p-5 text-white shadow-[0_20px_55px_-30px_rgba(15,42,76,.9)] sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-sky-200">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-black sm:text-lg">{detail.user.name}</p>
                <p className="truncate text-xs font-semibold text-slate-400">@{detail.user.username}</p>
              </div>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-sky-200">
              Total upah terakumulasi
            </p>
            <p className="mt-2 break-words text-3xl font-black tracking-tight sm:text-4xl">
              {currency.format(Number(summary.totalEarned))}
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[29rem]">
            <div className="rounded-xl border border-white/10 bg-white/[.08] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sudah dibayar</p>
              <p className="mt-2 text-xl font-black text-white">
                {currency.format(Number(summary.totalPaid))}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/10 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Sisa gaji</p>
              <p className="mt-2 text-xl font-black text-emerald-200">
                {currency.format(balance)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-indigo-500 dark:text-indigo-300">
              Komposisi upah
            </p>
            <h3 className="mt-1 text-base font-black text-slate-950 dark:text-white">
              Sumber penghasilan
            </h3>
          </div>
          <p className="hidden text-xs text-slate-400 sm:block">{summary.totalWorkCount} entri pekerjaan</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {earnings.map((earning) => {
            const Icon = earning.icon;
            return (
              <article
                key={earning.label}
                className="rounded-2xl bg-white p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,.5)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400">{earning.label}</p>
                    <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                      {currency.format(earning.value)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{earning.meta}</p>
                  </div>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${earning.tone}`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_-34px_rgba(15,23,42,.55)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
        <div className="grid gap-4 border-b border-slate-200/70 p-4 dark:border-slate-800 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center sm:p-5">
          <div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">Riwayat pembayaran</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pembayaran dapat dilakukan sebagian atau beberapa kali.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
            <Button
              className="min-h-11"
              onClick={onCreatePayment}
              disabled={balance <= 0}
            >
              <Banknote size={15} />
              Catat pembayaran
            </Button>
            <Button className="min-h-11" variant="secondary" onClick={onDownloadSlip}>
              <FileText size={15} />
              Unduh slip PDF
            </Button>
          </div>
        </div>

        {detail.payments.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[46rem] table-fixed">
                <thead>
                  <tr>
                    <th className="w-[25%] px-5 py-3 text-left">Tanggal</th>
                    <th className="w-[38%] px-5 py-3 text-left">Keterangan</th>
                    <th className="w-[23%] px-5 py-3 text-right">Nominal</th>
                    <th className="w-[14%] px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-5 py-4 font-bold">{formatDate(payment.paymentDate)}</td>
                      <td className="break-words px-5 py-4">{payment.note || "Pembayaran gaji"}</td>
                      <td className="px-5 py-4 text-right font-extrabold">
                        {currency.format(Number(payment.amount))}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            aria-label="Edit pembayaran"
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditPayment(payment)}
                          >
                            <PencilLine size={14} />
                          </Button>
                          <Button
                            aria-label="Hapus pembayaran"
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemovePayment(payment)}
                          >
                            <Trash2 className="text-rose-600" size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {detail.payments.map((payment) => (
                <article
                  key={payment.id}
                  className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70 dark:bg-slate-950/50 dark:ring-slate-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950 dark:text-white">
                        {currency.format(Number(payment.amount))}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(payment.paymentDate)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {payment.note || "Pembayaran gaji"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        aria-label="Edit pembayaran"
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditPayment(payment)}
                      >
                        <PencilLine size={14} />
                      </Button>
                      <Button
                        aria-label="Hapus pembayaran"
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemovePayment(payment)}
                      >
                        <Trash2 className="text-rose-600" size={14} />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Belum ada pembayaran"
            description="Catat pembayaran ketika pengguna mengambil gaji."
          />
        )}
      </section>
    </div>
  );
}

export function PayrollPage() {
  const { confirm, toast } = useFeedback();
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [selected, setSelected] = useState<PayrollRow | null>(null);
  const [detail, setDetail] = useState<PayrollDetail | null>(null);
  const [paymentModal, setPaymentModal] = useState<Payment | "new" | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const portfolio = useMemo(
    () => rows.reduce(
      (total, row) => ({
        earned: total.earned + Number(row.totalEarned),
        paid: total.paid + Number(row.totalPaid),
        balance: total.balance + Number(row.balance),
        work: total.work + Number(row.totalWorkCount),
      }),
      { earned: 0, paid: 0, balance: 0, work: 0 },
    ),
    [rows],
  );

  const load = useCallback(async () => {
    try {
      const result = await api<{ users: PayrollRow[] }>("/admin/payroll/summary");
      setRows(result.users);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Penggajian gagal dimuat."); }
  }, []);

  const loadDetail = useCallback(async (userId: string) => {
    try { setDetail(await api<PayrollDetail>(`/admin/payroll/${userId}`)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Rincian gaji gagal dimuat."); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (selected) void loadDetail(selected.id); else setDetail(null); }, [loadDetail, selected]);

  async function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const form = new FormData(event.currentTarget);
    setSavingPayment(true);
    setPaymentError("");
    try {
      if (paymentModal === "new") {
        await api(`/admin/payroll/${selected.id}/payments`, {
          method: "POST",
          body: JSON.stringify({
            paymentDate: form.get("paymentDate"),
            amount: form.get("amount"),
            note: form.get("note"),
          }),
        });
      } else if (paymentModal) {
        await api(`/admin/payroll/payments/${paymentModal.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            paymentDate: form.get("paymentDate"),
            amount: form.get("amount"),
            note: form.get("note"),
            reason: form.get("reason"),
          }),
        });
      }

      const created = paymentModal === "new";
      setPaymentModal(null);
      setNotice("Transaksi pembayaran berhasil disimpan.");
      toast(created ? "Pembayaran berhasil dicatat" : "Pembayaran berhasil diperbarui", {
        description: `${selected.name} · ${currency.format(Number(form.get("amount") ?? 0))}`,
        tone: "success",
      });
      await load();
      await loadDetail(selected.id);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Pembayaran gagal disimpan.";
      setPaymentError(message);
      setError(message);
      toast("Pembayaran belum dapat disimpan", { description: message, tone: "error" });
    } finally {
      setSavingPayment(false);
    }
  }

  function openPaymentModal(payment: Payment | "new") {
    setPaymentError("");
    setPaymentModal(payment);
  }

  function closePaymentModal() {
    if (savingPayment) return;
    setPaymentError("");
    setPaymentModal(null);
  }

  async function removePayment(payment: Payment) {
    if (!selected) return;
    const accepted = await confirm({
      title: "Hapus transaksi pembayaran?",
      description: `${currency.format(Number(payment.amount))} pada ${formatDate(payment.paymentDate)} akan dibatalkan dan sisa gaji dihitung ulang. Tindakan dicatat dalam audit.`,
      confirmLabel: "Hapus pembayaran",
      tone: "danger",
      requireAcknowledgement: true,
    });
    if (!accepted) return;
    try { await api(`/admin/payroll/payments/${payment.id}`, { method: "DELETE", body: JSON.stringify({ reason: "Pembayaran dihapus melalui dashboard" }) }); setNotice("Pembayaran berhasil dihapus."); toast("Pembayaran dihapus", { description: "Sisa gaji telah dihitung ulang.", tone: "success" }); await load(); await loadDetail(selected.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Pembayaran gagal dihapus."); }
  }

  async function downloadSlip() {
    if (!selected) return;
    try {
      await download(`/admin/reports/payroll/${selected.id}.pdf`, `slip-gaji-${selected.username}.pdf`);
      toast("Slip gaji berhasil diunduh", {
        description: `PDF profesional untuk ${selected.name}.`,
        tone: "success",
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Slip PDF gagal diunduh.";
      setError(message);
      toast("Slip gaji gagal diunduh", { description: message, tone: "error" });
    }
  }

  return <Page>
    <PageHeader title="Penggajian" description="Pantau seluruh sumber upah, catat pembayaran, koreksi transaksi, dan terbitkan slip gaji PDF." />
    {error ? <Alert>{error}</Alert> : null}{notice ? <Alert tone="success">{notice}</Alert> : null}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan payroll">
      {[
        { label: "Total upah", value: currency.format(portfolio.earned), meta: `${portfolio.work} entri disetujui`, icon: CircleDollarSign, tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200" },
        { label: "Sudah dibayar", value: currency.format(portfolio.paid), meta: "Akumulasi transaksi", icon: ReceiptText, tone: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200" },
        { label: "Sisa payroll", value: currency.format(portfolio.balance), meta: `${rows.length} pengguna`, icon: WalletCards, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200" },
        { label: "Dokumen", value: "Slip PDF", meta: "Siap diunduh per user", icon: FileText, tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200" },
      ].map((item) => {
        const Icon = item.icon;
        return <article key={item.label} className="rounded-2xl bg-white p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,.55)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-400">{item.label}</p><p className="mt-2 text-xl font-black tracking-tight text-slate-950 dark:text-white">{item.value}</p><p className="mt-1 text-xs text-slate-400">{item.meta}</p></div><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tone}`}><Icon size={18} /></span></div>
        </article>;
      })}
    </section>
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800"><p className="font-extrabold text-slate-950 dark:text-white">Saldo payroll per pengguna</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Buka detail untuk mencatat pembayaran dan mengunduh slip gaji.</p></div>
      {rows.length ? <div className="table-wrap"><table><thead><tr><th>Pengguna</th><th>Pekerjaan</th><th>Jam-jaman</th><th>Harian + borongan</th><th>Total upah</th><th>Sudah dibayar</th><th>Sisa gaji</th><th /></tr></thead><tbody>{rows.map((user) => <tr key={user.id}><td><p className="font-extrabold text-slate-800 dark:text-slate-100">{user.name}</p><p className="mt-1 text-[10px] text-slate-400">@{user.username}</p></td><td>{user.totalWorkCount} entri</td><td><p className="font-bold">{currency.format(Number(user.hourlyEarned))}</p><p className="mt-1 text-[10px] text-slate-400">{Number(user.hourlyHours).toFixed(2)} jam</p></td><td><p className="font-bold">{currency.format(Number(user.attendanceEarned))}</p><p className="mt-1 text-[10px] text-slate-400">{user.dailyCount} harian · {user.pieceworkCount} borongan</p></td><td className="font-bold">{currency.format(Number(user.totalEarned))}</td><td>{currency.format(Number(user.totalPaid))}</td><td className="font-extrabold text-emerald-700 dark:text-emerald-300">{currency.format(Number(user.balance))}</td><td className="text-right"><Button size="sm" variant="secondary" onClick={() => setSelected(user)}><WalletCards size={14} />Kelola</Button></td></tr>)}</tbody></table></div> : <EmptyState title="Belum ada data gaji" description="Saldo pengguna muncul setelah pekerjaan jam-jaman atau laporan Absensi disetujui." />}
    </Card>

    <Modal open={selected !== null} onClose={() => setSelected(null)} size="xl" title={selected ? `Penggajian — ${selected.name}` : "Penggajian"} description="Ringkasan upah, saldo, dan transaksi pembayaran pengguna.">
      {detail ? (
        <PayrollDetailWorkspace
          detail={detail}
          onCreatePayment={() => openPaymentModal("new")}
          onEditPayment={openPaymentModal}
          onRemovePayment={(payment) => void removePayment(payment)}
          onDownloadSlip={() => void downloadSlip()}
        />
      ) : null}
      {!detail ? (
        <div className="grid min-h-64 place-items-center rounded-2xl bg-white text-sm font-semibold text-slate-400 ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
          Memuat rincian penggajian…
        </div>
      ) : null}
    </Modal>

    <Modal
      open={paymentModal !== null}
      onClose={closePaymentModal}
      size="md"
      title={paymentModal === "new" ? "Catat pembayaran" : "Koreksi pembayaran"}
      description={
        paymentModal === "new"
          ? "Catat pengambilan gaji dengan nominal dan tanggal yang tepat."
          : "Perbarui transaksi dengan alasan koreksi yang dapat ditelusuri."
      }
    >
      {paymentModal ? (
        <PayrollPaymentForm
          key={paymentModal === "new" ? "new-payment" : paymentModal.id}
          payment={paymentModal}
          detail={detail}
          saving={savingPayment}
          error={paymentError}
          onCancel={closePaymentModal}
          onSubmit={savePayment}
        />
      ) : null}
    </Modal>
  </Page>;
}
