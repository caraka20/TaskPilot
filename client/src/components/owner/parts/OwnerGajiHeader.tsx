import { CardHeader, Button } from "@heroui/react";
import { Plus, RefreshCw, Wallet } from "lucide-react";

type Props = {
  loading?: boolean;
  onAdd?: () => void;
  onRefresh: () => void;
  title?: string;
  eyebrow?: string;
  description?: string;
};

export default function OwnerGajiHeader({
  loading = false,
  onAdd,
  onRefresh,
  title = "Pembayaran Gaji",
  eyebrow = "Owner • Payroll",
  description,
}: Props) {
  return (
    <CardHeader className="flex flex-col items-stretch gap-5 px-4 pb-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-default-200 sm:h-12 sm:w-12
                      bg-gradient-to-br from-primary/10 via-primary/5 to-success/10 shadow-sm"
          aria-hidden
        >
          <Wallet className="h-5 w-5 text-primary-600" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary-600 dark:text-primary-300">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            {title}
          </h2>
          {description && <p className="mt-1 max-w-2xl text-sm leading-5 text-foreground-500">{description}</p>}
        </div>
      </div>

      <div className={`${onAdd ? "grid grid-cols-2" : "flex"} gap-2 sm:flex sm:shrink-0 sm:items-center`}>
        {onAdd && (
          <Button
            color="success"
            variant="solid"
            onPress={onAdd}
            startContent={<Plus className="h-4 w-4" />}
            aria-label="Tambah pembayaran gaji"
            className="min-h-11 w-full px-3 font-semibold shadow-sm sm:w-auto sm:px-4"
          >
            <span className="sm:hidden">Tambah</span>
            <span className="hidden sm:inline">Tambah Pembayaran</span>
          </Button>
        )}

        <Button
          color="primary"
          variant="solid"
          onPress={onRefresh}
          isLoading={loading}
          startContent={<RefreshCw className="h-4 w-4" />}
          aria-label="Refresh tabel gaji"
          className="min-h-11 w-full px-3 shadow-sm sm:w-auto sm:px-4"
        >
          Refresh
        </Button>
      </div>
    </CardHeader>
  );
}
