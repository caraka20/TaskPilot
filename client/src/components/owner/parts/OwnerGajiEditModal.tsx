import { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import {
  ArrowRight,
  Banknote,
  Check,
  FilePenLine,
  FileText,
  History,
  ShieldCheck,
} from "lucide-react";
import OperationalModal from "../../common/OperationalModal";
import type { EditPayload } from "../OwnerGajiTable";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: EditPayload) => Promise<void> | void;
  initialJumlah?: number;
  initialCatatan?: string;
};

type FieldErrors = {
  form?: string;
  jumlah?: string;
};

const QUICK_AMOUNTS = [100_000, 250_000, 500_000, 1_000_000] as const;

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function OwnerGajiEditModal({
  open,
  onClose,
  onSubmit,
  initialJumlah,
  initialCatatan,
}: Props) {
  const [jumlah, setJumlah] = useState<string>("");
  const [catatan, setCatatan] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setJumlah(initialJumlah != null ? String(initialJumlah) : "");
      setCatatan(initialCatatan ?? "");
      setFieldErrors({});
    }
  }, [open, initialJumlah, initialCatatan]);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const hasJumlah = jumlah.trim().length > 0;
    const hasCatatan = catatan.trim().length > 0;

    if (!hasJumlah && !hasCatatan) {
      errors.form = "Isi setidaknya salah satu: jumlah pembayaran atau catatan.";
    }

    if (hasJumlah) {
      const value = Number(jumlah);
      if (Number.isNaN(value) || value <= 0) {
        errors.jumlah = "Jumlah pembayaran harus lebih dari Rp 0.";
      }
    }

    return errors;
  }

  async function handleSave() {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      await onSubmit({
        jumlahBayar: jumlah ? Number(jumlah) : undefined,
        catatan: catatan.trim() ? catatan.trim() : undefined,
      });
      // sukses → parent yang menutup modal
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (!saving) onClose();
  }

  const numericAmount = Number(jumlah);
  const hasValidAmount =
    jumlah.trim().length > 0 && Number.isFinite(numericAmount) && numericAmount > 0;
  const currentAmount = initialJumlah ?? 0;
  const resultingAmount = hasValidAmount ? numericAmount : currentAmount;
  const amountChanged = hasValidAmount && numericAmount !== currentAmount;
  const noteChanged = catatan.trim() !== (initialCatatan ?? "").trim();

  return (
    <OperationalModal
      isOpen={open}
      size="form"
      onClose={handleClose}
      isDismissable={false}
      title="Edit Pembayaran"
      description="Perbarui nominal atau catatan transaksi pembayaran yang dipilih."
      footer={
        <>
          <Button
            variant="flat"
            onPress={handleClose}
            isDisabled={saving}
            className="min-h-12 rounded-xl font-semibold text-slate-600 sm:min-w-28 dark:text-slate-300"
          >
            Batal
          </Button>
          <Button
            color="primary"
            isLoading={saving}
            onPress={() => void handleSave()}
            startContent={!saving ? <Check className="h-4 w-4" /> : null}
            className="min-h-12 rounded-xl bg-[#102a4c] px-6 font-bold text-white shadow-[0_12px_30px_-16px_rgba(15,42,76,.9)] sm:min-w-48 dark:bg-indigo-500"
          >
            Simpan Perubahan
          </Button>
        </>
      }
    >
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        <section className="relative overflow-hidden rounded-2xl bg-[#102a4c] p-5 text-white shadow-[0_18px_50px_-28px_rgba(15,42,76,.9)] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-sky-400/15 blur-3xl" />

          <div className="relative mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-sky-200">
              <History className="h-4 w-4" />
              Perubahan nominal
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Transaksi tercatat
            </div>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-xl border border-white/10 bg-white/[.07] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[.13em] text-slate-400">
                Nominal saat ini
              </p>
              <p className="mt-2 break-words text-xl font-black tracking-tight text-slate-100 sm:text-2xl">
                {rupiahFormatter.format(currentAmount)}
              </p>
            </div>

            <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-sky-300 sm:rotate-0" />

            <div className="rounded-xl border border-sky-300/20 bg-sky-300/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[.13em] text-sky-200">
                  Setelah disimpan
                </p>
                {amountChanged ? (
                  <span className="rounded-full bg-amber-300/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    Berubah
                  </span>
                ) : null}
              </div>
              <p className="mt-2 break-words text-xl font-black tracking-tight text-white sm:text-2xl">
                {rupiahFormatter.format(resultingAmount)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,.45)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
              <FilePenLine className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                Detail perubahan
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Anda dapat memperbarui nominal, catatan, atau keduanya sekaligus.
              </p>
            </div>
          </div>

          {fieldErrors.form ? (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-200"
            >
              {fieldErrors.form}
            </div>
          ) : null}

          <div className="grid gap-5">
            <Input
              label="Jumlah Bayar"
              labelPlacement="outside"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="0"
              value={jumlah}
              onChange={(event) => {
                setJumlah(event.target.value);
                if (fieldErrors.jumlah || fieldErrors.form) {
                  setFieldErrors((current) => ({
                    ...current,
                    jumlah: undefined,
                    form: undefined,
                  }));
                }
              }}
              isInvalid={Boolean(fieldErrors.jumlah)}
              errorMessage={fieldErrors.jumlah}
              startContent={<span className="text-sm font-bold text-slate-500">Rp</span>}
              description="Kosongkan bila nominal tidak ingin diubah."
              aria-label="Jumlah bayar"
              classNames={{
                label: "font-bold text-slate-700 dark:text-slate-200",
                input: "text-base font-bold tabular-nums",
                inputWrapper:
                  "min-h-13 rounded-xl border border-slate-200 bg-slate-50 shadow-none transition-colors group-data-[focus=true]:border-indigo-400 group-data-[focus=true]:bg-white dark:border-slate-700 dark:bg-slate-950/70",
              }}
            />

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-slate-400">
                Pilih nominal cepat
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUICK_AMOUNTS.map((amount) => {
                  const selected = numericAmount === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setJumlah(String(amount));
                        setFieldErrors((current) => ({
                          ...current,
                          jumlah: undefined,
                          form: undefined,
                        }));
                      }}
                      className={`min-h-11 rounded-xl border px-3 text-sm font-bold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/15 dark:text-indigo-200"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                      }`}
                    >
                      {rupiahFormatter.format(amount).replace(/\s/g, "")}
                    </button>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="Catatan"
              labelPlacement="outside"
              placeholder="Contoh: Koreksi pembayaran gaji periode Agustus 2026"
              value={catatan}
              onChange={(event) => {
                setCatatan(event.target.value);
                if (fieldErrors.form) {
                  setFieldErrors((current) => ({ ...current, form: undefined }));
                }
              }}
              minRows={3}
              maxRows={6}
              description={`${catatan.length} karakter · Kosongkan bila catatan tidak ingin diperbarui.`}
              startContent={<FileText className="mt-1 h-4 w-4 text-slate-400" />}
              aria-label="Catatan"
              classNames={{
                label: "font-bold text-slate-700 dark:text-slate-200",
                inputWrapper:
                  "rounded-xl border border-slate-200 bg-slate-50 shadow-none transition-colors group-data-[focus=true]:border-indigo-400 group-data-[focus=true]:bg-white dark:border-slate-700 dark:bg-slate-950/70",
              }}
            />

            <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100">
              <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
              <p>
                Perubahan akan memperbarui transaksi ini saja dan langsung tercermin pada ringkasan payroll.
                {noteChanged ? " Catatan juga akan diperbarui." : ""}
              </p>
            </div>
          </div>
        </section>
      </div>
    </OperationalModal>
  );
}