import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";

export type CustomerWithoutCourse = {
  id: number;
  namaCustomer: string;
  nim: string;
};

type Props = {
  loading: boolean;
  customers: CustomerWithoutCourse[];
  total: number;
  onSelect: (searchValue: string) => void | Promise<void>;
};

export default function CustomerMissingCoursePopover({
  loading,
  customers,
  total,
  onSelect,
}: Props) {
  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <button
          type="button"
          className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl bg-amber-400/10 px-3 text-xs font-semibold text-amber-100 ring-1 ring-amber-300/20 transition hover:bg-amber-400/15"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {loading ? "Memuat…" : `${total} tanpa mata kuliah`}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[min(92vw,480px)] rounded-2xl border border-default-200 p-0 shadow-xl">
        <div className="w-full p-4">
          <div className="flex items-start gap-3 border-b border-default-100 pb-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </span>

            <div>
              <p className="text-sm font-bold text-foreground">
                Customer Tuton tanpa mata kuliah
              </p>
              <p className="mt-0.5 text-xs text-foreground-500">
                Klik customer untuk menerapkan pencarian cepat.
              </p>
            </div>
          </div>

          {customers.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground-500">
              Semua customer Tuton sudah memiliki mata kuliah.
            </p>
          ) : (
            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-default-100"
                  onClick={() =>
                    void onSelect(customer.nim || customer.namaCustomer)
                  }
                >
                  <span className="truncate text-sm font-semibold text-foreground">
                    {customer.namaCustomer}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-foreground-400">
                    {customer.nim}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
