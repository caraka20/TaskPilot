// client/src/pages/users/UsersList.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Button, Card, CardBody, Spinner, Table, TableBody, TableCell,
  TableColumn, TableHeader, TableRow, Input, Chip, Tooltip, Tabs, Tab, Avatar, Badge
} from "@heroui/react";
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { useAuthStore } from "../../store/auth.store";
import { getOwnerSummary, type OwnerUserSummary } from "../../services/jamKerja.service";
import {
  UserPlus, Search, ChevronRight, Users,
  Sun, CalendarRange, CalendarDays, Infinity as InfinityIcon, Activity
} from "lucide-react";

// ===== Types lokal (untuk tabel) =====
type RowItem = {
  username: string;
  statusNow: OwnerUserSummary["status"];
  isActive: boolean;
  totalJamHariIni: number;   totalGajiHariIni: number;
  totalJamMingguIni: number; totalGajiMingguIni: number;
  totalJamBulanIni: number;  totalGajiBulanIni: number;
  totalJamSemua: number;     totalGajiSemua: number;
};

type RangeKey = "TODAY" | "WEEK" | "MONTH" | "ALL";
const RANGE_LABEL: Record<RangeKey, string> = {
  TODAY: "Hari ini",
  WEEK: "Minggu ini",
  MONTH: "Bulan ini",
  ALL: "Semua",
};

// ===== Komponen =====
export default function UsersList() {
  const api = useApi();
  const { role } = useAuthStore();

  const [rows, setRows] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RangeKey>("TODAY");

  // header counts dari API
  const [countAktif, setCountAktif] = useState(0);
  const [countJeda, setCountJeda] = useState(0);

  // ---- Fetch summary OWNER
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const summary = await getOwnerSummary(api);

        // header counts
        setCountAktif(Number(summary?.counts?.aktif ?? 0));
        setCountJeda(Number(summary?.counts?.jeda ?? 0));

        // map users → rows, koersi angka biar aman
        const mapped: RowItem[] = (summary?.users ?? []).map((u) => ({
          username: u.username,
          statusNow: u.status,
          isActive: u.status === "AKTIF",

          totalJamHariIni: Number(u?.totals?.hari?.totalJam ?? 0),
          totalGajiHariIni: Number(u?.totals?.hari?.totalGaji ?? 0),

          totalJamMingguIni: Number(u?.totals?.minggu?.totalJam ?? 0),
          totalGajiMingguIni: Number(u?.totals?.minggu?.totalGaji ?? 0),

          totalJamBulanIni: Number(u?.totals?.bulan?.totalJam ?? 0),
          totalGajiBulanIni: Number(u?.totals?.bulan?.totalGaji ?? 0),

          totalJamSemua: Number(u?.totals?.semua?.totalJam ?? 0),
          totalGajiSemua: Number(u?.totals?.semua?.totalGaji ?? 0),
        }));

        setRows(mapped);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  // ---- Filter pencarian
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) => u.username.toLowerCase().includes(q));
  }, [rows, search]);

  // ---- Helpers & formatters (defensif)
  const toNum = (x: any) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  };
  const fmtHours = (x: any) => (Math.round(toNum(x) * 10) / 10).toFixed(1);
  const fmtRupiah = (x: any) =>
    `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(toNum(x))}`;

  const pickTotals = (u: RowItem) => {
    switch (range) {
      case "TODAY": return { jam: u.totalJamHariIni,   gaji: u.totalGajiHariIni };
      case "WEEK":  return { jam: u.totalJamMingguIni, gaji: u.totalGajiMingguIni };
      case "MONTH": return { jam: u.totalJamBulanIni,  gaji: u.totalGajiBulanIni };
      default:      return { jam: u.totalJamSemua,     gaji: u.totalGajiSemua };
    }
  };

  const iconFor = (k: RangeKey) =>
    k === "TODAY" ? <Sun className="h-4 w-4" /> :
    k === "WEEK"  ? <CalendarRange className="h-4 w-4" /> :
    k === "MONTH" ? <CalendarDays className="h-4 w-4" /> :
                    <InfinityIcon className="h-4 w-4" />;
console.log(rows);

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">
              Users
            </h1>
          </div>
          <p className="text-sm text-foreground-500">Ringkasan jam kerja & gaji per pengguna</p>
        </div>

        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" color="success" className="shadow-sm">
            <span className="inline-flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> Aktif:</span>&nbsp;
            <span className="font-semibold">{countAktif}</span>
          </Chip>
          <Chip size="sm" variant="flat" color="warning" className="shadow-sm">
            Jeda: <span className="font-semibold">&nbsp;{countJeda}</span>
          </Chip>

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

      {/* Search + Range */}
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
          <Tabs
            aria-label="Rentang waktu"
            selectedKey={range}
            onSelectionChange={(k) => setRange(k as RangeKey)}
            size="sm"
            radius="lg"
            color="primary"
            className="w-full sm:w-auto"
          >
            <Tab key="TODAY"  title={<div className="flex items-center gap-2">{iconFor("TODAY")}<span>Hari ini</span></div>} />
            <Tab key="WEEK"   title={<div className="flex items-center gap-2">{iconFor("WEEK")}<span>Minggu ini</span></div>} />
            <Tab key="MONTH"  title={<div className="flex items-center gap-2">{iconFor("MONTH")}<span>Bulan ini</span></div>} />
            <Tab key="ALL"    title={<div className="flex items-center gap-2">{iconFor("ALL")}<span>Semua</span></div>} />
          </Tabs>
          <Chip size="sm" color="primary" variant="flat" className="shadow-sm">
            {RANGE_LABEL[range]}
          </Chip>
        </div>
      </div>

      {/* Table */}
      <Card shadow="md" className="border border-default-100">
        <CardBody className="p-0">
          {loading ? (
            <div className="py-14 grid place-items-center">
              <Spinner label="Memuat ringkasan..." color="primary" />
            </div>
          ) : err ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-danger font-semibold">Gagal memuat data</p>
              <p className="text-foreground-500 text-sm">{err}</p>
              <Button onPress={() => location.reload()} variant="flat" size="sm">Coba lagi</Button>
            </div>
          ) : (
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
              <TableBody emptyContent={<div className="py-8 text-center text-foreground-500">Belum ada data</div>}>
                {filtered.map((u) => {
                  const totals = pickTotals(u);
                  const href = `/users/${encodeURIComponent(u.username)}`;
                  const initials = (u.username?.slice(0, 2) || "US").toUpperCase();

                  return (
                    <TableRow key={u.username}>
                      {/* Username → link ke detail */}
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-3">
                          <Avatar className="shadow-sm" name={initials} color="primary" />
                          <Link to={href} className="text-primary font-semibold hover:opacity-80 underline underline-offset-2">
                            {u.username}
                          </Link>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {u.statusNow === "AKTIF" ? (
                          <Badge content="" color="success" shape="circle" placement="bottom-right" className="animate-pulse">
                            <Chip size="sm" color="success" variant="flat">Aktif</Chip>
                          </Badge>
                        ) : u.statusNow === "JEDA" ? (
                          <Chip size="sm" color="warning" variant="flat">Jeda</Chip>
                        ) : u.statusNow === "SELESAI" ? (
                          <Chip size="sm" color="secondary" variant="flat">Selesai</Chip>
                        ) : (
                          <Chip size="sm" color="default" variant="flat">Off</Chip>
                        )}
                      </TableCell>

                      {/* Totals */}
                      <TableCell className="text-right tabular-nums">
                        {fmtHours(totals.jam)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
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
          )}
        </CardBody>
      </Card>
    </div>
  );
}
