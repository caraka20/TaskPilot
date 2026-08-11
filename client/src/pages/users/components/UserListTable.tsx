import {
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@heroui/react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock3, Users, Wallet } from "lucide-react";
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
      case "TODAY":
        return { jam: u.totalJamHariIni, gaji: u.totalGajiHariIni };
      case "WEEK":
        return { jam: u.totalJamMingguIni, gaji: u.totalGajiMingguIni };
      case "MONTH":
        return { jam: u.totalJamBulanIni, gaji: u.totalGajiBulanIni };
      default:
        return { jam: u.totalJamSemua, gaji: u.totalGajiSemua };
    }
  };

  const fmtHours = (value: unknown) =>
    (Math.round((Number(value) || 0) * 10) / 10).toFixed(1);
  const fmtRupiah = (value: unknown) =>
    `Rp ${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)}`;

  const statusPill = (status: RowItem["statusNow"]) => {
    if (status === "AKTIF") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-100/15 dark:text-success-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          Aktif
        </span>
      );
    }

    if (status === "JEDA") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-100 px-2.5 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-100/15 dark:text-warning-400">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Jeda
        </span>
      );
    }

    if (status === "SELESAI") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-semibold text-secondary-700 dark:bg-secondary-100/15 dark:text-secondary-400">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          Selesai
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-default-100 px-2.5 py-1 text-xs font-semibold text-foreground-600">
        <span className="h-1.5 w-1.5 rounded-full bg-default-400" />
        Off
      </span>
    );
  };

  return (
    <>
      <div className="space-y-3 p-3 md:hidden" aria-label="Daftar pengguna">
        {rows.length === 0 ? (
          <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-default-200 bg-default-50/60 px-4 py-8 text-center">
            <div>
              <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-default-100 text-foreground-500">
                <Users className="h-5 w-5" />
              </div>
              <p className="font-semibold text-foreground-700">Belum ada data</p>
              <p className="mt-1 text-sm text-foreground-500">
                Pengguna yang tersedia akan tampil di sini.
              </p>
            </div>
          </div>
        ) : (
          rows.map((user) => {
            const totals = pickTotals(user);
            const href = `/users/${encodeURIComponent(user.username)}`;
            const initials = (user.username?.slice(0, 2) || "US").toUpperCase();

            return (
              <article
                key={user.username}
                className="rounded-2xl border border-default-200/80 bg-content1 p-4 shadow-sm transition-colors active:bg-default-50"
                aria-label={`Ringkasan ${user.username}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={initials}
                      color="primary"
                      className="h-11 w-11 shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <Link
                        to={href}
                        className="block truncate font-mono text-sm font-bold text-primary outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {user.username}
                      </Link>
                      <div className="mt-1.5">{statusPill(user.statusNow)}</div>
                    </div>
                  </div>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-default-50 p-3 dark:bg-default-100/40">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-500">
                      <Clock3 className="h-3.5 w-3.5" />
                      Total jam
                    </div>
                    <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                      {fmtHours(totals.jam)}{" "}
                      <span className="text-xs font-medium text-foreground-500">
                        jam
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-default-50 p-3 dark:bg-default-100/40">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-500">
                      <Wallet className="h-3.5 w-3.5" />
                      Total gaji
                    </div>
                    <p className="mt-1 truncate text-sm font-bold tabular-nums text-foreground">
                      {fmtRupiah(totals.gaji)}
                    </p>
                  </div>
                </div>

                <Button
                  as={Link}
                  to={href}
                  variant="flat"
                  color="primary"
                  className="mt-3 h-11 w-full rounded-xl font-semibold"
                  endContent={<ChevronRight className="h-4 w-4" />}
                >
                  Lihat detail
                </Button>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden md:block">
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

          <TableBody
            emptyContent={
              <div className="py-8 text-center text-foreground-500">
                Belum ada data
              </div>
            }
          >
            {rows.map((u) => {
              const totals = pickTotals(u);
              const href = `/users/${encodeURIComponent(u.username)}`;
              const initials = (u.username?.slice(0, 2) || "US").toUpperCase();

              return (
                <TableRow key={u.username}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="shadow-sm"
                        name={initials}
                        color="primary"
                      />
                      <Link
                        to={href}
                        className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
                      >
                        {u.username}
                      </Link>
                    </div>
                  </TableCell>

                  <TableCell>{statusPill(u.statusNow)}</TableCell>

                  <TableCell className="text-right tabular-nums">
                    {fmtHours(totals.jam)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
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
      </div>
    </>
  );
}
