import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Avatar, Badge, Button, Tooltip } from "@heroui/react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { RangeKey, RowItem } from "./userlist.types";

export default function UserListTable({
  rows,
  range,
}: {
  rows: RowItem[];
  range: RangeKey;
}) {
  const pickTotals = (u: RowItem) => {
    switch (range) {
      case "TODAY": return { jam: u.totalJamHariIni,   gaji: u.totalGajiHariIni };
      case "WEEK":  return { jam: u.totalJamMingguIni, gaji: u.totalGajiMingguIni };
      case "MONTH": return { jam: u.totalJamBulanIni,  gaji: u.totalGajiBulanIni };
      default:      return { jam: u.totalJamSemua,     gaji: u.totalGajiSemua };
    }
  };

  const fmtHours = (x: any) => (Math.round((Number(x) || 0) * 10) / 10).toFixed(1);
  const fmtRupiah = (x: any) => `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(x) || 0)}`;

  return (
    <Table
      aria-label="Daftar Users"
      removeWrapper
      isStriped
      classNames={{
        table: "rounded-2xl overflow-hidden",
        th: "bg-gradient-to-r from-default-100 to-default-50 text-foreground-600 font-semibold",
        td: "align-middle",
        tr: "hover:bg-default-50 transition-colors",
      }}
    >
      <TableHeader>
        <TableColumn>Username</TableColumn>
        <TableColumn>Status</TableColumn>
        <TableColumn className="text-right">Total Jam</TableColumn>
        <TableColumn className="text-right">Total Gaji</TableColumn>
        <TableColumn className="text-right">Aksi</TableColumn>
      </TableHeader>

      <TableBody emptyContent={<div className="py-8 text-center text-foreground-500">Belum ada data</div>}>
        {rows.map((u) => {
          const totals = pickTotals(u);
          const href = `/users/${encodeURIComponent(u.username)}`;
          const initials = (u.username?.slice(0, 2) || "US").toUpperCase();

          return (
            <TableRow key={u.username}>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="shadow-sm" name={initials} color="primary" />
                  <Link to={href} className="text-primary font-semibold hover:opacity-80 underline underline-offset-2">
                    {u.username}
                  </Link>
                </div>
              </TableCell>

              <TableCell>
                {u.statusNow === "AKTIF" ? (
                  <Badge content="" color="success" shape="circle" placement="bottom-right" className="animate-pulse">
                    <span className="inline-block bg-success-100 text-success-700 px-2 py-1 rounded-lg text-xs">Aktif</span>
                  </Badge>
                ) : u.statusNow === "JEDA" ? (
                  <span className="inline-block bg-warning-100 text-warning-700 px-2 py-1 rounded-lg text-xs">Jeda</span>
                ) : u.statusNow === "SELESAI" ? (
                  <span className="inline-block bg-secondary-100 text-secondary-700 px-2 py-1 rounded-lg text-xs">Selesai</span>
                ) : (
                  <span className="inline-block bg-default-100 text-foreground-600 px-2 py-1 rounded-lg text-xs">Off</span>
                )}
              </TableCell>

              <TableCell className="text-right tabular-nums">
                {fmtHours(totals.jam)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">
                {fmtRupiah(totals.gaji)}
              </TableCell>

              <TableCell>
                <div className="flex justify-end">
                  <Tooltip content="Lihat detail">
                    <Button
                      as={Link}
                      to={href}
                      size="sm"
                      variant="flat"
                      endContent={<ChevronRight className="h-4 w-4" />}
                      className="rounded-xl"
                    >
                      Detail
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}