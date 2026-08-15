"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Product, User, WorkEntry, WorkMode, WorkStatus } from "@attendance/types/api";
import { currency, todayInput } from "@attendance/lib/format";
import { Button } from "@attendance/components/ui/button";
import { DateField, Field, Input, Select, Textarea } from "@attendance/components/ui/form";
import { Alert } from "@attendance/components/ui/feedback";

function dateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export type WorkEntryPayload = {
  userId?: string;
  workDate: string;
  mode: WorkMode;
  clockIn: string | null;
  clockOut: string | null;
  note: string;
  items: Array<{ productId: string; quantity: number }>;
  finalAmount?: string;
  manualAmount?: boolean;
  status: WorkStatus;
  reason: string;
};

export function WorkEntryForm({
  users,
  products,
  initial,
  onSubmit,
  onCancel,
}: {
  users: User[];
  products: Product[];
  initial?: WorkEntry | null;
  onSubmit: (payload: WorkEntryPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<WorkMode>(initial?.mode ?? "DAILY");
  const [manualAmount, setManualAmount] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(initial?.userId ?? "");
  const [workDate, setWorkDate] = useState(initial?.workDate.slice(0, 10) ?? todayInput());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const initialQuantity = useMemo(
    () => Object.fromEntries((initial?.items ?? []).map((item) => [item.productId, item.quantity])),
    [initial],
  );
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [selectedUserId, users],
  );
  const automaticDailyRate = Number(
    initial?.dailyRateSnapshot ?? selectedUser?.dailyRate ?? 0,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const items = products
      .map((product) => ({
        productId: product.id,
        quantity: Number(form.get(`product_${product.id}`) ?? 0),
      }))
      .filter((item) => item.quantity > 0);
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        ...(initial ? {} : { userId: String(form.get("userId")) }),
        workDate: String(form.get("workDate")),
        mode,
        clockIn: form.get("clockIn") ? new Date(String(form.get("clockIn"))).toISOString() : null,
        clockOut: form.get("clockOut") ? new Date(String(form.get("clockOut"))).toISOString() : null,
        note: String(form.get("note") ?? ""),
        items,
        ...(mode === "PIECEWORK" && manualAmount && form.get("finalAmount")
          ? { finalAmount: String(form.get("finalAmount")) }
          : {}),
        ...(mode === "PIECEWORK" ? { manualAmount } : {}),
        status: String(form.get("status")) as WorkStatus,
        reason: String(form.get("reason")),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <Alert>{error}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {!initial ? (
          <Field label="Pengguna">
            <Select
              name="userId"
              required
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option disabled value="">Pilih pengguna</option>
              {users.filter((user) => user.isActive).map((user) => <option key={user.id} value={user.id}>{user.name} (@{user.username})</option>)}
            </Select>
          </Field>
        ) : (
          <Field label="Pengguna"><Input disabled value={initial.user?.name ?? initial.userId} /></Field>
        )}
        <DateField
          label="Tanggal kerja"
          value={workDate}
          onChange={(event) => setWorkDate(event.target.value)}
          max={todayInput()}
          name="workDate"
          required
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-extrabold text-slate-700">Jenis pekerjaan</p>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
          {(["DAILY", "PIECEWORK"] as WorkMode[]).map((value) => (
            <button
              className={`rounded-lg px-3 py-3 text-xs font-extrabold transition ${mode === value ? "bg-white text-[#12335d] shadow-sm" : "text-slate-400"}`}
              key={value}
              onClick={() => {
                setMode(value);
                if (value === "PIECEWORK") setManualAmount(false);
              }}
              type="button"
            >
              {value === "DAILY" ? "Harian" : "Borongan"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Jam masuk"><Input defaultValue={dateTimeInput(initial?.clockIn)} name="clockIn" type="datetime-local" /></Field>
        <Field label="Jam pulang"><Input defaultValue={dateTimeInput(initial?.clockOut)} name="clockOut" type="datetime-local" /></Field>
      </div>

      {mode === "PIECEWORK" ? (
        <div className="rounded-2xl border border-slate-200">
          <div className="border-b border-slate-100 px-4 py-3"><p className="text-xs font-extrabold">Hasil produksi</p><p className="mt-1 text-[11px] text-slate-400">Boleh memasukkan beberapa produk sekaligus.</p></div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {products.filter((product) => product.isActive).map((product) => (
              <Field key={product.id} label={product.name} hint={`${currency.format(Number(product.baseRate))}/${product.unit} (tarif dasar)`}>
                <Input defaultValue={initialQuantity[product.id] ?? ""} min="0" name={`product_${product.id}`} placeholder="0" type="number" />
              </Field>
            ))}
          </div>
        </div>
      ) : null}

      <Field label="Catatan pekerjaan"><Textarea defaultValue={initial?.note ?? ""} name="note" placeholder="Tuliskan pekerjaan, kendala, atau informasi penting…" /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        {mode === "PIECEWORK" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">Nominal borongan dihitung otomatis</p>
                <p className="mt-1 text-[11px] leading-5 text-emerald-700/80 dark:text-emerald-300/80">
                  Server menghitung ulang jumlah setiap produk memakai tarif snapshot saat koreksi disimpan.
                </p>
              </div>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
                <input
                  checked={manualAmount}
                  className="h-4 w-4 rounded border-emerald-300 accent-emerald-600"
                  onChange={(event) => setManualAmount(event.target.checked)}
                  type="checkbox"
                />
                Nominal manual
              </label>
            </div>
            {manualAmount ? (
              <div className="mt-4">
                <Field label="Nominal akhir manual" hint="Gunakan hanya jika nilai hasil perhitungan memang perlu dikoreksi secara khusus.">
                  <Input defaultValue={initial?.finalAmount ?? ""} min="0" name="finalAmount" placeholder="Masukkan nominal" required type="number" />
                </Field>
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={`rounded-2xl border p-4 ${
              automaticDailyRate > 0
                ? "border-sky-200 bg-sky-50/75 dark:border-sky-500/20 dark:bg-sky-500/10"
                : "border-amber-200 bg-amber-50/80 dark:border-amber-500/25 dark:bg-amber-500/10"
            }`}
          >
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              Nominal Harian otomatis
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-[#12335d] dark:text-sky-200">
              {currency.format(automaticDailyRate)}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              Sistem mengambil tarif efektif user pada {workDate}. Nominal final disimpan sebagai snapshot oleh server.
            </p>
            {automaticDailyRate <= 0 ? (
              <p className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                Atur tarif Harian user terlebih dahulu agar absensi tidak bernilai Rp0.
              </p>
            ) : null}
          </div>
        )}
        <Field label="Status">
          <Select defaultValue={initial?.status === "IN_PROGRESS" ? "PENDING" : initial?.status ?? "PENDING"} name="status">
            <option value="PENDING">Menunggu pemeriksaan</option>
            <option value="APPROVED">Disetujui</option>
          </Select>
        </Field>
      </div>
      <Field label="Alasan pencatatan/koreksi"><Input defaultValue={initial?.correctionReason ?? ""} maxLength={255} minLength={3} name="reason" placeholder="Contoh: Jam pulang dikonfirmasi oleh supervisor" required /></Field>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button onClick={onCancel} type="button" variant="secondary">Batal</Button>
        <Button loading={loading} type="submit">{initial ? "Simpan koreksi" : "Buat absensi"}</Button>
      </div>
    </form>
  );
}
