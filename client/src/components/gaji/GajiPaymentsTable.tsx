// client/src/components/gaji/GajiPaymentsTable.tsx
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Spinner,
} from "@heroui/react";
import { CalendarDays, FileText, ReceiptText } from "lucide-react";
import type { GajiItem } from "../../services/gaji.service";
import MoneyPill from "./MoneyPill";
import { fmtTanggalHari, PAGE_SIZE } from "./helpers";

type Props = {
  rows: GajiItem[];
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  error?: string | null;
  onPrev: () => void;
  onNext: () => void;
};

// item union agar bisa menyisipkan baris "kosong" (ghost/filler)
type GhostRow = { __ghost: true; id: string };
type DisplayRow = GajiItem | GhostRow;

export default function GajiPaymentsTable({
  rows,
  total,
  page,
  totalPages,
  loading = false,
  error,
  onPrev,
  onNext,
}: Props) {
  const fillerCount = Math.max(0, PAGE_SIZE - (rows?.length ?? 0));
  const fillers: GhostRow[] = Array.from({ length: fillerCount }, (_, i) => ({
    __ghost: true,
    id: `ghost-${i}`,
  }));

  const items: DisplayRow[] = [...(rows ?? []), ...fillers];

  return (
    <Card className="border border-default-200 lg:col-span-7">
      <CardHeader className="flex items-start gap-3 px-4 pb-0 pt-5 sm:px-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold tracking-tight sm:text-xl">Riwayat Pembayaran</div>
          <div className="mt-0.5 text-sm leading-5 text-foreground-500">
            Catatan semua pembayaran yang pernah Anda terima
          </div>
        </div>
      </CardHeader>

      <CardBody className="flex flex-col px-0 pb-0 pt-4 lg:h-[560px]">
        {error && (
          <div className="mx-4 mb-3 rounded-large border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 sm:mx-6">
            {error}
          </div>
        )}

        <div className="space-y-3 px-4 md:hidden" aria-live="polite" aria-busy={loading}>
          {loading && rows.length === 0 ? (
            <div className="flex min-h-36 items-center justify-center gap-2 rounded-2xl border border-default-200 bg-default-50/50 text-sm text-foreground-500">
              <Spinner size="sm" />
              Memuat pembayaran…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-default-300 bg-default-50/50 px-6 text-center text-sm text-foreground-500">
              Belum ada riwayat pembayaran.
            </div>
          ) : (
            rows.map((row) => (
              <article key={row.id} className="rounded-2xl border border-default-200 bg-content1 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2 text-sm text-foreground-600">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-foreground-400" aria-hidden />
                    <span>{fmtTanggalHari(row.tanggalBayar)}</span>
                  </div>
                  <MoneyPill value={row.jumlahBayar} />
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-default-50 p-3 text-sm text-foreground-600 dark:bg-default-100/50">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-foreground-400" aria-hidden />
                  <span className="break-words">{row.catatan ?? "Tanpa catatan"}</span>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden flex-1 overflow-auto px-4 md:block sm:px-6">
          <Table
            aria-label="Tabel riwayat gaji"
            removeWrapper
            classNames={{
              table: "rounded-2xl overflow-hidden border border-default-100",
              th: "bg-default-100 text-foreground-600 font-semibold sticky top-0 z-10",
              td: "align-middle",
              tr: "hover:bg-default-50 transition-colors",
            }}
          >
            <TableHeader>
              <TableColumn className="w-[50%] min-w-[240px]">TANGGAL</TableColumn>
              <TableColumn className="w-[25%]">JUMLAH</TableColumn>
              <TableColumn className="w-[25%]">CATATAN</TableColumn>
            </TableHeader>

            {/* ✅ gunakan render-prop agar typing cocok */}
            <TableBody
              items={items}
              emptyContent={loading ? "Memuat…" : "Belum ada data gaji."}
              isLoading={loading}
            >
              {(item) => {
                // baris filler/ghost: tampilkan sel transparan
                if ((item as GhostRow).__ghost) {
                  const g = item as GhostRow;
                  return (
                    <TableRow key={g.id} className="h-14">
                      <TableCell className="opacity-0 select-none">—</TableCell>
                      <TableCell className="opacity-0 select-none">—</TableCell>
                      <TableCell className="opacity-0 select-none">—</TableCell>
                    </TableRow>
                  );
                }

                const r = item as GajiItem;
                return (
                  <TableRow key={r.id} className="h-14">
                    <TableCell className="text-foreground-700">
                      {fmtTanggalHari(r.tanggalBayar)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <MoneyPill value={r.jumlahBayar} />
                    </TableCell>
                    <TableCell className="text-foreground-600">
                      {r.catatan ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 w-full border-t border-default-100 bg-background/60 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/50 sm:px-6 lg:mt-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center text-xs text-foreground-500 sm:text-left">
              Menampilkan {Math.min(rows.length, PAGE_SIZE)} dari {total} entri.
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Button
                variant="flat"
                isDisabled={page <= 1 || loading}
                onPress={onPrev}
                aria-label="Halaman sebelumnya"
                className="min-h-11 min-w-0 px-2 sm:min-w-24 sm:px-4"
              >
                <span className="sm:hidden">Sebelum</span>
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>
              <Chip variant="flat" radius="sm" className="h-9 min-w-[92px] justify-center">
                Halaman {page}/{totalPages}
              </Chip>
              <Button
                variant="flat"
                isDisabled={page >= totalPages || loading}
                onPress={onNext}
                aria-label="Halaman berikutnya"
                className="min-h-11 min-w-0 px-2 sm:min-w-24 sm:px-4"
              >
                <span className="sm:hidden">Lanjut</span>
                <span className="hidden sm:inline">Berikutnya</span>
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
