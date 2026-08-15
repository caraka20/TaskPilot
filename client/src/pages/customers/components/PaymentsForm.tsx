import { useState } from "react";
import { Input, Button } from "@heroui/react";
import { CalendarDays, MessageSquareText, Save } from "lucide-react";
import type { AddPaymentPayload } from "../../../utils/customer";
import { toISODateOnly } from "../../../utils/customer";

const numberFormatter = new Intl.NumberFormat("id-ID");

export default function PaymentsForm({ onSubmit, busy, maximum }: {
  onSubmit: (payload: AddPaymentPayload) => Promise<void> | void;
  busy?: boolean;
  maximum?: number;
}) {
  const [amount, setAmount] = useState("");
  const [tanggalBayar, setTanggalBayar] = useState<string>(toISODateOnly(new Date()));
  const [catatan, setCatatan] = useState<string>("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const amountNumber = Number(amount || 0);
  const displayedAmount = amount ? numberFormatter.format(amountNumber) : "";

  const save = async () => {
    if (!amountNumber || amountNumber <= 0) {
      setError("Jumlah pembayaran harus lebih dari Rp 0.");
      return;
    }
    if (maximum != null && maximum >= 0 && amountNumber > maximum) {
      setError(`Nominal tidak boleh melebihi sisa tagihan Rp ${numberFormatter.format(maximum)}.`);
      return;
    }
    setError("");
    if (busy || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        amount: amountNumber,
        tanggalBayar: tanggalBayar ? new Date(tanggalBayar).toISOString() : undefined,
        catatan: catatan.trim(),
      });
      setAmount("");
      setCatatan("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1.15fr)_minmax(180px,.85fr)] sm:items-end">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Nominal pembayaran</p>
            {maximum != null ? (
              <span className="text-[10px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                Maks. Rp {numberFormatter.format(Math.max(0, maximum))}
              </span>
            ) : null}
          </div>

          <Input
            aria-label="Nominal pembayaran"
            type="text"
            inputMode="numeric"
            startContent={<span className="text-base font-black text-[#1b5278] dark:text-sky-300">Rp</span>}
            placeholder="Masukkan nominal"
            variant="bordered"
            value={displayedAmount}
            isInvalid={Boolean(error)}
            errorMessage={error}
            onValueChange={(value) => {
              setAmount(value.replace(/\D/g, ""));
              setError("");
            }}
            classNames={{
              inputWrapper: "min-h-12 rounded-xl border-slate-200 bg-white px-3.5 shadow-none data-[hover=true]:border-sky-300 group-data-[focus=true]:border-sky-600 dark:border-slate-700 dark:bg-slate-950/40",
              input: "text-base font-black tabular-nums text-slate-950 placeholder:text-sm placeholder:font-normal dark:text-white",
              errorMessage: "text-xs",
            }}
          />
        </div>

        <Input
          label="Tanggal pembayaran"
          labelPlacement="outside"
          type="date"
          variant="bordered"
          value={tanggalBayar}
          onValueChange={setTanggalBayar}
          startContent={<CalendarDays className="h-4 w-4 text-slate-400" />}
          classNames={{
            label: "text-xs font-bold text-slate-700 dark:text-slate-200",
            inputWrapper: "min-h-12 rounded-xl border-slate-200 bg-white shadow-none data-[hover=true]:border-sky-300 group-data-[focus=true]:border-sky-600 dark:border-slate-700 dark:bg-slate-950/40",
          }}
        />
      </div>

      <div className="grid gap-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Input
          label="Catatan"
          labelPlacement="outside"
          placeholder="Contoh: Cicilan pertama"
          variant="bordered"
          value={catatan}
          onValueChange={setCatatan}
          startContent={<MessageSquareText className="h-4 w-4 text-slate-400" />}
          classNames={{
            label: "text-xs font-bold text-slate-700 dark:text-slate-200",
            inputWrapper: "min-h-12 rounded-xl border-slate-200 bg-white shadow-none data-[hover=true]:border-sky-300 group-data-[focus=true]:border-sky-600 dark:border-slate-700 dark:bg-slate-950/40",
          }}
        />
        <Button
          className="min-h-12 w-full rounded-xl bg-[#123a61] px-5 font-bold text-white shadow-[0_8px_20px_-12px_rgba(18,58,97,.8)] sm:w-auto"
          startContent={!submitting ? <Save className="h-4 w-4" /> : null}
          onPress={save}
          isLoading={busy || submitting}
          isDisabled={busy || submitting || (maximum != null && maximum <= 0)}
        >
          Simpan
        </Button>
      </div>
    </div>
  );
}
