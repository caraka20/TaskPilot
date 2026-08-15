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
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  FlaskConical,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import type { KarilListResponse } from "../../../services/karil.service";

type Props = {
  data?: KarilListResponse;
  loading?: boolean;
  page: number;
  onPageChange: (p: number) => void;
  label?: string;
};

export default function KarilTable({ data, loading, page, onPageChange, label = "KARIL" }: Props) {
  const rows = data?.items ?? [];
  const pagination = data?.pagination;
  const isMetode = label.toLowerCase().includes("metode");
  const ServiceIcon = isMetode ? FlaskConical : FileText;
  const completedRows = rows.filter((row) => row.totalTasks > 0 && row.doneTasks >= row.totalTasks).length;

  const nomor = (idx: number) => {
    const limit = pagination?.limit ?? 10;
    const currPage = pagination?.page ?? page ?? 1;
    return limit * (currPage - 1) + (idx + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isMetode ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-violet-500/10 text-violet-600 dark:text-violet-300"}`}>
            <ServiceIcon className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">Daftar {isMetode ? "Metode Penelitian" : "Karya Ilmiah"}</h2>
            <p className="mt-0.5 text-xs text-foreground-500">Pantau identitas, judul, dan empat tugas setiap customer.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="flat" startContent={<UsersRound className="h-3.5 w-3.5" />}>
            {pagination?.total ?? rows.length} customer
          </Chip>
          <Chip size="sm" color="success" variant="flat" startContent={<CheckCircle2 className="h-3.5 w-3.5" />}>
            {completedRows} selesai di halaman ini
          </Chip>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-default-300 bg-default-50/60 px-5 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-default-100 text-foreground-400">
              <GraduationCap className="h-6 w-6" />
            </span>
            <p className="mt-3 font-semibold text-foreground">Belum ada data {label}</p>
            <p className="mt-1 text-sm text-foreground-500">Data yang sesuai dengan filter akan tampil di sini.</p>
          </div>
        ) : (
          rows.map((row, index) => {
            const pct = Math.round((row.progress ?? 0) * 100);
            const customerDetailPath = `/customers/${row.customerId}`;
            const tasks = [row.tugas1, row.tugas2, row.tugas3, row.tugas4];

            return (
              <article key={row.customerId} className="relative overflow-hidden rounded-2xl border border-default-200 bg-content1 p-4 shadow-[0_8px_24px_rgba(15,23,42,.05)]">
                <span className={`absolute inset-y-0 left-0 w-1 ${isMetode ? "bg-emerald-500" : "bg-violet-500"}`} />
                <div className="flex items-start gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${isMetode ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-violet-500/10 text-violet-700 dark:text-violet-300"}`}>
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

                <div className="mt-4 grid gap-3 rounded-xl bg-default-50/75 p-3">
                  <div className="grid grid-cols-[76px_1fr] gap-3 text-sm">
                    <span className="text-foreground-400">Jurusan</span>
                    <span className="font-medium text-foreground-700">{row.jurusan || "—"}</span>
                  </div>
                  <div className="grid grid-cols-[76px_1fr] gap-3 text-sm">
                    <span className="text-foreground-400">Judul</span>
                    <span className="line-clamp-3 font-medium leading-5 text-foreground-700">{row.judul || "Belum ada judul"}</span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-default-200/70 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-foreground-500">Progress tugas</span>
                    <span className="text-xs font-bold">{row.doneTasks}/{row.totalTasks} selesai</span>
                  </div>
                  <Progress
                    aria-label={`Progress ${label} ${row.namaCustomer}`}
                    value={pct}
                    color={pct >= 100 ? "success" : pct > 0 ? (isMetode ? "success" : "primary") : "default"}
                    size="sm"
                  />
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {tasks.map((done, taskIndex) => (
                      <Chip
                        key={taskIndex}
                        size="sm"
                        color={done ? "success" : "default"}
                        variant="flat"
                        className="w-full justify-center font-semibold"
                      >
                        T{taskIndex + 1}
                      </Chip>
                    ))}
                  </div>
                </div>

                <Button
                  as={Link}
                  to={customerDetailPath}
                  color={isMetode ? "success" : "primary"}
                  variant="flat"
                  className="mt-4 min-h-11 w-full rounded-xl font-semibold"
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
        <div className="overflow-hidden rounded-2xl border border-default-200/80">
        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <Table
            aria-label={`Daftar ${label}`}
            removeWrapper
            className="min-w-[1120px] rounded-none bg-content1"
            classNames={{
              th: "h-12 bg-default-50 px-4 text-[11px] font-bold uppercase tracking-wider text-foreground-500",
              td: "border-b border-default-100 px-4 py-3.5 text-foreground align-middle",
              tr: "last:[&>td]:border-b-0 data-[hover=true]:bg-primary/[0.035]",
              tbody: "bg-transparent",
            }}
          >
            <TableHeader>
              <TableColumn className="w-[60px] text-center">No.</TableColumn>
              <TableColumn className="min-w-[210px]">Mahasiswa</TableColumn>
              <TableColumn className="min-w-[190px]">Jurusan</TableColumn>
              <TableColumn className="min-w-[270px]">Judul</TableColumn>
              <TableColumn className="min-w-[190px]">Tugas</TableColumn>
              <TableColumn className="min-w-[210px]">Progres</TableColumn>
              <TableColumn className="min-w-[130px] text-right">Tindakan</TableColumn>
            </TableHeader>

            <TableBody isLoading={loading} emptyContent={loading ? "Memuat..." : "Belum ada data"}>
              {rows.map((r, idx) => {
                const pct = Math.round((r.progress ?? 0) * 100);
                const customerDetailPath = `/customers/${r.customerId}`;

                return (
                  <TableRow key={r.customerId}>
                    <TableCell className="text-center">
                      <span
                        className={[
                          "inline-flex h-8 w-8 items-center justify-center rounded-xl text-[12px] font-bold",
                          isMetode
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "bg-violet-500/10 text-violet-700 dark:text-violet-300",
                        ].join(" ")}
                      >
                        {nomor(idx)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="min-w-0">
                        <Link to={customerDetailPath} className="block truncate font-semibold text-foreground transition-colors hover:text-primary">
                          {r.namaCustomer}
                        </Link>
                        <span className="mt-1 block font-mono text-xs text-foreground-400">{r.nim}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="line-clamp-2 max-w-[230px] text-sm leading-5 text-foreground-600" title={r.jurusan}>
                        {r.jurusan || "—"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="line-clamp-2 max-w-[330px] text-sm font-medium leading-5 text-foreground-700" title={r.judul}>
                        {r.judul || "Belum ada judul"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {[r.tugas1, r.tugas2, r.tugas3, r.tugas4].map((done, taskIndex) => (
                          <Tooltip key={taskIndex} content={done ? `Tugas ${taskIndex + 1} selesai` : `Tugas ${taskIndex + 1} belum selesai`}>
                            <span className={`inline-flex h-7 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-bold ${done ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-default-100 text-foreground-400"}`}>
                              T{taskIndex + 1}
                            </span>
                          </Tooltip>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="min-w-[180px]">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-500">
                            {pct >= 100 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Clock3 className="h-3.5 w-3.5 text-amber-500" />}
                            {r.doneTasks}/{r.totalTasks} tugas
                          </span>
                          <span className="text-xs font-bold text-foreground">{pct}%</span>
                        </div>
                        <Progress
                          aria-label={`Progres ${label} ${r.namaCustomer}`}
                          value={pct}
                          size="sm"
                          color={pct >= 100 ? "success" : pct > 0 ? (isMetode ? "success" : "primary") : "default"}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Tooltip content="Lihat detail Customer">
                        <Button
                          as={Link}
                          to={customerDetailPath}
                          size="sm"
                          variant="flat"
                          color={isMetode ? "success" : "primary"}
                          endContent={<ArrowRight className="h-3.5 w-3.5" />}
                          className="min-h-9 font-semibold"
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
        </div>
      </div>

      {pagination && (
        <div className="flex justify-center overflow-x-auto py-1 sm:justify-end">
          <Pagination
            showControls
            page={page}
            total={pagination.totalPages}
            onChange={onPageChange}
            classNames={{
              cursor: isMetode ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white",
            }}
          />
        </div>
      )}
    </div>
  );
}

export function KarilTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1">
      <div className="border-b border-default-200 bg-default-50 px-4 py-4">
        <Skeleton className="h-5 w-52 rounded-lg" />
      </div>
      <div className="p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-default-100 py-3 last:border-b-0">
            <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
            <Skeleton className="h-4 w-44 rounded-lg" />
            <Skeleton className="hidden h-4 w-32 rounded-lg sm:block" />
            <Skeleton className="hidden h-4 flex-1 rounded-lg md:block" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
