import { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@heroui/react";
import OperationalModal from "../common/OperationalModal";

export type OwnerGajiFormValue = { username: string; jumlahBayar: number; catatan?: string | null; };
type Mode = "create" | "edit";
type Props = { isOpen: boolean; mode: Mode; loading?: boolean; initial?: Partial<OwnerGajiFormValue>; onClose: () => void; onSubmit: (v: OwnerGajiFormValue) => Promise<void> | void; };

export default function OwnerGajiForm({ isOpen, mode, loading = false, initial, onClose, onSubmit }: Props) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [jumlahBayar, setJumlahBayar] = useState<number>(initial?.jumlahBayar ?? 0);
  const [catatan, setCatatan] = useState<string>(initial?.catatan ?? "");

  useEffect(() => {
    setUsername(initial?.username ?? "");
    setJumlahBayar(initial?.jumlahBayar ?? 0);
    setCatatan((initial?.catatan as string) ?? "");
  }, [initial, isOpen]);

  async function handleSubmit() {
    await onSubmit({
      username: username.trim(),
      jumlahBayar: Number(jumlahBayar) || 0,
      catatan: catatan?.trim() || undefined,
    });
    // ❗jangan close/jangan alert di sini
  }

  return (
    <OperationalModal
      isOpen={isOpen}
      size="form"
      onClose={onClose}
      isDismissable={false}
      title={mode === "create" ? "Tambah Pembayaran" : "Edit Pembayaran"}
      description="Catat transaksi payroll tanpa mengubah perhitungan upah sumbernya."
      footer={
        <>
          <Button variant="flat" onPress={onClose} isDisabled={loading} className="min-h-11 sm:min-w-28">Batal</Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading} className="min-h-11 sm:min-w-36">
            {mode === "create" ? "Simpan" : "Perbarui"}
          </Button>
        </>
      }
    >
          <div className="grid gap-5 lg:grid-cols-2">
            <Input classNames={{ inputWrapper: "min-h-12" }} label="Username" labelPlacement="outside" placeholder="mis. raka20" value={username} isReadOnly={mode === "edit"} onChange={(e) => setUsername(e.target.value)} />
            <Input classNames={{ inputWrapper: "min-h-12" }} type="number" inputMode="numeric" label="Jumlah Bayar" labelPlacement="outside" value={String(jumlahBayar ?? 0)} onChange={(e) => setJumlahBayar(Number(e.target.value))} min={1} />
            <Textarea classNames={{ inputWrapper: "min-h-32" }} className="lg:col-span-2" label="Catatan" labelPlacement="outside" placeholder="opsional" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </div>
    </OperationalModal>
  );
}
