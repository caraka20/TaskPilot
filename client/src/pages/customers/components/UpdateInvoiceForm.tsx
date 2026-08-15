import { useEffect, useState } from "react";
import { Input, Button } from "@heroui/react";
import { Save } from "lucide-react";

const numberFormatter = new Intl.NumberFormat("id-ID");

export default function UpdateInvoiceForm({ initialTotal, onSubmit, busy }: {
  initialTotal?: number;
  onSubmit: (totalBayar: number) => Promise<void> | void;
  busy?: boolean;
}) {
  const [total, setTotal] = useState(initialTotal == null ? "" : String(initialTotal));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const unchanged = Number(total || 0) === Number(initialTotal ?? 0);

  useEffect(() => {
    setTotal(initialTotal == null ? "" : String(initialTotal));
  }, [initialTotal]);

  const save = async () => {
    const numericTotal = Number(total || 0);
    if (total === "" || !Number.isFinite(numericTotal) || numericTotal < 0) {
      setError("Nilai tagihan harus berupa angka nol atau lebih.");
      return;
    }
    setError("");
    if (busy || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(numericTotal);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-2.5">
      <Input
        label="Total nilai layanan"
        labelPlacement="outside"
        type="text"
        inputMode="numeric"
        startContent={<span className="text-sm font-black text-slate-500">Rp</span>}
        placeholder="Masukkan nilai layanan"
        variant="bordered"
        value={total ? numberFormatter.format(Number(total)) : ""}
        isInvalid={Boolean(error)}
        errorMessage={error}
        onValueChange={(value) => {
          setTotal(value.replace(/\D/g, ""));
          setError("");
        }}
        classNames={{
          label: "font-semibold text-slate-700 dark:text-slate-200",
          inputWrapper: "min-h-12 rounded-xl border-slate-200 bg-white shadow-none group-data-[focus=true]:border-sky-600 dark:border-slate-700 dark:bg-slate-950/40",
          input: "font-bold tabular-nums text-slate-950 placeholder:font-normal dark:text-white",
        }}
      />
      <Button
        className="min-h-11 w-full rounded-xl bg-[#173f5f] px-5 font-bold text-white shadow-[0_8px_18px_-10px_rgba(23,63,95,.55)] dark:bg-sky-100 dark:text-slate-950"
        startContent={!submitting ? <Save className="h-4 w-4" /> : null}
        onPress={save}
        isLoading={busy || submitting}
        isDisabled={busy || submitting || unchanged}
      >
        Perbarui
      </Button>
    </div>
  );
}
