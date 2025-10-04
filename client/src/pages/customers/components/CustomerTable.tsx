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
  manageAccess?: boolean;
}

/* === Chip warna khusus per jenis === */
function JenisPill({ jenis }: { jenis?: string }) {
  const j = (jenis ?? "").toUpperCase();

  let gradientClass = "from-default-200 to-default-300 text-foreground-600";
  if (j === "TUTON")
    gradientClass =
      "from-sky-400 to-sky-600 text-white dark:from-sky-500 dark:to-sky-700";
  else if (j === "KARIL")
    gradientClass =
      "from-fuchsia-400 to-violet-600 text-white dark:from-fuchsia-500 dark:to-violet-700";
  else if (j === "TK")
    gradientClass =
      "from-emerald-400 to-teal-600 text-white dark:from-emerald-500 dark:to-teal-700";

  return (
    <Chip
      size="sm"
      variant="flat"
      className={`bg-gradient-to-r ${gradientClass} px-3 py-0.5 font-semibold shadow-sm`}
    >
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
  const canManage = (manageAccess ?? isOwner) === true;

  const location = useLocation();

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
    const limit = pagination?.limit ?? 5;
    const currPage = pagination?.page ?? page ?? 1;
    return limit * (currPage - 1) + (idx + 1);
  };

  const classNames = {
    table: "rounded-2xl overflow-hidden",
    th: "bg-gradient-to-r from-default-100 to-default-50 text-foreground-600 font-semibold",
    td: "align-middle",
    tr: "hover:bg-default-50 transition-colors",
  } as const;

  const numberBadge =
    "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold " +
    "bg-default-100 text-foreground-600 dark:bg-default-200 dark:text-foreground";

  const TagihanCell = ({
    total = 0,
    bayar = 0,
  }: {
    total?: number;
    bayar?: number;
  }) => {
    const sisa = Math.max(total - bayar, 0);
    return (
      <div className="flex flex-col leading-5 text-[13px]">
        <span className="text-foreground-600">Total: {fmtRp(total)}</span>
        <span className="text-foreground-600">Bayar: {fmtRp(bayar)}</span>
        <span
          className={`font-semibold ${
            sisa > 0 ? "text-danger" : "text-success"
          }`}
        >
          Sisa: {fmtRp(sisa)}
        </span>
      </div>
    );
  };

  const NameCell = ({ row }: { row: CustomerItem }) => {
    const jenis = (row.jenis ?? "").toUpperCase();
    const noMK = (row.tutonCourseCount ?? 0) === 0;

    // 🔴 hanya tuton & tk yg dikasih merah
    const shouldRed =
      noMK && (jenis === "TUTON" || jenis === "TK");

    return (
      <Link
        to={{ pathname: `/customers/${row.id}`, search: location.search }}
        className={
          shouldRed
            ? "text-danger-600 hover:opacity-80 underline underline-offset-2 font-semibold"
            : "text-primary hover:opacity-80 underline underline-offset-2"
        }
      >
        {row.namaCustomer}
      </Link>
    );
  };

  const TableManage = (
    <Table
      aria-label="Tabel Customer (Manage)"
      removeWrapper
      isStriped
      classNames={classNames}
    >
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
            <TableCell>
              <span className={numberBadge}>{nomor(idx)}</span>
            </TableCell>
            <TableCell className="font-medium">
              <NameCell row={row} />
            </TableCell>
            <TableCell className="font-mono text-[12.5px]">{row.nim}</TableCell>
            <TableCell>
              <div
                className="truncate max-w-[260px]"
                title={row.jurusan ?? "-"}
              >
                {row.jurusan ?? "-"}
              </div>
            </TableCell>
            <TableCell>
              <JenisPill jenis={row.jenis} />
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
                    variant="flat"
                    className="rounded-xl"
                  >
                    Detail
                  </Button>
                </Tooltip>
                <Tooltip content="Hapus">
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={() => onDelete?.(row)}
                    className="rounded-xl"
                  >
                    Hapus
                  </Button>
                </Tooltip>
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
      isStriped
      classNames={classNames}
    >
      <TableHeader>
        <TableColumn className="w-[64px]">No</TableColumn>
        <TableColumn>Nama</TableColumn>
        <TableColumn>NIM</TableColumn>
        <TableColumn>Jurusan</TableColumn>
        <TableColumn>Jenis</TableColumn>
        <TableColumn className="text-right">Aksi</TableColumn>
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
            <TableCell>
              <span className={numberBadge}>{nomor(idx)}</span>
            </TableCell>
            <TableCell className="font-medium">
              <NameCell row={row} />
            </TableCell>
            <TableCell className="font-mono text-[12.5px]">{row.nim}</TableCell>
            <TableCell>
              <div
                className="truncate max-w-[260px]"
                title={row.jurusan ?? "-"}
              >
                {row.jurusan ?? "-"}
              </div>
            </TableCell>
            <TableCell>
              <JenisPill jenis={row.jenis} />
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
                  variant="flat"
                  className="rounded-xl"
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
      {canManage ? TableManage : TableReadonly}

      {pagination && (
        <div className="flex justify-center py-3 border-t border-default-200">
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
      )}
    </div>
  );
}
