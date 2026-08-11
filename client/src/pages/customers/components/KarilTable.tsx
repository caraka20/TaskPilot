// client/src/pages/customers/components/KarilTable.tsx
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Chip,
  Progress,
  Tooltip,
  Button,
  Skeleton,
} from "@heroui/react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";
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
    <div className="rounded-2xl border border-default-200 bg-content1 shadow-md overflow-hidden">
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-default-300 bg-content1 px-5 py-12 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-foreground-300" />
            <p className="mt-3 font-semibold text-foreground">Belum ada data KARIL</p>
            <p className="mt-1 text-sm text-foreground-500">Data yang sesuai dengan filter akan tampil di sini.</p>
          </div>
        ) : (
          rows.map((row, index) => {
            const pct = Math.round((row.progress ?? 0) * 100);
            const customerDetailPath = `/customers/${row.customerId}`;
            const tasks = [row.tugas1, row.tugas2, row.tugas3, row.tugas4];

            return (
              <article key={row.id} className="rounded-3xl border border-default-200 bg-content1 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    {nomor(index)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 font-bold text-foreground">{row.namaCustomer}</h3>
                    <p className="mt-1 break-all font-mono text-xs text-foreground-500">{row.nim}</p>
                  </div>
                  <Chip size="sm" color={pct >= 100 ? "success" : pct > 0 ? "primary" : "default"} variant="flat">
                    {pct}%
                  </Chip>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-400">Jurusan</p>
                    <p className="mt-1 text-sm text-foreground-700">{row.jurusan || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-400">Judul</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-foreground-700">{row.judul || "Belum ada judul"}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-default-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground-500">Progress tugas</span>
                    <span className="text-xs font-bold">{row.doneTasks}/{row.totalTasks} selesai</span>
                  </div>
                  <Progress
                    aria-label={`Progress KARIL ${row.namaCustomer}`}
                    value={pct}
                    color={pct >= 100 ? "success" : pct > 0 ? "primary" : "default"}
                    size="sm"
                  />
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {tasks.map((done, taskIndex) => (
                      <Chip
                        key={taskIndex}
                        size="sm"
                        color={done ? "success" : "default"}
                        variant="flat"
                        className="w-full justify-center"
                      >
                        T{taskIndex + 1}
                      </Chip>
                    ))}
                  </div>
                </div>

                <Button
                  as={Link}
                  to={customerDetailPath}
                  color="primary"
                  variant="flat"
                  className="mt-4 min-h-11 w-full rounded-2xl"
                  endContent={<ArrowRight className="h-4 w-4" />}
                >
                  Lihat detail customer
                </Button>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden md:block">
      <Wrapper>
        <div className="overflow-x-auto">
          <Table
            aria-label="Daftar KARIL"
            removeWrapper
            isStriped
            className="rounded-none"
            classNames={{
              th: "bg-content2 text-foreground-500 font-semibold",
              td: "text-foreground align-top",
              tr: "data-[hover=true]:bg-default-50 dark:data-[hover=true]:bg-content2",
              tbody: "bg-transparent",
            }}
          >
            <TableHeader>
              <TableColumn className="w-[64px] text-center">No</TableColumn>
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
                  <TableRow key={r.id}>
                    {/* No */}
                    <TableCell className="text-center">
                      <span
                        className={[
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                          "bg-gradient-to-br from-default-100 to-default-200 text-foreground-600",
                          "dark:from-content2 dark:to-content2/80 dark:text-foreground-500",
                        ].join(" ")}
                      >
                        {nomor(idx)}
                      </span>
                    </TableCell>

                    {/* Nama */}
                    <TableCell>
                      <Button
                        as={Link}
                        to={customerDetailPath}
                        variant="light"
                        className="px-0 text-foreground font-medium hover:underline"
                      >
                        {r.namaCustomer}
                      </Button>
                    </TableCell>

                    {/* NIM */}
                    <TableCell>
                      <span className="font-mono text-[13px] text-foreground-600">{r.nim}</span>
                    </TableCell>

                    {/* Jurusan */}
                    <TableCell>
                      <div className="truncate max-w-[260px] text-foreground" title={r.jurusan}>
                        {r.jurusan}
                      </div>
                    </TableCell>

                    {/* Judul */}
                    <TableCell>
                      <div className="truncate max-w-[360px] text-foreground" title={r.judul}>
                        {r.judul}
                      </div>
                    </TableCell>

                    {/* Tugas */}
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Chip size="sm" variant="flat" color={r.tugas1 ? "success" : "default"}>
                          T1
                        </Chip>
                        <Chip size="sm" variant="flat" color={r.tugas2 ? "success" : "default"}>
                          T2
                        </Chip>
                        <Chip size="sm" variant="flat" color={r.tugas3 ? "success" : "default"}>
                          T3
                        </Chip>
                        <Chip size="sm" variant="flat" color={r.tugas4 ? "success" : "default"}>
                          T4
                        </Chip>

                        <Chip
                          size="sm"
                          variant="flat"
                          className="ml-1 bg-default-100 text-foreground-600 border border-default-200"
                        >
                          {r.doneTasks}/{r.totalTasks}
                        </Chip>
                      </div>
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress
                          aria-label="progress"
                          value={pct}
                          className="w-[180px]"
                          color={pct >= 100 ? "success" : pct > 0 ? "primary" : "default"}
                        />
                        <span className="text-sm text-foreground-600">{pct}%</span>
                      </div>
                    </TableCell>

                    {/* Aksi */}
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
      </div>

      {pagination && (
        <div className="flex justify-center overflow-x-auto py-1 sm:justify-end">
          <Pagination
            showControls
            page={page}
            total={pagination.totalPages}
            onChange={onPageChange}
            classNames={{
              cursor: "bg-gradient-to-r from-sky-500 to-indigo-500 text-white",
            }}
          />
        </div>
      )}
    </div>
  );
}

export function KarilTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-default-200 bg-content1 shadow-md overflow-hidden">
      <div className="p-4">
        {Array.from({ length: rows }).map((_, i) => (
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
