// client/src/pages/customers/components/CustomerTable.tsx
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  Tooltip,
  Chip,
} from "@heroui/react";
import { Link, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { ArrowRight, Trash2, UserRound, UsersRound } from "lucide-react";
import {
  CUSTOMER_LAYANAN_LABEL,
  type CustomerItem,
  type CustomerLayanan,
  type CustomerListResponse,
} from "../../../utils/customer";
import CustomerStatusChip from "./CustomerStatusChip";
import { fmtRp } from "../../../utils/customer";
import { useAuthStore } from "../../../store/auth.store";

interface Props {
  data?: CustomerListResponse;
  loading?: boolean;
  page: number;
  onPageChange: (p: number) => void;
  onDelete?: (row: CustomerItem) => void;
  manageAccess?: boolean;
}

function resolveLayanan(row: CustomerItem): CustomerLayanan[] {
  if (row.layanan?.length) return row.layanan;
  if (row.jenis === "TUTON" || row.jenis === "KARIL") return [row.jenis];
  return [];
}

function LayananPills({ row }: { row: CustomerItem }) {
  const layanan = resolveLayanan(row);
  const colorClass: Record<CustomerLayanan, string> = {
    TUTON: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    KARIL: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
    METODE_PENELITIAN:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  if (layanan.length === 0) return <span className="text-sm text-foreground-400">—</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {layanan.map((item) => (
        <Chip
          key={item}
          size="sm"
          variant="flat"
          className={`border px-2 font-semibold ${colorClass[item]}`}
        >
          {CUSTOMER_LAYANAN_LABEL[item]}
        </Chip>
      ))}
    </div>
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
  const pagination = data?.pagination;

  const isOwner = useAuthStore((s) => s.role === "OWNER");
  const hasBillingPermission = useAuthStore((s) => s.canViewCustomerBilling);
  const canManage = (manageAccess ?? isOwner) === true;

  const location = useLocation();

  const sorted = useMemo(() => {
    const arr = [...(data?.items ?? [])];
    arr.sort((a, b) =>
      (a.namaCustomer || "").localeCompare(b.namaCustomer || "", "id", {
        sensitivity: "base",
      })
    );
    return arr;
  }, [data?.items]);

  const canSeeBilling =
    canManage || hasBillingPermission || sorted.some((row) => row.billingVisible === true);

  const nomor = (idx: number) => {
    const limit = pagination?.limit ?? 5;
    const currPage = pagination?.page ?? page ?? 1;
    return limit * (currPage - 1) + (idx + 1);
  };

  const classNames = {
    table: canManage || canSeeBilling ? "min-w-[1050px]" : "min-w-[760px]",
    th: "h-12 bg-default-50 px-4 text-[11px] font-bold uppercase tracking-wider text-foreground-500",
    td: "border-b border-default-100 px-4 py-3.5 align-middle text-foreground",
    tr: "last:[&>td]:border-b-0 data-[hover=true]:bg-primary/[0.035]",
  } as const;

  const numberBadge =
    "inline-flex h-8 w-8 items-center justify-center rounded-xl text-[12px] font-bold " +
    "bg-primary/10 text-primary";

  const TagihanCell = ({
    total = 0,
    bayar = 0,
  }: {
    total?: number;
    bayar?: number;
  }) => {
    const sisa = Math.max(total - bayar, 0);
    return (
      <div className="min-w-[190px]">
        <p className="font-bold text-foreground">{fmtRp(total)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-foreground-400">Dibayar {fmtRp(bayar)}</span>
          <span className={`rounded-lg px-2 py-1 font-semibold ${sisa > 0 ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
            {sisa > 0 ? `Sisa ${fmtRp(sisa)}` : "Lunas"}
          </span>
        </div>
      </div>
    );
  };

  const NameCell = ({ row }: { row: CustomerItem }) => {
    const noMK = (row.tutonCourseCount ?? 0) === 0;
    const shouldRed = noMK && resolveLayanan(row).includes("TUTON");

    return (
      <Link
        to={{ pathname: `/customers/${row.id}`, search: location.search }}
        className={
          shouldRed
            ? "font-semibold text-danger-600 transition hover:text-danger-500"
            : "font-semibold text-foreground transition hover:text-primary"
        }
      >
        {row.namaCustomer}
      </Link>
    );
  };

  const TableManage = (
    <Table
      aria-label="Tabel Customer dan tagihan"
      removeWrapper
      classNames={classNames}
    >
      <TableHeader>
        <TableColumn className="w-[64px] text-center">No.</TableColumn>
        <TableColumn className="min-w-[210px]">Customer</TableColumn>
        <TableColumn className="min-w-[190px]">Jurusan</TableColumn>
        <TableColumn>Layanan</TableColumn>
        <TableColumn className="min-w-[220px]">Tagihan</TableColumn>
        <TableColumn className="min-w-[120px]">Status</TableColumn>
        <TableColumn className="min-w-[150px] text-right">Tindakan</TableColumn>
      </TableHeader>

      <TableBody
        isLoading={loading}
        emptyContent={
          <div className="py-8 text-center text-foreground-500">
            Belum ada data
          </div>
        }
      >
        {sorted.map((row, idx) => (
          <TableRow key={row.id}>
            <TableCell className="text-center">
              <span className={numberBadge}>{nomor(idx)}</span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="truncate"><NameCell row={row} /></div>
                  <span className="mt-1 block font-mono text-xs text-foreground-400">{row.nim}</span>
                </div>
              </div>
            </TableCell>
            <TableCell><div className="line-clamp-2 max-w-[230px] text-sm leading-5 text-foreground-600" title={row.jurusan ?? "-"}>{row.jurusan ?? "-"}</div></TableCell>
            <TableCell>
              <LayananPills row={row} />
            </TableCell>
            <TableCell>
              <TagihanCell total={row.totalBayar} bayar={row.sudahBayar} />
            </TableCell>
            <TableCell>
              <CustomerStatusChip row={row} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Tooltip content="Lihat detail">
                  <Button
                    as={Link}
                    to={{
                      pathname: `/customers/${row.id}`,
                      search: location.search,
                    }}
                    size="sm"
                    color="primary"
                    variant="flat"
                    endContent={<ArrowRight className="h-3.5 w-3.5" />}
                    className="min-h-9 rounded-xl font-semibold"
                  >
                    Detail
                  </Button>
                </Tooltip>
                {canManage && (
                  <Tooltip content="Hapus">
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => onDelete?.(row)}
                      isIconOnly
                      aria-label={`Hapus ${row.namaCustomer}`}
                      className="min-h-9 min-w-9 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const TableReadonly = (
    <Table
      aria-label="Tabel Customer (Read-only)"
      removeWrapper
      classNames={classNames}
    >
      <TableHeader>
        <TableColumn className="w-[64px] text-center">No.</TableColumn>
        <TableColumn className="min-w-[210px]">Customer</TableColumn>
        <TableColumn className="min-w-[190px]">Jurusan</TableColumn>
        <TableColumn>Layanan</TableColumn>
        <TableColumn className="min-w-[130px] text-right">Tindakan</TableColumn>
      </TableHeader>

      <TableBody
        isLoading={loading}
        emptyContent={
          <div className="py-8 text-center text-foreground-500">
            Belum ada data
          </div>
        }
      >
        {sorted.map((row, idx) => (
          <TableRow key={row.id}>
            <TableCell className="text-center">
              <span className={numberBadge}>{nomor(idx)}</span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="truncate"><NameCell row={row} /></div>
                  <span className="mt-1 block font-mono text-xs text-foreground-400">{row.nim}</span>
                </div>
              </div>
            </TableCell>
            <TableCell><div className="line-clamp-2 max-w-[230px] text-sm leading-5 text-foreground-600" title={row.jurusan ?? "-"}>{row.jurusan ?? "-"}</div></TableCell>
            <TableCell>
              <LayananPills row={row} />
            </TableCell>
            <TableCell className="text-right">
              <Tooltip content="Lihat detail">
                <Button
                  as={Link}
                  to={{
                    pathname: `/customers/${row.id}`,
                    search: location.search,
                  }}
                  size="sm"
                  color="primary"
                  variant="flat"
                  endContent={<ArrowRight className="h-3.5 w-3.5" />}
                  className="min-h-9 rounded-xl font-semibold"
                >
                  Detail
                </Button>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-default-200 bg-default-50/60 px-4 py-12 text-center text-sm text-foreground-500">
            Memuat customer…
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-default-300 bg-default-50/60 px-4 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-default-100 text-foreground-400"><UsersRound className="h-6 w-6" /></span>
            <p className="mt-3 font-semibold text-foreground">Belum ada customer</p>
            <p className="mt-1 text-sm text-foreground-500">Customer yang sesuai dengan filter akan tampil di sini.</p>
          </div>
        ) : (
          sorted.map((row, idx) => (
            <article
              key={row.id}
              className="relative overflow-hidden rounded-2xl border border-default-200 bg-content1 p-4 shadow-[0_8px_24px_rgba(15,23,42,.05)]"
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 to-teal-500" />
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-foreground">
                        <NameCell row={row} />
                      </h3>
                      <p className="mt-1 break-all font-mono text-xs text-foreground-500">
                        {row.nim}
                      </p>
                    </div>
                    <Chip size="sm" variant="flat">#{nomor(idx)}</Chip>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground-600">
                    {row.jurusan ?? "Jurusan belum diisi"}
                  </p>
                </div>
              </div>

              {canSeeBilling && (
                <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-default-50 p-3 min-[380px]:grid-cols-2 dark:bg-default-100/50">
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-foreground-400">
                      Tagihan
                    </p>
                    <TagihanCell total={row.totalBayar} bayar={row.sudahBayar} />
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-foreground-400">
                      Status
                    </p>
                    <CustomerStatusChip row={row} />
                  </div>
                </div>
              )}

              <div className="mt-3"><LayananPills row={row} /></div>

              <div className="mt-4 flex gap-2">
                <Button
                  as={Link}
                  to={{ pathname: `/customers/${row.id}`, search: location.search }}
                  color="primary"
                  variant="flat"
                  endContent={<ArrowRight className="h-4 w-4" />}
                  className="min-h-11 flex-1 rounded-xl font-semibold"
                >
                  Lihat Detail
                </Button>
                {canManage && (
                  <Button
                    color="danger"
                    variant="flat"
                    onPress={() => onDelete?.(row)}
                    isIconOnly
                    aria-label={`Hapus ${row.namaCustomer}`}
                    className="min-h-11 min-w-11 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-default-200/80 md:block">
        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          {canSeeBilling ? TableManage : TableReadonly}
        </div>
      </div>

      {pagination && (
        <div className="flex overflow-x-auto border-t border-default-200 py-3">
          <div className="mx-auto min-w-max px-2">
          <Pagination
            showControls
            total={pagination.totalPages}
            page={page}
            onChange={onPageChange}
            size="sm"
            color="primary"
            variant="bordered"
          />
          </div>
        </div>
      )}
    </div>
  );
}
