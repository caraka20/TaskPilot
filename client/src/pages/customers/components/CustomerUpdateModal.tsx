// client/src/pages/customers/components/CustomerUpdateModal.tsx
import { useMemo, useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Select,
  SelectItem,
  Tooltip,
} from "@heroui/react";

import type {
  CustomerDetail,
  CustomerJenis,
  UpdateCustomerPayload,
} from "../../../utils/customer";
import { CUSTOMER_JENIS_OPTIONS } from "../../../utils/customer";
import { updateCustomer } from "../../../services/customer.service";
import { showApiError, showToast } from "../../../utils/alert";

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
    jenis?: CustomerJenis;
  }>({
    namaCustomer: data?.namaCustomer ?? "",
    noWa: data?.noWa ?? "",
    nim: data?.nim ?? "",
    password: (data as any)?.password ?? "",
    jurusan: data?.jurusan ?? "",
    jenis: (data?.jenis as CustomerJenis) ?? "TUTON",
  });

  const set = (k: keyof typeof form, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const [busy, setBusy] = useState(false);

  // host untuk Select popover (agar muncul di DALAM modal & tidak ketutup)
  const popoverHostRef = useRef<HTMLDivElement>(null);

  // ===== validasi ringan (FE) — hanya field dasar =====
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const nama = (form.namaCustomer ?? "").trim();
    const wa = (form.noWa ?? "").trim();
    const nim = (form.nim ?? "").trim();
    const pass = form.password ?? "";
    const jur = (form.jurusan ?? "").trim();
    const jenis = form.jenis;

    if (!nama) e.namaCustomer = "Nama wajib diisi";
    if (!wa) e.noWa = "No. WA wajib diisi";
    if (!nim) e.nim = "NIM wajib diisi";
    if (!pass || pass.length < 6) e.password = "Password minimal 6 karakter";
    if (!jur) e.jurusan = "Jurusan wajib diisi";
    if (!jenis) e.jenis = "Jenis wajib dipilih";

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
      jenis: form.jenis as CustomerJenis,
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
        jenis: (data?.jenis as CustomerJenis) ?? "TUTON",
      });
    }
    onOpenChange(v);
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={onOpenChangeInternal}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "data-[placement=center]:!duration-150",
        wrapper: "z-[2100]", // pastikan di atas layer lain
        header: "px-5 py-4",
        body: "px-5 py-4",
        footer: "px-5 py-4",
      }}
    >
      <ModalContent
        className={
          "bg-content1 text-foreground border border-default-200 shadow-2xl " +
          "w-[min(92vw,900px)] max-w-[900px]"
        }
      >
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Update Customer
              <span className="text-xs font-normal text-foreground-500">
                Perbarui data dasar pelanggan
              </span>
            </ModalHeader>

            <ModalBody>
              {/* Section: Data Utama */}
              <div className="rounded-2xl border border-default-100 bg-content1 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-primary">
                    Data Utama
                  </h3>
                  <Tooltip content="Sesuaikan data sesuai e-learning UT" placement="left">
                    <span className="text-xs text-foreground-400">Wajib</span>
                  </Tooltip>
                </div>

                {/* Grid input; overflow visible + host popover agar dropdown tidak terpotong */}
                <div
                  ref={popoverHostRef}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 relative overflow-visible"
                >
                  <Input
                    label="Nama"
                    variant="bordered"
                    value={form.namaCustomer ?? ""}
                    onValueChange={(v) => set("namaCustomer", v)}
                    isInvalid={isInvalid("namaCustomer")}
                    errorMessage={errors.namaCustomer}
                    placeholder="cth: Akka"
                  />

                  {/* JENIS di atas (kanan); popover ke host di dalam modal */}
                  <Select
                    label="Jenis"
                    variant="bordered"
                    selectedKeys={new Set<string>([form.jenis || "TUTON"])}
                    onSelectionChange={(keys) => {
                      const val =
                        (Array.from(keys)[0] as CustomerJenis | undefined) ??
                        "TUTON";
                      set("jenis", val);
                    }}
                    popoverProps={{
                      portalContainer: popoverHostRef.current ?? undefined, // <<< kunci: sama seperti create
                      placement: "bottom-start",
                      offset: 8,
                      shouldFlip: true,
                      classNames: {
                        base: "z-[2200]",
                        content:
                          "z-[2200] bg-content1 text-foreground border border-default-100 shadow-lg",
                      },
                    }}
                    classNames={{ listbox: "max-h-64" }}
                  >
                    {CUSTOMER_JENIS_OPTIONS.map((k) => (
                      <SelectItem key={k}>{k}</SelectItem>
                    ))}
                  </Select>

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
                    type="text"
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
                    value={form.noWa ?? ""}
                    onValueChange={(v) => set("noWa", v)}
                    isInvalid={isInvalid("noWa")}
                    errorMessage={errors.noWa}
                    placeholder="cth: 081234567890"
                  />
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="flat" onPress={() => onOpenChange(false)} isDisabled={busy}>
                Batal
              </Button>
              <Button
                color="primary"
                variant="shadow"
                className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg"
                isLoading={busy}
                onPress={onSave}
              >
                Update
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
