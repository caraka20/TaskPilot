// client/src/components/dashboard/HistoriHariIniTable.tsx
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
  Chip,
} from "@heroui/react";
import { CalendarDays, Clock3 } from "lucide-react";
import { fmtDate, toHMS } from "../../utils/format";
import type { JamKerjaItem } from "../../services/jamKerja.service";

type Row = JamKerjaItem & { durasiDetik?: number };

export default function HistoriHariIniTable({ rows }: { rows: Row[] }) {
  return (
    <Card className="border border-default-200 shadow-sm">
      <CardHeader className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold">Histori Jam Kerja</span>
        <span className="text-xs text-foreground-500">Hari ini</span>
      </CardHeader>
      <CardBody className="px-3 pb-3 pt-0 sm:px-5 sm:pb-5">
        <div className="grid gap-3 md:hidden">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-default-200 px-4 py-8 text-center text-sm text-foreground-500">
              Belum ada data hari ini.
            </div>
          ) : (
            rows.map((row) => (
              <article key={row.id} className="rounded-2xl border border-default-200 bg-content2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarDays className="h-4 w-4 text-indigo-500" />
                      {new Date(row.mulai).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <p className="mt-2 text-xs text-foreground-500">
                      {new Date(row.mulai).toLocaleTimeString("id-ID")} – {row.selesai
                        ? new Date(row.selesai).toLocaleTimeString("id-ID")
                        : "Sekarang"}
                    </p>
                  </div>
                  {row.selesai ? (
                    <Chip size="sm" color="default" variant="flat">Selesai</Chip>
                  ) : (
                    <Chip
                      size="sm"
                      color={row.status === "JEDA" ? "warning" : "success"}
                      variant="flat"
                    >
                      {row.status}
                    </Chip>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-default-50 px-3 py-2 dark:bg-default-100/50">
                  <span className="flex items-center gap-2 text-xs text-foreground-500">
                    <Clock3 className="h-4 w-4" /> Durasi
                  </span>
                  <span className="font-mono text-sm font-bold">{toHMS(row.durasiDetik)}</span>
                </div>
                {row.catatan && <p className="mt-3 text-sm text-foreground-600">{row.catatan}</p>}
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
        <Table aria-label="Histori hari ini" classNames={{ table: "min-w-[760px]" }}>
          <TableHeader>
            <TableColumn>TANGGAL</TableColumn>
            <TableColumn>MULAI</TableColumn>
            <TableColumn>SELESAI/STATUS</TableColumn>
            <TableColumn>DURASI</TableColumn>
            <TableColumn>CATATAN</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Belum ada data hari ini.">
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{fmtDate(row.mulai)}</TableCell>
                <TableCell>{new Date(row.mulai).toLocaleTimeString("id-ID")}</TableCell>
                <TableCell>
                  {row.selesai ? (
                    new Date(row.selesai).toLocaleTimeString("id-ID")
                  ) : (
                    <Chip
                      size="sm"
                      color={row.status === "JEDA" ? "warning" : "success"}
                      variant="flat"
                    >
                      {row.status}
                    </Chip>
                  )}
                </TableCell>
                <TableCell>{toHMS(row.durasiDetik)}</TableCell>
                <TableCell>{row.catatan || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardBody>
    </Card>
  );
}
