// src/pages/users/UsersList.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Input,
  Chip,
  Tooltip,
} from "@heroui/react";
import { useApi } from "../../hooks/useApi";
import { listUsers, type UserListItem } from "../../services/users.service";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { UserPlus, Search, ChevronRight, Users } from "lucide-react";

export default function UsersList() {
  const api = useApi();
  const { role } = useAuthStore();
  const [items, setItems] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ── Load data
  useEffect(() => {
    (async () => {
      try {
        const rows = await listUsers(api);
        setItems(rows);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Gagal memuat data";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  // ── Filter & summary
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) =>
      [u.username, u.namaLengkap, u.role].join(" ").toLowerCase().includes(q)
    );
  }, [items, search]);

  const owners = useMemo(() => items.filter((u) => u.role === "OWNER").length, [items]);
  const users = useMemo(() => items.filter((u) => u.role === "USER").length, [items]);

  // ── Formatters
  const fmtHours = (n: number) => (Math.round(n * 10) / 10).toFixed(1); // 1 angka desimal
  const fmtRupiah = (n: number) => `Rp. ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n)}`;

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Users
            </h1>
          </div>
          <p className="text-sm text-foreground-500">Daftar seluruh pengguna sistem</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-sm text-foreground-500">
            Total: <span className="font-semibold">{filtered.length}</span> user
          </div>
          {role === "OWNER" && (
            <Button
              as={Link}
              to="/users/register"
              color="primary"
              className="shadow-md"
              startContent={<UserPlus className="h-4 w-4" />}
            >
              Register User
            </Button>
          )}
        </div>
      </div>

      {/* Search + Stats mini */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Cari user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
          startContent={<Search className="h-4 w-4" />}
          radius="lg"
          variant="bordered"
        />
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" color="primary" className="shadow-sm">
            OWNER: {owners}
          </Chip>
          <Chip size="sm" variant="flat" color="secondary" className="shadow-sm">
            USER: {users}
          </Chip>
        </div>
      </div>

      {/* Table Card */}
      <Card shadow="md" className="border border-default-100">
        <CardBody className="p-0">
          {loading ? (
            <div className="py-14 grid place-items-center">
              <Spinner label="Memuat users..." color="primary" />
            </div>
          ) : err ? (
            <div className="py-10 text-center">
              <p className="text-danger font-medium">Gagal memuat data</p>
              <p className="text-foreground-500 text-sm mt-1">{err}</p>
            </div>
          ) : (
            <Table
              aria-label="Daftar Users"
              removeWrapper
              isStriped
              classNames={{
                table: "rounded-2xl overflow-hidden",
                th: "bg-default-100 text-foreground-600 font-semibold",
                td: "align-middle",
                tr: "hover:bg-default-50 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn>Username</TableColumn>
                <TableColumn>Nama</TableColumn>
                <TableColumn>Role</TableColumn>
                <TableColumn className="text-right">Total Jam</TableColumn>
                <TableColumn className="text-right">Total Gaji</TableColumn>
                <TableColumn className="text-right">Aksi</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Belum ada user terdaftar">
                {filtered.map((u) => (
                  <TableRow key={u.username}>
                    <TableCell className="font-mono text-sm">{u.username}</TableCell>
                    <TableCell className="font-medium">{u.namaLengkap}</TableCell>
                    <TableCell>
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                          u.role === "OWNER"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-violet-100 text-violet-700",
                        ].join(" ")}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtHours(u.totalJamKerja)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fmtRupiah(u.totalGaji)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Tooltip content="Lihat detail">
                          <Button
                            as={Link}
                            to={`/users/${encodeURIComponent(u.username)}`}
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
