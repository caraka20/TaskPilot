import { useState } from "react";
import { Input, Button } from "@heroui/react";

export default function UpdateInvoiceForm({ initialTotal, onSubmit, busy }: {
  initialTotal?: number;
  onSubmit: (totalBayar: number) => Promise<void> | void;
  busy?: boolean;
}) {
  const [total, setTotal] = useState<number | "">(initialTotal ?? "");

  const save = async () => {
    if (total === "" || total < 0) {
      alert("totalBayar tidak valid");
      return;
    }
    await onSubmit(Number(total));
  };

  return (
    <div className="flex gap-3 items-end">
      <Input label="Total Tagihan (IDR)" type="number" value={String(total)} onValueChange={(v) => setTotal(v === "" ? "" : Number(v))} />
      <Button color="warning" onPress={save} isLoading={busy}>Update Total</Button>
    </div>
  );
}
