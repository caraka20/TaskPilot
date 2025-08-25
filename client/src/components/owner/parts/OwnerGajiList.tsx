import { CardBody, Spacer, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Chip, Button } from "@heroui/react";
import { currencyIDR, fmtDate } from "../../../utils/format";
import type { GajiItem } from "../../../services/gaji.service";

type Props = {
  rows: GajiItem[];
  loading?: boolean;
  error?: string | null;
  onEdit: (row: GajiItem) => void;
  onDelete: (id: number) => void;
};

export default function OwnerGajiList({ rows, loading = false, error, onEdit, onDelete }: Props) {
  return (
    <CardBody>
      {error && (
        <>
          <div className="rounded-large border border-danger-200 bg-danger-50 text-danger-700 px-3 py-2 text-sm">
            {error}
          </div>
          <Spacer y={2}/>
        </>
      )}

      <div className="rounded-2xl border bg-content1/40 p-2">
        <Table aria-label="Tabel pembayaran gaji" removeWrapper shadow="none">
          <TableHeader>
            <TableColumn>TANGGAL</TableColumn>
            <TableColumn>USERNAME</TableColumn>
            <TableColumn>JUMLAH</TableColumn>
            <TableColumn>CATATAN</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Belum ada data." isLoading={loading}>
            {(rows ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{fmtDate(r.tanggalBayar)}</span>
                    <span className="text-xs text-foreground-500">#{r.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat">{r.username}</Chip>
                    {r.namaLengkap && (
                      <span className="text-xs text-foreground-500">{r.namaLengkap}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{currencyIDR.format(r.jumlahBayar)}</TableCell>
                <TableCell>{r.catatan ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => onEdit(r)}
                      aria-label={`Edit gaji ${r.username}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => onDelete(r.id)}
                      aria-label={`Hapus gaji ${r.username}`}
                    >
                      Hapus
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardBody>
  );
}
