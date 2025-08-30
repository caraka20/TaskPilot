import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Chip, Progress, Tooltip, Button,
  Skeleton
} from "@heroui/react";
import { Link } from "react-router-dom";
import type { KarilListResponse } from "../../../services/karil.service";

type Props = {
  data?: KarilListResponse;
  loading?: boolean;
  page: number;
  onPageChange: (p: number) => void;
};

export default function KarilTable({ data, loading, page, onPageChange }: Props) {
  const rows = data?.items ?? [];
  const pagination = data?.pagination;

  const nomor = (idx: number) => {
    const limit = pagination?.limit ?? 10;
    const currPage = pagination?.page ?? page ?? 1;
    return limit * (currPage - 1) + (idx + 1);
  };

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
      {children}
    </div>
  );

  const tableBaseCls =
    "rounded-none [&_thead_th]:text-slate-600 [&_thead_th]:font-semibold " +
    "[&_thead_th]:bg-slate-50 [&_tbody_td]:align-top";

  return (
    <div className="flex flex-col gap-4">
      <Wrapper>
        <div className="overflow-x-auto">
          <Table aria-label="Daftar KARIL" removeWrapper isStriped className={tableBaseCls}>
            <TableHeader>
              <TableColumn className="w-[64px]">No</TableColumn>
              <TableColumn>Nama</TableColumn>
              <TableColumn className="min-w-[120px]">NIM</TableColumn>
              <TableColumn className="min-w-[220px]">Jurusan</TableColumn>
              <TableColumn className="min-w-[260px]">Judul</TableColumn>
              <TableColumn className="min-w-[160px]">Tugas</TableColumn>
              <TableColumn className="min-w-[220px]">Progress</TableColumn>
              <TableColumn className="text-right min-w-[140px]">Aksi</TableColumn>
            </TableHeader>

            <TableBody isLoading={loading} emptyContent={loading ? "Memuat..." : "Belum ada data"}>
              {rows.map((r, idx) => {
                const pct = Math.round((r.progress ?? 0) * 100);
                const customerDetailPath = `/customers/${r.customerId}`;
                return (
                  <TableRow key={r.id} className="hover:bg-sky-50/60">
                    <TableCell>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-[12px] font-semibold text-slate-700">
                        {nomor(idx)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Button
                        as={Link}
                        to={customerDetailPath}
                        variant="light"
                        className="px-0 text-slate-900 font-medium hover:underline"
                      >
                        {r.namaCustomer}
                      </Button>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-[13px] text-slate-700">{r.nim}</span>
                    </TableCell>

                    <TableCell>
                      <div className="truncate max-w-[260px] text-slate-800" title={r.jurusan}>
                        {r.jurusan}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="truncate max-w-[360px] text-slate-800" title={r.judul}>
                        {r.judul}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Chip size="sm" variant="flat" color={r.tugas1 ? "success" : "default"}>T1</Chip>
                        <Chip size="sm" variant="flat" color={r.tugas2 ? "success" : "default"}>T2</Chip>
                        <Chip size="sm" variant="flat" color={r.tugas3 ? "success" : "default"}>T3</Chip>
                        <Chip size="sm" variant="flat" color={r.tugas4 ? "success" : "default"}>T4</Chip>
                        <Chip size="sm" variant="flat" className="ml-1 border border-slate-200 bg-slate-50">
                          {r.doneTasks}/{r.totalTasks}
                        </Chip>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress aria-label="progress" value={pct} className="w-[180px]" />
                        <span className="text-sm text-slate-600">{pct}%</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Tooltip content="Lihat detail Customer">
                        <Button
                          as={Link}
                          to={customerDetailPath}
                          size="sm"
                          className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm"
                        >
                          Detail
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Wrapper>

      {pagination && (
        <div className="flex justify-end">
          <Pagination
            showControls
            page={page}
            total={pagination.totalPages}
            onChange={onPageChange}
            className="shadow-sm rounded-full px-2"
          />
        </div>
      )}
    </div>
  );
}

export function KarilTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
      <div className="p-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="h-5 w-6 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-56" />
          </div>
        ))}
      </div>
    </div>
  );
}