import { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import {
  Banknote,
  Check,
  FileText,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import OperationalModal from "../../common/OperationalModal";
import type { CreatePayload } from "../OwnerGajiTable";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePayload) => Promise<void> | void;
  lockedUsername?: string;
};

type FieldErrors = {
  username?: string;
  jumlah?: string;
};

const QUICK_AMOUNTS = [100_000, 250_000, 500_000, 1_000_000] as const;

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function OwnerGajiCreateModal({ open, onClose, onSubmit, lockedUsername }: Props) {
  const [username, setUsername] = useState("");
  const [jumlah, setJumlah] = useState<string>("");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (open) {
      setUsername(lockedUsername ?? "");
      setJumlah("");
      setCatatan("");
      setFieldErrors({});
    }
  }, [open, lockedUsername]);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = "Username wajib diisi.";
    const val = Number(jumlah);
    if (!jumlah || Number.isNaN(val) || val <= 0) {
      errors.jumlah = "Jumlah pembayaran harus lebih dari Rp 0.";
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
        username: username.trim(),
        jumlahBayar: Number(jumlah),
        catatan: catatan.trim() ? catatan.trim() : null,
      });
      // sukses → parent akan menutup modal
    } finally {
      setSaving(false);
    }
  }

  const numericAmount = Number(jumlah);
  const amountPreview =
    jumlah && Number.isFinite(numericAmount) && numericAmount > 0
      ? rupiahFormatter.format(numericAmount)
      : "Rp 0";

  function handleClose() {
    if (!saving) onClose();
  }

  return (
    <OperationalModal
      isOpen={open}
      size="form"
      onClose={handleClose}
      isDismissable={false}
      title="Tambah Pembayaran"
      description="Catat pembayaran gaji dengan nominal dan penerima yang tepat."
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
            className="min-h-12 rounded-xl bg-[#102a4c] px-6 font-bold text-white shadow-[0_12px_30px_-16px_rgba(15,42,76,.9)] sm:min-w-44 dark:bg-indigo-500"
          >
            Simpan Pembayaran
          </Button>
        </>
      }
    >
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        <section className="relative overflow-hidden rounded-2xl bg-[#102a4c] p-5 text-white shadow-[0_18px_50px_-28px_rgba(15,42,76,.9)] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-sky-200">
                <Banknote className="h-4 w-4" />
                Nominal pembayaran
              </div>
              <p className="break-words text-3xl font-black tracking-tight sm:text-4xl">
                {amountPreview}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Nominal akan tercatat pada riwayat payroll pengguna.
              </p>
            </div>
            <div className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Transaksi internal
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,.45)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
              Detail pembayaran
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Pastikan penerima dan jumlah pembayaran sudah sesuai sebelum disimpan.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Username"
            labelPlacement="outside"
            placeholder="Contoh: raka20"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (fieldErrors.username) {
                setFieldErrors((current) => ({ ...current, username: undefined }));
              }
            }}
            isReadOnly={Boolean(lockedUsername)}
            isInvalid={Boolean(fieldErrors.username)}
            errorMessage={fieldErrors.username}
            description={lockedUsername ? "Penerima dikunci sesuai profil yang sedang dibuka." : "Username penerima pembayaran."}
            startContent={<UserRound className="h-4 w-4 text-slate-400" />}
            endContent={lockedUsername ? <LockKeyhole className="h-4 w-4 text-slate-400" /> : null}
            aria-label="Username"
            classNames={{
              label: "font-bold text-slate-700 dark:text-slate-200",
              inputWrapper:
                "min-h-13 rounded-xl border border-slate-200 bg-slate-50 shadow-none transition-colors group-data-[focus=true]:border-indigo-400 group-data-[focus=true]:bg-white dark:border-slate-700 dark:bg-slate-950/70",
            }}
          />

          <Input
            label="Jumlah Bayar"
            labelPlacement="outside"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={jumlah}
            min={1}
            onChange={(event) => {
              setJumlah(event.target.value);
              if (fieldErrors.jumlah) {
                setFieldErrors((current) => ({ ...current, jumlah: undefined }));
              }
            }}
            isInvalid={Boolean(fieldErrors.jumlah)}
            errorMessage={fieldErrors.jumlah}
            startContent={<span className="text-sm font-bold text-slate-500">Rp</span>}
            description="Masukkan nominal tanpa titik atau koma."
            aria-label="Jumlah bayar"
            classNames={{
              label: "font-bold text-slate-700 dark:text-slate-200",
              input: "text-base font-bold tabular-nums",
              inputWrapper:
                "min-h-13 rounded-xl border border-slate-200 bg-slate-50 shadow-none transition-colors group-data-[focus=true]:border-indigo-400 group-data-[focus=true]:bg-white dark:border-slate-700 dark:bg-slate-950/70",
            }}
          />

          <div className="sm:col-span-2">
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
                      setFieldErrors((current) => ({ ...current, jumlah: undefined }));
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
            placeholder="Contoh: Pembayaran gaji periode Agustus 2026"
            value={catatan}
            onChange={(event) => setCatatan(event.target.value)}
            minRows={3}
            maxRows={5}
            maxLength={250}
            description={`${catatan.length}/250 karakter · Opsional`}
            startContent={<FileText className="mt-1 h-4 w-4 text-slate-400" />}
            aria-label="Catatan"
            classNames={{
              label: "font-bold text-slate-700 dark:text-slate-200",
              inputWrapper:
                "rounded-xl border border-slate-200 bg-slate-50 shadow-none transition-colors group-data-[focus=true]:border-indigo-400 group-data-[focus=true]:bg-white dark:border-slate-700 dark:bg-slate-950/70",
            }}
            className="sm:col-span-2"
          />

          <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-100 sm:col-span-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
            <p>
              Setelah disimpan, pembayaran masuk ke riwayat payroll dan mengurangi sisa gaji pengguna.
            </p>
          </div>
        </div>
        </section>
      </div>
    </OperationalModal>
  );
}