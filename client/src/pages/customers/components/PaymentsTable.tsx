// client/src/pages/customers/components/PaymentsTable.tsx
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { useEffect, useState } from "react";
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

function formatTanggalText(iso: string | number | Date) {
  const d = new Date(iso);
  const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
  const tglBln = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
  return `${hari}, ${tglBln}`;
}

export default function PaymentsTable({ customerId }: { customerId: number }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Payment[]>([]);

  useEffect(() => {
    let alive = true;

    async function fetchAll() {
      setLoading(true);
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
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      alive = false;
    };
  }, [customerId]);

  return (
    <div className="flex flex-col gap-4">
      <Table
        aria-label="Histori Pembayaran"
        isStriped
        removeWrapper
        className="rounded-xl border border-default-200 overflow-hidden"
        classNames={{
          table: "table-fixed",
          thead: "bg-content2",
          th: "text-center text-foreground-500 font-semibold uppercase text-xs tracking-wide",
          tr: "data-[hover=true]:bg-default-50 dark:data-[hover=true]:bg-content2",
          td: "bg-content1 text-foreground align-middle",
          tbody: "bg-content1",
        }}
      >
        <TableHeader>
          <TableColumn className="w-[220px] text-center">TANGGAL</TableColumn>
          <TableColumn className="w-[180px] text-center">JUMLAH</TableColumn>
          <TableColumn className="text-center">CATATAN</TableColumn>
        </TableHeader>

        <TableBody
          isLoading={loading}
          emptyContent={loading ? "Memuat..." : "Belum ada pembayaran"}
        >
          {rows.map((r) => (
            <TableRow key={r.id}>
              {/* TANGGAL */}
              <TableCell className="text-center whitespace-nowrap">
                <span className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-sm font-medium bg-default-100 text-foreground-700 dark:bg-content2">
                  {formatTanggalText(r.tanggalBayar)}
                </span>
              </TableCell>

              {/* JUMLAH */}
              <TableCell className="text-center">
                <span
                  className="inline-flex min-w-[120px] items-center justify-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold
                             bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200
                             dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/25 tabular-nums"
                >
                  {fmtRp(r.amount)}
                </span>
              </TableCell>

              {/* CATATAN */}
              <TableCell className="text-center">
                <span className="block truncate text-foreground-700 dark:text-foreground">
                  {r.catatan ?? "—"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
