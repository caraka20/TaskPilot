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
import { fmtDate, toHMS } from "../../utils/format";
import type { JamKerjaItem } from "../../services/jamKerja.service";

type Row = JamKerjaItem & { durasiDetik?: number };

export default function HistoriHariIniTable({ rows }: { rows: Row[] }) {
  return (
    <Card>
      <CardHeader className="font-semibold">Histori Jam Kerja (Hari Ini)</CardHeader>
      <CardBody>
        <Table aria-label="Histori hari ini">
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
      </CardBody>
    </Card>
  );
}
