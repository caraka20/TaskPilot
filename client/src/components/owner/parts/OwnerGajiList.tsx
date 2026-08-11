import { CardBody, Spacer, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Chip, Button, Spinner } from "@heroui/react";
import { CalendarDays, ExternalLink, FileText, Pencil, Trash2, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { currencyIDR, fmtDate } from "../../../utils/format";
import type { GajiItem } from "../../../services/gaji.service";

type Props = {
  rows: GajiItem[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (row: GajiItem) => void;
  onDelete?: (id: number) => void;
  readOnly?: boolean;
};

export default function OwnerGajiList({ rows, loading = false, error, onEdit, onDelete, readOnly = false }: Props) {
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

      <div className="space-y-3 md:hidden" aria-live="polite" aria-busy={loading}>
        {loading && rows.length === 0 ? (
          <div className="flex min-h-36 items-center justify-center gap-2 rounded-2xl border border-default-200 bg-content1/60 text-sm text-foreground-500">
            <Spinner size="sm" />
            Memuat pembayaran…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-default-300 bg-default-50/60 px-6 text-center text-sm text-foreground-500">
            Belum ada data pembayaran.
          </div>
        ) : (
          rows.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-default-200 bg-content1 p-4 shadow-sm"
              aria-label={`Pembayaran untuk ${row.username}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <UserRound className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate font-semibold">{row.namaLengkap || row.username}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 pl-6">
                    <Chip size="sm" variant="flat" color="primary">@{row.username}</Chip>
                    <span className="text-xs text-foreground-400">#{row.id}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right text-base font-semibold tabular-nums text-success-700 dark:text-success-400">
                  {currencyIDR.format(row.jumlahBayar)}
                </div>
              </div>

              <dl className="mt-4 grid gap-2 rounded-xl bg-default-50 p-3 text-sm dark:bg-default-100/50">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-foreground-400" aria-hidden />
                  <dt className="sr-only">Tanggal pembayaran</dt>
                  <dd className="text-foreground-600">{fmtDate(row.tanggalBayar)}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-foreground-400" aria-hidden />
                  <dt className="sr-only">Catatan</dt>
                  <dd className="break-words text-foreground-600">{row.catatan ?? "Tanpa catatan"}</dd>
                </div>
              </dl>

              {!readOnly && onEdit && onDelete ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="flat"
                  color="primary"
                  onPress={() => onEdit(row)}
                  startContent={<Pencil className="h-4 w-4" />}
                  aria-label={`Edit gaji ${row.username}`}
                  className="min-h-11"
                >
                  Edit
                </Button>
                <Button
                  variant="flat"
                  color="danger"
                  onPress={() => onDelete(row.id)}
                  startContent={<Trash2 className="h-4 w-4" />}
                  aria-label={`Hapus gaji ${row.username}`}
                  className="min-h-11"
                >
                  Hapus
                </Button>
              </div>
              ) : (
                <Button
                  as={Link}
                  to={`/users/${encodeURIComponent(row.username)}`}
                  variant="flat"
                  color="primary"
                  endContent={<ExternalLink className="h-4 w-4" />}
                  className="mt-4 min-h-11 w-full"
                >
                  Buka Profil User
                </Button>
              )}
            </article>
          ))
        )}
      </div>

      <div className="hidden rounded-2xl border bg-content1/40 p-2 md:block">
        <Table aria-label="Tabel pembayaran gaji" removeWrapper shadow="none">
          <TableHeader>
            <TableColumn>TANGGAL</TableColumn>
            <TableColumn>USERNAME</TableColumn>
            <TableColumn>JUMLAH</TableColumn>
            <TableColumn>CATATAN</TableColumn>
            <TableColumn>{readOnly ? "PROFIL" : "ACTION"}</TableColumn>
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
                  {!readOnly && onEdit && onDelete ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => onEdit?.(r)}
                      aria-label={`Edit gaji ${r.username}`}
                      className="min-h-10 min-w-16"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => onDelete?.(r.id)}
                      aria-label={`Hapus gaji ${r.username}`}
                      className="min-h-10 min-w-16"
                    >
                      Hapus
                    </Button>
                  </div>
                  ) : (
                    <Button
                      as={Link}
                      to={`/users/${encodeURIComponent(r.username)}`}
                      size="sm"
                      variant="flat"
                      color="primary"
                      endContent={<ExternalLink className="h-3.5 w-3.5" />}
                      className="min-h-10"
                    >
                      Profil
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardBody>
  );
}
