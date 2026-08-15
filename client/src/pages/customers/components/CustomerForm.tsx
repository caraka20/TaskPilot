// client/src/pages/customers/components/CustomerForm.tsx
import { useMemo, useState } from "react";
import { Input, Button, Checkbox, CheckboxGroup, Tooltip } from "@heroui/react";
import {
  type CreateCustomerPayload,
  type CustomerLayanan,
  CUSTOMER_LAYANAN_LABEL,
  CUSTOMER_LAYANAN_OPTIONS,
} from "../../../utils/customer";
import { showApiError } from "../../../utils/alert";

interface Props {
  onSubmit: (payload: CreateCustomerPayload) => Promise<void> | void;
  busy?: boolean;
  formId?: string;
  hideActions?: boolean;
}

export default function CustomerForm({ onSubmit, busy, formId, hideActions = false }: Props) {
  const [form, setForm] = useState<CreateCustomerPayload>({
    namaCustomer: "",
    noWa: "",
    nim: "",
    password: "",
    jurusan: "",
    jenis: "TUTON",
    layanan: ["TUTON"],
    totalBayar: undefined,
    sudahBayar: undefined,
  });

  const set = (k: keyof CreateCustomerPayload, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ===== Validasi: SEMUA WAJIB DIISI =====
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const nama = form.namaCustomer?.trim() ?? "";
    const wa = form.noWa?.trim() ?? "";
    const nim = form.nim?.trim() ?? "";
    const pass = form.password ?? "";
    const jur = form.jurusan?.trim() ?? "";
    const layanan = form.layanan ?? [];

    const total = form.totalBayar;
    const paid = form.sudahBayar;

    if (!nama) e.namaCustomer = "Nama wajib diisi";
    if (!wa) e.noWa = "No. WA wajib diisi";
    if (!nim) e.nim = "NIM wajib diisi";
    if (!pass) e.password = "Password wajib diisi";
    else if (pass.length < 6) e.password = "Password minimal 6 karakter";
    if (!jur) e.jurusan = "Jurusan wajib diisi";
    if (!layanan.length) e.layanan = "Pilih minimal satu layanan";

    // total & sudahBayar: wajib diisi, angka valid, dan konsistensi
    if (total === undefined || total === null || Number.isNaN(total)) {
      e.totalBayar = "Total bayar wajib diisi";
    } else if (total < 0) {
      e.totalBayar = "Total tidak boleh negatif";
    }

    if (paid === undefined || paid === null || Number.isNaN(paid)) {
      e.sudahBayar = "Sudah bayar wajib diisi";
    } else if (paid < 0) {
      e.sudahBayar = "Sudah bayar tidak boleh negatif";
    }

    if (
      (total !== undefined && total !== null && !Number.isNaN(total)) &&
      (paid !== undefined && paid !== null && !Number.isNaN(paid)) &&
      paid > total
    ) {
      e.sudahBayar = "Sudah bayar tidak boleh melebihi total bayar";
    }

    return e;
  }, [form]);

  const isInvalid = (key: keyof typeof errors) => Boolean(errors[key]);

  const onSave = async () => {
    const msgs = Object.values(errors).filter(Boolean);
    if (msgs.length) {
      await showApiError({ message: msgs.join("\n") });
      return;
    }

    const payload: CreateCustomerPayload = {
      ...form,
      namaCustomer: form.namaCustomer.trim(),
      noWa: form.noWa.trim(),
      nim: form.nim.trim(),
      jurusan: form.jurusan.trim(),
      jenis: form.layanan.includes("KARIL") && !form.layanan.includes("TUTON") ? "KARIL" : "TUTON",
      totalBayar: Number(form.totalBayar),    // dipastikan ada nilainya oleh validator
      sudahBayar: Number(form.sudahBayar),    // dipastikan ada nilainya oleh validator
    };

    await onSubmit(payload);

    // reset lembut (layanan tetap)
    setForm({
      namaCustomer: "",
      noWa: "",
      nim: "",
      password: "",
      jurusan: "",
      jenis: form.jenis,
      layanan: form.layanan,
      totalBayar: undefined,
      sudahBayar: undefined,
    });
  };

  // tombol disable kalau ada error atau lagi busy
  const disableSave =
    busy ||
    Object.values(errors).some(Boolean) ||
    // cegah submit awal kosong total/paid
    form.totalBayar === undefined ||
    form.sudahBayar === undefined;

  return (
    <form
      className="flex flex-col gap-6"
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      {/* Section: Data Utama */}
      <div className="rounded-2xl border border-default-100 bg-content1 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-primary">Data Utama</h3>
          <Tooltip content="Lengkapi semua data sebelum menyimpan" placement="left">
            <span className="text-xs text-foreground-400">Semua wajib</span>
          </Tooltip>
        </div>

        <div className="relative grid grid-cols-1 gap-3 overflow-visible md:grid-cols-2">
          <Input
            label="Nama"
            variant="bordered"
            value={form.namaCustomer}
            onValueChange={(v) => set("namaCustomer", v)}
            isInvalid={isInvalid("namaCustomer")}
            errorMessage={errors.namaCustomer}
            placeholder="cth: Akka"
          />
          <Input
            label="No. WA"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            variant="bordered"
            value={form.noWa}
            onValueChange={(v) => set("noWa", v)}
            isInvalid={isInvalid("noWa")}
            errorMessage={errors.noWa}
            placeholder="cth: 081234567890"
          />
          <Input
            label="NIM"
            variant="bordered"
            value={form.nim}
            onValueChange={(v) => set("nim", v)}
            isInvalid={isInvalid("nim")}
            errorMessage={errors.nim}
            placeholder="cth: 1234567890 / TEST-xxxx"
          />
          <Input
            label="Password (UT/e-learning)"
            variant="bordered"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onValueChange={(v) => set("password", v)}
            isInvalid={isInvalid("password")}
            errorMessage={errors.password}
            placeholder="min. 6 karakter"
          />
          <Input
            label="Jurusan"
            variant="bordered"
            value={form.jurusan}
            onValueChange={(v) => set("jurusan", v)}
            isInvalid={isInvalid("jurusan")}
            errorMessage={errors.jurusan}
            placeholder="cth: Manajemen"
          />

          <div className="md:col-span-2 rounded-2xl border border-default-200 bg-content2/50 p-4">
            <CheckboxGroup
              label="Layanan customer"
              description="Satu customer dapat mengambil lebih dari satu layanan."
              orientation="horizontal"
              value={form.layanan}
              onValueChange={(values) => set("layanan", values as CustomerLayanan[])}
              isInvalid={isInvalid("layanan")}
              errorMessage={errors.layanan}
              classNames={{ wrapper: "mt-2 flex flex-wrap gap-3" }}
            >
              {CUSTOMER_LAYANAN_OPTIONS.map((item) => (
                <Checkbox key={item} value={item}>{CUSTOMER_LAYANAN_LABEL[item]}</Checkbox>
              ))}
            </CheckboxGroup>
          </div>
        </div>
      </div>

      {/* Section: Tagihan */}
      <div className="rounded-2xl border border-default-100 bg-content1 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-primary">Tagihan</h3>
          <span className="text-xs text-foreground-400">Semua wajib</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Total Bayar"
            type="number"
            variant="bordered"
            startContent={<span className="px-1 text-foreground-500">Rp</span>}
            value={String(form.totalBayar ?? "")}
            onValueChange={(v) =>
              set("totalBayar", v !== "" ? Number(v) : undefined)
            }
            isInvalid={isInvalid("totalBayar")}
            errorMessage={errors.totalBayar}
            placeholder="cth: 500000"
            min={0}
            step="1"
            inputMode="numeric"
          />
          <Input
            label="Sudah Bayar"
            type="number"
            variant="bordered"
            startContent={<span className="px-1 text-foreground-500">Rp</span>}
            value={String(form.sudahBayar ?? "")}
            onValueChange={(v) =>
              set("sudahBayar", v !== "" ? Number(v) : undefined)
            }
            isInvalid={isInvalid("sudahBayar")}
            errorMessage={errors.sudahBayar}
            placeholder="cth: 200000"
            min={0}
            step="1"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Actions */}
      {!hideActions ? <div className="flex justify-end">
        <Button
          type="submit"
          color="primary"
          variant="shadow"
          className="min-h-12 w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg sm:w-auto"
          isLoading={busy}
          isDisabled={disableSave}
        >
          Simpan Customer
        </Button>
      </div> : null}
    </form>
  );
}
