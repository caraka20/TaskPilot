// client/src/pages/customers/components/CustomerUpdateModal.tsx
import { useMemo, useState } from "react";
import {
  Input,
  Button,
  Checkbox,
  CheckboxGroup,
  Tooltip,
} from "@heroui/react";

import type {
  CustomerDetail,
  CustomerLayanan,
  UpdateCustomerPayload,
} from "../../../utils/customer";
import { CUSTOMER_LAYANAN_LABEL, CUSTOMER_LAYANAN_OPTIONS } from "../../../utils/customer";
import { updateCustomer } from "../../../services/customer.service";
import { showApiError, showToast } from "../../../utils/alert";
import OperationalModal from "../../../components/common/OperationalModal";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: CustomerDetail;
  /** Optional: minta parent refresh setelah update */
  onUpdated?: () => void;
};

export default function CustomerUpdateModal({
  open,
  onOpenChange,
  data,
  onUpdated,
}: Props) {
  // mirror nilai existing; kosongkan field opsional supaya "tidak menimpa" bila tidak diubah
  const [form, setForm] = useState<{
    namaCustomer?: string;
    noWa?: string;
    nim?: string;
    password?: string;
    jurusan?: string;
    layanan: CustomerLayanan[];
  }>({
    namaCustomer: data?.namaCustomer ?? "",
    noWa: data?.noWa ?? "",
    nim: data?.nim ?? "",
    password: (data as any)?.password ?? "",
    jurusan: data?.jurusan ?? "",
    layanan: data?.layanan?.length ? data.layanan : [data.jenis as CustomerLayanan],
  });

  const set = (k: keyof typeof form, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const [busy, setBusy] = useState(false);

  // ===== validasi ringan (FE) — hanya field dasar =====
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const nama = (form.namaCustomer ?? "").trim();
    const wa = (form.noWa ?? "").trim();
    const nim = (form.nim ?? "").trim();
    const pass = form.password ?? "";
    const jur = (form.jurusan ?? "").trim();
    const layanan = form.layanan;

    if (!nama) e.namaCustomer = "Nama wajib diisi";
    if (!wa) e.noWa = "No. WA wajib diisi";
    if (!nim) e.nim = "NIM wajib diisi";
    if (!pass || pass.length < 6) e.password = "Password minimal 6 karakter";
    if (!jur) e.jurusan = "Jurusan wajib diisi";
    if (!layanan.length) e.layanan = "Pilih minimal satu layanan";

    return e;
  }, [form]);

  const isInvalid = (key: keyof typeof errors) => Boolean(errors[key]);

  const onSave = async () => {
    const msgs = Object.values(errors).filter(Boolean);
    if (msgs.length) {
      await showApiError({ message: msgs.join("\n") });
      return;
    }

    // rakit payload; hapus field kosong agar tidak menimpa
    const payload: UpdateCustomerPayload = {
      namaCustomer: form.namaCustomer?.trim(),
      noWa: form.noWa?.trim(),
      nim: form.nim?.trim(),
      jurusan: form.jurusan?.trim(),
      layanan: form.layanan,
      ...(form.password && form.password.trim()
        ? { password: String(form.password) }
        : {}), // kirim hanya bila diisi
    };

    try {
      setBusy(true);
      await updateCustomer(data.id, payload);
      showToast("Customer berhasil diperbarui");
      onOpenChange(false);
      onUpdated?.();
    } catch (err: any) {
      await showApiError(err);
    } finally {
      setBusy(false);
    }
  };

  // reset isi saat modal dibuka ulang (biar sinkron dengan data terbaru)
  const onOpenChangeInternal = (v: boolean) => {
    if (v) {
      setForm({
        namaCustomer: data?.namaCustomer ?? "",
        noWa: data?.noWa ?? "",
        nim: data?.nim ?? "",
        password: (data as any)?.password ?? "",
        jurusan: data?.jurusan ?? "",
        layanan: data?.layanan?.length ? data.layanan : [data.jenis as CustomerLayanan],
      });
    }
    onOpenChange(v);
  };

  return (
    <OperationalModal
      isOpen={open}
      onOpenChange={onOpenChangeInternal}
      isDismissable={!busy}
      title="Edit identitas customer"
      description="Perbarui informasi utama dan layanan akademik tanpa mengubah riwayat customer."
      footer={
        <>
          <Button className="min-h-11 w-full font-semibold sm:w-auto" variant="flat" onPress={() => onOpenChange(false)} isDisabled={busy}>
            Batal
          </Button>
          <Button
            color="primary"
            className="min-h-11 w-full font-bold sm:w-auto"
            isLoading={busy}
            onPress={onSave}
          >
            Simpan perubahan
          </Button>
        </>
      }
    >
      <div className="mx-auto w-full max-w-6xl">
              <div className="rounded-[24px] bg-content1 p-4 shadow-sm ring-1 ring-default-200/60 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-primary">
                    Data Utama
                  </h3>
                  <Tooltip content="Sesuaikan data sesuai e-learning UT" placement="left">
                    <span className="text-xs text-foreground-400">Wajib</span>
                  </Tooltip>
                </div>

                {/* Grid input; overflow visible + host popover agar dropdown tidak terpotong */}
                <div className="relative grid grid-cols-1 gap-4 overflow-visible md:grid-cols-2">
                  <Input
                    label="Nama"
                    variant="bordered"
                    value={form.namaCustomer ?? ""}
                    onValueChange={(v) => set("namaCustomer", v)}
                    isInvalid={isInvalid("namaCustomer")}
                    errorMessage={errors.namaCustomer}
                    placeholder="cth: Akka"
                  />

                  <div className="rounded-2xl bg-content2/60 p-4 ring-1 ring-default-200/60 md:col-span-2">
                    <CheckboxGroup
                      label="Layanan customer"
                      description="Pilih satu atau beberapa layanan."
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

                  <Input
                    label="NIM"
                    variant="bordered"
                    value={form.nim ?? ""}
                    onValueChange={(v) => set("nim", v)}
                    isInvalid={isInvalid("nim")}
                    errorMessage={errors.nim}
                    placeholder="cth: 1234567890"
                  />

                  <Input
                    label="Password (UT/e-learning)"
                    variant="bordered"
                    type="password"
                    autoComplete="new-password"
                    value={form.password ?? ""}
                    onValueChange={(v) => set("password", v)}
                    isInvalid={isInvalid("password")}
                    errorMessage={errors.password}
                    placeholder="min. 6 karakter"
                  />

                  <Input
                    label="Jurusan"
                    variant="bordered"
                    value={form.jurusan ?? ""}
                    onValueChange={(v) => set("jurusan", v)}
                    isInvalid={isInvalid("jurusan")}
                    errorMessage={errors.jurusan}
                    placeholder="cth: Manajemen"
                  />

                  {/* NO. WA dipindah ke bawah supaya dropdown Jenis bebas */}
                  <Input
                    label="No. WA"
                    variant="bordered"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.noWa ?? ""}
                    onValueChange={(v) => set("noWa", v)}
                    isInvalid={isInvalid("noWa")}
                    errorMessage={errors.noWa}
                    placeholder="cth: 081234567890"
                  />
                </div>
              </div>
      </div>
    </OperationalModal>
  );
}
