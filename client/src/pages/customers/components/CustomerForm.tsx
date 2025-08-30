import { useMemo, useState } from "react";
import { Input, Button, Select, SelectItem, Tooltip } from "@heroui/react";
import type { CreateCustomerPayload, CustomerJenis } from "../../../utils/customer";
import { showApiError } from "../../../utils/alert";

interface Props {
  onSubmit: (payload: CreateCustomerPayload) => Promise<void> | void;
  busy?: boolean;
}

export default function CustomerForm({ onSubmit, busy }: Props) {
  const [form, setForm] = useState<CreateCustomerPayload>({
    namaCustomer: "",
    noWa: "",
    nim: "",
    password: "",
    jurusan: "",
    jenis: "TUTON",
    totalBayar: undefined,
    sudahBayar: undefined,
  });

  const set = (k: keyof CreateCustomerPayload, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ===== minimal validation (FE) =====
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.namaCustomer.trim()) e.namaCustomer = "Nama wajib diisi";
    if (!form.noWa.trim()) e.noWa = "No. WA wajib diisi";
    if (!form.nim.trim()) e.nim = "NIM wajib diisi";
    if (!form.password || form.password.length < 6)
      e.password = "Password minimal 6 karakter";
    if (!form.jurusan.trim()) e.jurusan = "Jurusan wajib diisi";
    if (!form.jenis) e.jenis = "Jenis wajib dipilih";
    const total = form.totalBayar ?? 0;
    const paid = form.sudahBayar ?? 0;
    if (paid > total) e.sudahBayar = "Sudah bayar tidak boleh melebihi total bayar";
    if ((form.totalBayar ?? 0) < 0) e.totalBayar = "Total tidak boleh negatif";
    if ((form.sudahBayar ?? 0) < 0) e.sudahBayar = "Sudah bayar tidak boleh negatif";
    return e;
  }, [form]);

  const isInvalid = (key: keyof typeof errors) => Boolean(errors[key]);

  const onSave = async () => {
    // FE guard → tampilkan lewat SweetAlert
    const msgs = Object.values(errors).filter(Boolean);
    if (msgs.length) {
      await showApiError({ message: msgs.join("\n") });
      return;
    }

    // trim beberapa field agar konsisten
    const payload: CreateCustomerPayload = {
      ...form,
      namaCustomer: form.namaCustomer.trim(),
      noWa: form.noWa.trim(),
      nim: form.nim.trim(),
      jurusan: form.jurusan.trim(),
      jenis: (form.jenis ?? "TUTON") as CustomerJenis,
      totalBayar: form.totalBayar ?? 0,
      sudahBayar: form.sudahBayar ?? 0,
    };

    await onSubmit(payload);

    // reset lembut (biarkan jenis tetap)
    setForm({
      namaCustomer: "",
      noWa: "",
      nim: "",
      password: "",
      jurusan: "",
      jenis: form.jenis || "TUTON",
      totalBayar: undefined,
      sudahBayar: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Section: Data Utama */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-indigo-600">Data Utama</h3>
          <Tooltip content="Lengkapi data sesuai testing BE" placement="left">
            <span className="text-xs text-slate-500">Wajib</span>
          </Tooltip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Nama"
            variant="bordered"
            value={form.namaCustomer}
            onValueChange={(v) => set("namaCustomer", v)}
            isInvalid={isInvalid("namaCustomer")}
            errorMessage={errors.namaCustomer}
            placeholder="cth: zul"
          />
          <Input
            label="No. WA"
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
            type="text"
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
          <Select
            label="Jenis"
            variant="bordered"
            selectedKeys={[form.jenis ?? "TUTON"]}
            onChange={(e) => set("jenis", (e.target.value as CustomerJenis) ?? "TUTON")}
            isInvalid={isInvalid("jenis")}
            errorMessage={errors.jenis}
          >
            <SelectItem key="TUTON">TUTON</SelectItem>
            <SelectItem key="KARIL">KARIL</SelectItem>
            <SelectItem key="TK">TK</SelectItem>
          </Select>
        </div>
      </div>

      {/* Section: Tagihan */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-indigo-600">Tagihan</h3>
          <span className="text-xs text-slate-500">Opsional (default 0)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Total Bayar"
            type="number"
            variant="bordered"
            startContent={<span className="px-1 text-slate-500">Rp</span>}
            value={String(form.totalBayar ?? "")}
            onValueChange={(v) => set("totalBayar", v !== "" ? Number(v) : undefined)}
            isInvalid={isInvalid("totalBayar")}
            errorMessage={errors.totalBayar}
            placeholder="cth: 500000"
            min={0}
          />
          <Input
            label="Sudah Bayar"
            type="number"
            variant="bordered"
            startContent={<span className="px-1 text-slate-500">Rp</span>}
            value={String(form.sudahBayar ?? "")}
            onValueChange={(v) => set("sudahBayar", v !== "" ? Number(v) : undefined)}
            isInvalid={isInvalid("sudahBayar")}
            errorMessage={errors.sudahBayar}
            placeholder="cth: 200000"
            min={0}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          color="primary"
          variant="shadow"
          className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg"
          isLoading={busy}
          onPress={onSave}
        >
          Simpan Customer
        </Button>
      </div>
    </div>
  );
}
