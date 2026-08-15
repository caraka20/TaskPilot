// client/src/pages/customers/components/PaymentsTable.tsx
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CircleDollarSign, ReceiptText } from "lucide-react";
import { listCustomerPayments } from "../../../services/customer.service";
import { fmtRp } from "../../../utils/customer";

/** Bentuk minimal yang kita butuhkan untuk render */
type Payment = {
  id: number;
  tanggalBayar: string | Date;
  amount: number;
  catatan?: string | null;
};

/** Normalisasi respons listCustomerPayments agar tahan banting */
function normalizeResponse(resp: any): {
  items: Payment[];
  pagination?: { page?: number; totalPages?: number; hasNext?: boolean };
} {
  const items =
    resp?.items ??
    resp?.data?.items ??
    resp?.data?.data?.items ??
    [];
  const pagination =
    resp?.pagination ??
    resp?.meta ??
    resp?.data?.pagination ??
    undefined;
  return { items, pagination };
}

function formatTanggal(iso: string | number | Date) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { weekday: "Tanggal pembayaran", date: "—" };
  }
  return {
    weekday: date.toLocaleDateString("id-ID", { weekday: "long" }),
    date: date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}

export default function PaymentsTable({ customerId, refreshKey }: { customerId: number; refreshKey?: string | number }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const totalReceived = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [rows]
  );

  useEffect(() => {
    let alive = true;

    async function fetchAll() {
      setLoading(true);
      setError("");
      try {
        // Ambil halaman pertama
        const first = await listCustomerPayments(customerId, {
          page: 1,
          limit: 50,
          sortDir: "desc",
        } as any);
        const n1 = normalizeResponse(first);

        let merged: Payment[] = [...n1.items];

        // Jika backend masih paginate → ambil sisa halaman (paralel)
        const totalPages =
          Number(n1.pagination?.totalPages) || 1;
        const startPage =
          Number(n1.pagination?.page) || 1;

        if (totalPages > startPage) {
          const promises: Promise<any>[] = [];
          for (let p = startPage + 1; p <= totalPages; p++) {
            promises.push(
              listCustomerPayments(customerId, {
                page: p,
                limit: 50, // jangan pakai pageSize dari server (kadang tidak ada)
                sortDir: "desc",
              } as any)
            );
          }
          const rest = await Promise.all(promises);
          for (const r of rest) {
            const nx = normalizeResponse(r);
            merged = merged.concat(nx.items ?? []);
          }
        }

        // Pastikan urut desc (jaga-jaga)
        merged.sort(
          (a, b) =>
            new Date(b.tanggalBayar).getTime() -
            new Date(a.tanggalBayar).getTime()
        );

        if (alive) setRows(merged);
      } catch (cause) {
        if (alive) {
          setRows([]);
          setError(cause instanceof Error ? cause.message : "Riwayat pembayaran gagal dimuat.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      alive = false;
    };
  }, [customerId, refreshKey]);

  return (
    <div className="min-w-0">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {!error && !loading && rows.length > 0 ? (
        <div className="mb-3 flex flex-col gap-2 px-1 py-0.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/15">
              <CircleDollarSign className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Transaksi tercatat</p>
              <p className="mt-0.5 text-xs font-black text-slate-700 dark:text-slate-200">{rows.length} pembayaran</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Total diterima</p>
            <p className="mt-0.5 text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-300">{fmtRp(totalReceived)}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:hidden">
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Memuat pembayaran">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800">
                <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3 rounded-md" />
                  <Skeleton className="h-3 w-3/4 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <ReceiptText className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Belum ada pembayaran</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Transaksi yang dicatat akan muncul di sini.</p>
          </div>
        ) : (
          rows.map((row) => {
            const formatted = formatTanggal(row.tanggalBayar);
            return (
              <article key={row.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/25">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <CircleDollarSign className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black tabular-nums text-slate-950 dark:text-white">{fmtRp(row.amount)}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{formatted.weekday}, {formatted.date}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {row.catatan?.trim() || "Tanpa catatan tambahan"}
                </div>
              </article>
            );
          })
        )}
      </div>

      {!error ? (
        <div className="hidden overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_22px_-22px_rgba(15,23,42,.45)] dark:border-slate-800 dark:bg-slate-950/25 md:block">
          <Table
            aria-label="Histori Pembayaran"
            removeWrapper
            className="overflow-hidden rounded-2xl"
            classNames={{
              table: "min-w-[580px] table-fixed",
              thead: "bg-slate-50 dark:bg-slate-950/45",
              th: "h-10 border-b border-slate-200/80 px-4 text-left text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800 dark:text-slate-400",
              tr: "border-b border-slate-100 last:border-b-0 data-[hover=true]:bg-sky-50/45 dark:border-slate-800 dark:data-[hover=true]:bg-sky-400/[0.035]",
              td: "h-[62px] bg-transparent px-4 align-middle text-slate-700 dark:text-slate-200",
              tbody: "bg-white dark:bg-transparent",
            }}
          >
            <TableHeader>
              <TableColumn className="w-[190px]">TRANSAKSI</TableColumn>
              <TableColumn>CATATAN</TableColumn>
              <TableColumn className="w-[150px] text-right">NOMINAL</TableColumn>
            </TableHeader>

            <TableBody
              isLoading={loading}
              emptyContent={loading ? "Memuat pembayaran…" : "Belum ada pembayaran"}
            >
              {rows.map((row) => {
                const formatted = formatTanggal(row.tanggalBayar);
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
                          <CalendarDays className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{formatted.date}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{formatted.weekday}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="block truncate text-sm text-slate-600 dark:text-slate-300">
                        {row.catatan?.trim() || "Tanpa catatan tambahan"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block text-right text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-300">
                        {fmtRp(row.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
