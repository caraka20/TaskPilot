// client/src/pages/customers/components/CustomerTable.tsx
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Button, Tooltip, Chip,
} from "@heroui/react";
import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import type { CustomerItem, CustomerListResponse } from "../../../utils/customer";
import CustomerStatusChip from "./CustomerStatusChip";
import { fmtRp } from "../../../utils/customer";
import { useAuthStore } from "../../../store/auth.store";

interface Props {
  data?: CustomerListResponse;
  loading?: boolean;
  page: number;
  onPageChange: (p: number) => void;
  onDelete?: (row: CustomerItem) => void;
  /** Jika true, selalu tampilkan tampilan "OWNER view" (aksi lengkap) terlepas dari role */
  manageAccess?: boolean;
}

function JenisPill({ jenis }: { jenis?: string }) {
  const cls =
    jenis === "TUTON"
      ? "bg-sky-50 text-sky-700 border-sky-100"
      : jenis === "KARIL"
      ? "bg-violet-50 text-violet-700 border-violet-100"
      : jenis === "TK"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-slate-50 text-slate-700 border-slate-100";
  return (
    <Chip size="sm" variant="flat" className={`border ${cls}`}>
      {jenis ?? "-"}
    </Chip>
  );
}

export default function CustomerTable({
  data,
  loading,
  page,
  onPageChange,
  onDelete,
  manageAccess,
}: Props) {
  const rows = data?.items ?? [];
  const pagination = data?.pagination;

  const isOwner = useAuthStore((s) => s.role === "OWNER");
  const canManage = manageAccess ?? isOwner;

  const location = useLocation(); // ⬅️ bawa ?page=&limit=&q=&jenis=

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) =>
      (a.namaCustomer || "").localeCompare(b.namaCustomer || "", "id", {
        sensitivity: "base",
      })
    );
    return arr;
  }, [rows]);

  const nomor = (idx: number) => {
    const limit = pagination?.limit ?? 10;
    const currPage = pagination?.page ?? page ?? 1;
    return limit * (currPage - 1) + (idx + 1);
  };

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-2">
      {children}
    </div>
  );

  if (canManage) {
    return (
      <div className="flex flex-col gap-3">
        <Wrapper>
          <Table aria-label="Tabel Customer (Manage)" removeWrapper isStriped className="rounded-lg">
            <TableHeader>
              <TableColumn className="w-[64px]">No</TableColumn>
              <TableColumn>Nama</TableColumn>
              <TableColumn>NIM</TableColumn>
              <TableColumn>Jurusan</TableColumn>
              <TableColumn>Jenis</TableColumn>
              <TableColumn className="min-w-[220px]">Tagihan</TableColumn>
              <TableColumn className="min-w-[120px]">Status</TableColumn>
              <TableColumn className="text-right">Aksi</TableColumn>
            </TableHeader>

            <TableBody isLoading={loading} emptyContent={loading ? "Memuat..." : "Belum ada data"}>
              {sorted.map((row, idx) => {
                const total = row.totalBayar ?? 0;
                const bayar = row.sudahBayar ?? 0;
                const sisa = row.sisaBayar ?? Math.max(total - bayar, 0);

                return (
                  <TableRow key={row.id} className="hover:bg-sky-50">
                    <TableCell>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-[12px] font-semibold text-slate-700">
                        {nomor(idx)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">
                          <Link
                            to={{ pathname: `/customers/${row.id}`, search: location.search }}
                            className="hover:underline"
                          >
                            {row.namaCustomer}
                          </Link>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell><div className="font-mono text-[13px] text-slate-700">{row.nim}</div></TableCell>
                    <TableCell><div className="truncate max-w-[240px]" title={row.jurusan}>{row.jurusan}</div></TableCell>
                    <TableCell><JenisPill jenis={row.jenis} /></TableCell>

                    <TableCell>
                      <div className="flex flex-col leading-5">
                        <span className="text-slate-700">Total: {fmtRp(total)}</span>
                        <span className="text-slate-700">Bayar: {fmtRp(bayar)}</span>
                        <span className={sisa > 0 ? "text-rose-600 font-medium" : "text-emerald-600 font-medium"}>
                          Sisa: {fmtRp(sisa)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell><CustomerStatusChip row={row} /></TableCell>

                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Tooltip content="Lihat detail">
                          <Button
                            as={Link}
                            to={{ pathname: `/customers/${row.id}`, search: location.search }}
                            size="sm"
                            className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
                          >
                            Detail
                          </Button>
                        </Tooltip>

                        <Tooltip content="Hapus">
                          <Button size="sm" color="danger" variant="flat" onPress={() => onDelete?.(row)}>
                            Hapus
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Wrapper>

        {pagination && (
          <div className="flex justify-end">
            <Pagination showControls page={page} total={pagination.totalPages} onChange={onPageChange} />
          </div>
        )}
      </div>
    );
  }

  // read-only
  return (
    <div className="flex flex-col gap-3">
      <Wrapper>
        <Table aria-label="Tabel Customer (Read-only)" removeWrapper isStriped className="rounded-lg">
          <TableHeader>
            <TableColumn className="w-[64px]">No</TableColumn>
            <TableColumn>Nama</TableColumn>
            <TableColumn>NIM</TableColumn>
            <TableColumn>Jurusan</TableColumn>
            <TableColumn>Jenis</TableColumn>
            <TableColumn className="text-right">Aksi</TableColumn>
          </TableHeader>

          <TableBody isLoading={loading} emptyContent={loading ? "Memuat..." : "Belum ada data"}>
            {sorted.map((row, idx) => (
              <TableRow key={row.id} className="hover:bg-sky-50">
                <TableCell>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-[12px] font-semibold text-slate-700">
                    {nomor(idx)}
                  </span>
                </TableCell>

                <TableCell>
                  <Link
                    to={{ pathname: `/customers/${row.id}`, search: location.search }}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {row.namaCustomer}
                  </Link>
                </TableCell>

                <TableCell><span className="font-mono text-[13px] text-slate-700">{row.nim}</span></TableCell>
                <TableCell><div className="truncate max-w-[240px]" title={row.jurusan}>{row.jurusan}</div></TableCell>
                <TableCell><JenisPill jenis={row.jenis} /></TableCell>

                <TableCell className="text-right">
                  <Tooltip content="Lihat detail">
                    <Button
                      as={Link}
                      to={{ pathname: `/customers/${row.id}`, search: location.search }}
                      size="sm"
                      className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
                    >
                      Detail
                    </Button>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Wrapper>

      {pagination && (
        <div className="flex justify-end">
          <Pagination showControls page={page} total={pagination.totalPages} onChange={onPageChange} />
        </div>
      )}
    </div>
  );
}
