import {
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { ChevronRight, Clock3, Eye, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";

import type { RangeKey, RowItem } from "./userlist.types";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function pickTotals(user: RowItem, range: RangeKey) {
  if (range === "TODAY") return { jam: user.totalJamHariIni, gaji: user.totalGajiHariIni };
  if (range === "WEEK") return { jam: user.totalJamMingguIni, gaji: user.totalGajiMingguIni };
  if (range === "MONTH") return { jam: user.totalJamBulanIni, gaji: user.totalGajiBulanIni };
  return { jam: user.totalJamSemua, gaji: user.totalGajiSemua };
}

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "US";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function WorkStatus({ status }: { status: RowItem["statusNow"] }) {
  const meta =
    status === "AKTIF"
      ? { label: "Sedang bekerja", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", dot: "bg-emerald-500 animate-pulse" }
      : status === "JEDA"
        ? { label: "Sedang jeda", classes: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300", dot: "bg-amber-500" }
        : status === "SELESAI"
          ? { label: "Selesai", classes: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300", dot: "bg-violet-500" }
          : { label: "Tidak bekerja", classes: "bg-default-100 text-foreground-500", dot: "bg-default-400" };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function UserAvatar({ user }: { user: RowItem }) {
  return (
    <Avatar
      src={user.avatarUrl || undefined}
      name={initials(user.namaLengkap || user.username)}
      className="h-11 w-11 shrink-0 bg-primary/10 font-bold text-primary ring-1 ring-default-200"
      classNames={{ img: "object-cover" }}
    />
  );
}

export default function UserListTable({ rows, range }: { rows: RowItem[]; range: RangeKey }) {
  if (!rows.length) {
    return (
      <div className="grid min-h-64 place-items-center px-5 py-14 text-center">
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-default-100 text-foreground-400">
            <UsersRound className="h-5 w-5" />
          </span>
          <p className="mt-4 font-bold text-foreground">Pengguna tidak ditemukan</p>
          <p className="mt-1 text-sm text-foreground-500">Ubah kata pencarian untuk menampilkan data lain.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 p-4 md:hidden" aria-label="Daftar pengguna">
        {rows.map((user) => {
          const totals = pickTotals(user, range);
          const href = `/users/${encodeURIComponent(user.username)}`;
          return (
            <article key={user.username} className="relative overflow-hidden rounded-2xl border border-default-200/80 bg-content1 p-4 shadow-sm">
              <span className={`absolute inset-y-0 left-0 w-1 ${user.accountIsActive === false ? "bg-slate-300" : "bg-gradient-to-b from-primary to-cyan-400"}`} />
              <div className="flex items-start gap-3 pl-1">
                <UserAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold text-foreground">{user.namaLengkap || user.username}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${user.accountIsActive === false ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
                      {user.accountIsActive === false ? "Akun nonaktif" : "Akun aktif"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-foreground-400">@{user.username} · {user.role || "USER"}</p>
                  <div className="mt-2"><WorkStatus status={user.statusNow} /></div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 divide-x divide-default-200/70 rounded-xl bg-default-50/70 px-1 py-3">
                <div className="px-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-400"><Clock3 className="h-3.5 w-3.5" /> Total jam</p>
                  <p className="mt-1 font-extrabold text-foreground">{Number(totals.jam || 0).toFixed(1)} <span className="text-xs font-medium text-foreground-400">jam</span></p>
                </div>
                <div className="px-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-400"><WalletCards className="h-3.5 w-3.5" /> Payroll</p>
                  <p className="mt-1 truncate font-extrabold text-foreground">{rupiah.format(Number(totals.gaji) || 0)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-xs text-foreground-500">
                  {user.canViewCustomerBilling ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {user.canViewCustomerBilling ? "Akses tagihan" : "Akses standar"}
                </span>
                <Button as={Link} to={href} size="sm" color="primary" variant="flat" className="rounded-xl font-semibold" endContent={<ChevronRight className="h-4 w-4" />}>
                  Detail
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden md:block">
        <Table
          aria-label="Daftar pengguna"
          removeWrapper
          classNames={{
            table: "min-w-[900px]",
            thead: "[&>tr]:first:shadow-none",
            th: "h-12 bg-default-50/80 px-5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-400",
            td: "border-t border-default-200/65 px-5 py-4 align-middle",
            tr: "transition-colors hover:bg-default-50/55",
          }}
        >
          <TableHeader>
            <TableColumn>Pengguna</TableColumn>
            <TableColumn>Status kerja</TableColumn>
            <TableColumn>Akses</TableColumn>
            <TableColumn className="text-right">Total jam</TableColumn>
            <TableColumn className="text-right">Payroll</TableColumn>
            <TableColumn className="text-right">Aksi</TableColumn>
          </TableHeader>
          <TableBody>
            {rows.map((user) => {
              const totals = pickTotals(user, range);
              const href = `/users/${encodeURIComponent(user.username)}`;
              return (
                <TableRow key={user.username}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to={href} className="max-w-56 truncate font-bold text-foreground transition hover:text-primary">
                            {user.namaLengkap || user.username}
                          </Link>
                          <span className={`h-2 w-2 shrink-0 rounded-full ${user.accountIsActive === false ? "bg-rose-400" : "bg-emerald-500"}`} title={user.accountIsActive === false ? "Akun nonaktif" : "Akun aktif"} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-foreground-400">@{user.username} · {user.role || "USER"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><WorkStatus status={user.statusNow} /></TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-500">
                      {user.canViewCustomerBilling ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {user.canViewCustomerBilling ? "Kelola tagihan" : "Standar"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-foreground">
                    {Number(totals.jam || 0).toFixed(1)} <span className="text-xs font-medium text-foreground-400">jam</span>
                  </TableCell>
                  <TableCell className="text-right font-extrabold tabular-nums text-foreground">{rupiah.format(Number(totals.gaji) || 0)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button as={Link} to={href} size="sm" variant="flat" color="primary" className="rounded-xl font-semibold" endContent={<ChevronRight className="h-4 w-4" />}>
                        Detail
                      </Button>
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
