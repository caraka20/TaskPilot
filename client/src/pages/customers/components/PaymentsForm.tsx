import { useState } from "react";
import { Input, Button } from "@heroui/react";
import type { AddPaymentPayload } from "../../../utils/customer";
import { toISODateOnly } from "../../../utils/customer";

export default function PaymentsForm({ onSubmit, busy }: {
  onSubmit: (payload: AddPaymentPayload) => Promise<void> | void;
  busy?: boolean;
}) {
  const [amount, setAmount] = useState<number | "">("");
  const [tanggalBayar, setTanggalBayar] = useState<string>(toISODateOnly(new Date()));
  const [catatan, setCatatan] = useState<string>("");

  const save = async () => {
    if (!amount || amount <= 0) {
      alert("Amount harus > 0");
      return;
    }
    await onSubmit({ amount: Number(amount), tanggalBayar: tanggalBayar ? new Date(tanggalBayar).toISOString() : undefined, catatan });
    setAmount("");
    setCatatan("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Input label="Jumlah (IDR)" type="number" value={String(amount)} onValueChange={(v) => setAmount(v ? Number(v) : "")} />
      <Input label="Tanggal Bayar" type="date" value={tanggalBayar} onValueChange={setTanggalBayar} />
      <Input label="Catatan" value={catatan} onValueChange={setCatatan} />
      <div className="md:col-span-3 flex justify-end">
        <Button color="primary" onPress={save} isLoading={busy}>Tambah Pembayaran</Button>
      </div>
    </div>
  );
}
