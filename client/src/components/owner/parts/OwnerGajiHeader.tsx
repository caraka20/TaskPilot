import { CardHeader, Button } from "@heroui/react";
import { RefreshCw, Wallet } from "lucide-react";

type Props = {
  loading?: boolean;
  onAdd: () => void;
  onRefresh: () => void;
};

export default function OwnerGajiHeader({ loading = false, onAdd, onRefresh }: Props) {
  return (
    <CardHeader className="relative px-6 pt-6 pb-5">
      {/* LEFT: icon + titles */}
      <div className="flex items-center gap-4">
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl border border-default-200
                      bg-gradient-to-br from-primary/10 via-primary/5 to-success/10 shadow-sm"
          aria-hidden
        >
          <Wallet className="h-5 w-5 text-primary-600" />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] uppercase tracking-[.18em] text-foreground-500">
            Owner • Payroll
          </div>
          <h2 className="text-3xl font-semibold">Pembayaran Gaji</h2>
        </div>
      </div>

      {/* RIGHT: actions */}
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <Button
          color="success"
          variant="flat"
          onPress={onAdd}
          aria-label="Tambah pembayaran gaji"
          className="shadow-sm"
        >
          Tambah Pembayaran
        </Button>

        <Button
          color="primary"
          variant="solid"
          onPress={onRefresh}
          isLoading={loading}
          startContent={<RefreshCw className="h-4 w-4" />}
          aria-label="Refresh tabel gaji"
          className="shadow-sm"
        >
          Refresh
        </Button>
      </div>

      {/* divider halus */}
      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-default-200 to-transparent" />
    </CardHeader>
  );
}
