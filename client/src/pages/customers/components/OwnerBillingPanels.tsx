// client/src/pages/customers/components/OwnerBillingPanels.tsx
import { Card, CardBody, CardHeader } from "@heroui/react";
import PaymentsForm from "./PaymentsForm";
import PaymentsTable from "./PaymentsTable";

type Props = {
  customerId: number;
  onAddPayment: (payload: {
    amount: number;
    catatan?: string;
    tanggalBayar?: string;
  }) => Promise<void> | void;
};

export default function OwnerBillingPanels({ customerId, onAddPayment }: Props) {
  return (
    <>
      {/* Tambah Pembayaran */}
      <Card className="mt-6 rounded-2xl border border-default-200 bg-content1 shadow-md overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />
        <CardHeader className="flex flex-col gap-0.5 py-4">
          <div className="text-[15px] font-semibold text-foreground">Tambah Pembayaran</div>
          <div className="text-xs text-foreground-500">Catat transaksi baru untuk customer ini</div>
        </CardHeader>
        <CardBody>
          <PaymentsForm onSubmit={onAddPayment} />
        </CardBody>
      </Card>

      {/* Riwayat Pembayaran */}
      <Card className="mt-4 rounded-2xl border border-default-200 bg-content1 shadow-md overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />
        <CardHeader className="flex flex-col gap-0.5 py-4">
          <div className="text-[15px] font-semibold text-foreground">Riwayat Pembayaran</div>
          <div className="text-xs text-foreground-500">Daftar transaksi yang pernah dicatat</div>
        </CardHeader>
        <CardBody>
          <PaymentsTable customerId={customerId} />
        </CardBody>
      </Card>
    </>
  );
}
