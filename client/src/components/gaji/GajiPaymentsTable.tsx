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
} from "@heroui/react";
import { ReceiptText } from "lucide-react";
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
    <Card className="lg:col-span-7 border border-default-100">
      <CardHeader className="pb-0 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl grid place-items-center bg-emerald-50 text-emerald-700">
          <ReceiptText className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-xl font-semibold tracking-tight">Riwayat Pembayaran</div>
          <div className="text-foreground-500 text-sm -mt-0.5">
            Catatan semua pembayaran yang pernah Anda terima
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-3 pb-0 px-0 sm:px-0 flex flex-col h-[560px]">
        {error && (
          <div className="mx-3 sm:mx-4 mb-3 rounded-large border border-danger-200 bg-danger-50 text-danger-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto px-3 sm:px-4">
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

        <div className="mt-auto w-full px-3 sm:px-4 py-3 border-t border-default-100 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-foreground-500">
              Menampilkan {Math.min(rows.length, PAGE_SIZE)} dari {total} entri.
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                isDisabled={page <= 1 || loading}
                onPress={onPrev}
                aria-label="Halaman sebelumnya"
              >
                Prev
              </Button>
              <Chip variant="flat" radius="sm" className="min-w-[104px] justify-center">
                Halaman {page}/{totalPages}
              </Chip>
              <Button
                size="sm"
                variant="flat"
                isDisabled={page >= totalPages || loading}
                onPress={onNext}
                aria-label="Halaman berikutnya"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
