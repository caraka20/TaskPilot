// client/src/pages/customers/components/CustomerDetailWithSidebar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Select, SelectItem, Spinner, Tooltip,
  Card, Button, ScrollShadow, Divider, Chip
} from "@heroui/react";
import { ChevronLeft, Filter, Menu } from "lucide-react";

import CustomerDetail from "../CustomerDetail";
import { getCustomers } from "../../../services/customer.service";
import type { CustomerItem, CustomerListResponse, CustomerJenis } from "../../../utils/customer";

type JenisFilter = "ALL" | CustomerJenis;

const SIDEBAR_KEY = "customers:sidebarCollapsed";
const CHUNK_DEFAULT = 20; // default kelipatan

function normalizeJenisFromSearch(jenisRaw?: string | null): JenisFilter {
  if (!jenisRaw) return "ALL";
  const upper = (jenisRaw || "").toUpperCase();
  if (upper.includes("TUTON")) return "TUTON";
  if (upper.includes("KARIL")) return "KARIL";
  if (upper === "TK") return "TK";
  return "ALL";
}

function intFrom(q: URLSearchParams, key: string, fallback: number) {
  const v = Number(q.get(key));
  return Number.isFinite(v) && v > 0 ? Math.trunc(v) : fallback;
}

export default function CustomerDetailWithSidebar() {
  const { id: activeId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ===== Persisted sidebar state
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(SIDEBAR_KEY) === "1");
  useEffect(() => { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); }, [collapsed]);

  // ===== URL → initial filters
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>(normalizeJenisFromSearch(searchParams.get("jenis")));
  // chunk size ikut URL ?limit (kalau ada); default 20
  const [chunk, setChunk] = useState<number>(() => intFrom(searchParams, "limit", CHUNK_DEFAULT));
  // rangeKey: "ALL" | "start-end"
  const [rangeKey, setRangeKey] = useState<string>("ALL");

  // ===== Data
  const [all, setAll] = useState<CustomerItem[]>([]);
  const [beTotal, setBeTotal] = useState<number>(0); // dari pagination.total BE
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // dipakai agar inisialisasi range dari URL hanya dilakukan sekali ketika total BE sudah diketahui
  const didApplyInitialRangeRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const first: CustomerListResponse = await getCustomers({ page: 1, limit: 100 });
        if (!mounted) return;

        const total = Number((first as any)?.pagination?.total ?? first.items?.length ?? 0);
        setBeTotal(Number.isFinite(total) && total >= 0 ? total : 0);

        const acc: CustomerItem[] = [...(first.items || [])];

        const totalPages =
          Number.isFinite((first as any)?.pagination?.totalPages) && (first as any)?.pagination?.totalPages > 0
            ? (first as any).pagination.totalPages
            : Math.max(1, Math.ceil(total / 100));

        for (let page = 2; page <= totalPages; page++) {
          const res = await getCustomers({ page, limit: 100 });
          if (!mounted) return;
          acc.push(...(res.items || []));
        }

        setAll(acc);
      } catch (e: any) {
        console.error(e);
        if (mounted) {
          setLoadError(e?.message || "Gagal memuat data");
          setAll([]);
          setBeTotal(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ===== Build range options dari total BE & chunk
  const rangeOptions = useMemo(() => {
    const total = beTotal > 0 ? beTotal : all.length;
    const size = Math.max(1, chunk || CHUNK_DEFAULT);
    const pages = Math.max(1, Math.ceil(total / size));

    const chunks: string[] = ["ALL"];
    for (let i = 0; i < pages; i++) {
      const start = i * size + 1;
      const end = Math.min(total, (i + 1) * size);
      chunks.push(`${start}-${end}`);
    }
    return chunks;
  }, [beTotal, all.length, chunk]);

  // ===== Setelah total BE tersedia → apply initial range dari URL (?page & ?limit)
  useEffect(() => {
    if (didApplyInitialRangeRef.current) return;
    if (beTotal <= 0) return;

    const urlLimit = intFrom(searchParams, "limit", chunk || CHUNK_DEFAULT);
    const size = Math.max(1, urlLimit);
    // kalau url limit ≠ state, sinkronkan
    if (size !== chunk) setChunk(size);

    const urlPage = intFrom(searchParams, "page", 1);
    const pages = Math.max(1, Math.ceil(beTotal / size));
    const safePage = Math.min(Math.max(1, urlPage), pages);

    const start = (safePage - 1) * size + 1;
    const end = Math.min(beTotal, safePage * size);
    const key = `${start}-${end}`;

    setRangeKey(key);

    // normalisasi URL kalau page/limit out-of-range
    const sp = new URLSearchParams(location.search);
    sp.set("page", String(safePage));
    sp.set("limit", String(size));
    setSearchParams(sp, { replace: true });

    didApplyInitialRangeRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beTotal]);

  // ===== Base filter: jenis + sort by nama
  const baseByJenis = useMemo(() => {
    const U = (s?: string) => (s || "").toUpperCase();
    const base = all.filter((c) => {
      const j = U(c.jenis);
      if (jenisFilter === "ALL") return true;
      if (jenisFilter === "TK") return j.includes("TK");
      if (jenisFilter === "TUTON") return j.includes("TUTON") || j.includes("TK");
      if (jenisFilter === "KARIL") return j.includes("KARIL") || j.includes("TK");
      return true;
    });
    return base
      .slice()
      .sort((a, b) =>
        (a.namaCustomer || "").localeCompare(b.namaCustomer || "", "id", { sensitivity: "base" })
      );
  }, [all, jenisFilter]);

  // nomor urut global
  const numberMap = useMemo(() => {
    const m = new Map<number | string, number>();
    baseByJenis.forEach((c, i) => m.set(c.id, i + 1));
    return m;
  }, [baseByJenis]);

  // apply range ke list final
  const filtered = useMemo(() => {
    if (rangeKey === "ALL") return baseByJenis;
    const [s, e] = rangeKey.split("-").map((n) => parseInt(n, 10));
    return baseByJenis.filter((c) => {
      const no = numberMap.get(c.id) || 0;
      return no >= s && no <= e;
    });
  }, [baseByJenis, numberMap, rangeKey]);

  // ===== Navigation helpers
  const linkTo = (cid: string | number, overrideJenis?: JenisFilter) => {
    const jenisParam = overrideJenis ?? jenisFilter;
    const sp = new URLSearchParams(location.search);
    if (jenisParam && jenisParam !== "ALL") sp.set("jenis", jenisParam);
    else sp.delete("jenis");
    return { pathname: `/customers/${cid}`, search: `?${sp.toString()}` };
  };

  const onPick = (c: CustomerItem) => {
    const autoJenis = normalizeJenisFromSearch(c.jenis);
    setJenisFilter(autoJenis);
    const sp = new URLSearchParams(location.search);
    if (autoJenis !== "ALL") sp.set("jenis", autoJenis); else sp.delete("jenis");
    setSearchParams(sp, { replace: true });
    navigate(linkTo(c.id, autoJenis));
  };

  const onChangeJenis = (val: JenisFilter) => {
    setJenisFilter(val);
    const sp = new URLSearchParams(location.search);
    if (val !== "ALL") sp.set("jenis", val); else sp.delete("jenis");
    setSearchParams(sp, { replace: true });
    // tidak mengubah page/limit; tetap
    const firstVisible = baseByJenis[0];
    if (firstVisible) navigate(linkTo(firstVisible.id, val));
  };

  const onChangeRange = (val: string) => {
    const v = val || "ALL";
    setRangeKey(v);

    const sp = new URLSearchParams(location.search);
    if (v === "ALL") {
      sp.delete("page");
      sp.delete("limit");
    } else {
      const [eStr] = v.split("-");
      const e = parseInt(eStr, 10);
      const size = Math.max(1, chunk || CHUNK_DEFAULT);
      const page = Math.max(1, Math.ceil(e / size));
      sp.set("page", String(page));
      sp.set("limit", String(size));
    }
    setSearchParams(sp, { replace: true });
  };

  // ===== Layout helpers
  const gridTemplate = collapsed ? "56px 1fr" : "minmax(300px,24%) minmax(0,76%)";
  const showTkBadgeFor = (jenis?: string) => {
    const j = (jenis || "").toUpperCase();
    return (jenisFilter === "TUTON" || jenisFilter === "KARIL") && j.includes("TK");
  };

  return (
    <div className="w-full px-2 md:px-4 py-3 md:py-5">
      <div
        className="grid gap-5 transition-[grid-template-columns] duration-300"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {/* === Sidebar (tinggi 1 layar; list scroll di dalam) === */}
        <aside className="self-start">
          <div className="sticky top-20 h-[calc(100vh-5.5rem)]">
            {collapsed ? (
              <Tooltip content="Buka daftar customer" placement="right">
                <Button
                  isIconOnly
                  aria-label="Buka sidebar"
                  radius="full"
                  variant="bordered"
                  className="h-12 w-12 shadow-md backdrop-blur supports-[backdrop-filter]:bg-white/70"
                  onPress={() => setCollapsed(false)}
                >
                  <Menu className="h-5 w-5 text-foreground-600" />
                </Button>
              </Tooltip>
            ) : (
              <div className="relative h-full">
                <div className="rounded-2xl p-[1px] h-full bg-gradient-to-b from-indigo-200/70 via-sky-200/60 to-emerald-200/70 dark:from-indigo-900/40 dark:via-sky-900/40 dark:to-emerald-900/40">
                  <Card
                    shadow="sm"
                    className="h-full rounded-[1rem] border border-default-200/60 backdrop-blur supports-[backdrop-filter]:bg-background/80
                               flex flex-col"
                  >
                    {/* ===== Header (3 baris) ===== */}
                    <div className="sticky top-0 z-10 border-b border-default-200/60 bg-background/70 backdrop-blur px-3 py-3 rounded-t-[0.95rem]">
                      {/* Baris 1: Icon + judul Filter */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          aria-label="Filter"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
                                     bg-gradient-to-br from-indigo-500/15 via-sky-500/15 to-emerald-500/15
                                     ring-1 ring-default-200"
                        >
                          <Filter className="h-4 w-4 text-foreground-600" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">Filter</span>
                      </div>

                      {/* Baris 2: Jenis */}
                      <div className="mb-2">
                        <div className="text-[11px] uppercase tracking-wide text-foreground-500 mb-1">Jenis</div>
                        <Select
                          aria-label="Filter jenis"
                          size="sm"
                          selectedKeys={[jenisFilter]}
                          onChange={(e) => onChangeJenis(((e.target.value as string) || "ALL") as JenisFilter)}
                          className="w-full"
                          radius="md"
                          variant="bordered"
                        >
                          <SelectItem key="ALL" textValue="Semua">Semua</SelectItem>
                          <SelectItem key="TUTON" textValue="TUTON">TUTON</SelectItem>
                          <SelectItem key="KARIL" textValue="KARIL">KARIL</SelectItem>
                          <SelectItem key="TK" textValue="TK">TK</SelectItem>
                        </Select>
                      </div>

                      {/* Baris 3: Nomor (per {chunk}) */}
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-foreground-500 mb-1">
                          Nomor (per {chunk || CHUNK_DEFAULT})
                        </div>
                        <Select
                          aria-label="Filter nomor"
                          size="sm"
                          selectedKeys={[rangeKey]}
                          onChange={(e) => onChangeRange((e.target.value as string) || "ALL")}
                          className="w-full"
                          radius="md"
                          variant="bordered"
                        >
                          {rangeOptions.map((rk) =>
                            rk === "ALL" ? (
                              <SelectItem key="ALL" textValue="Semua">Semua</SelectItem>
                            ) : (
                              <SelectItem key={rk} textValue={rk}>{rk}</SelectItem>
                            )
                          )}
                        </Select>
                      </div>
                    </div>

                    {/* ===== List (scroll) ===== */}
                    <div className="flex-1 min-h-0">
                      <ScrollShadow hideScrollBar className="h-full px-1">
                        {loading && (
                          <div className="flex items-center justify-center py-10">
                            <Spinner size="sm" />
                          </div>
                        )}

                        {!loading && loadError && (
                          <div className="px-3 py-4 text-sm text-danger">{loadError}</div>
                        )}

                        {!loading && !loadError && filtered.length === 0 && (
                          <div className="px-3 py-4 text-sm text-foreground-500">Tidak ada data.</div>
                        )}

                        <ul className="py-1">
                          {filtered.map((c) => {
                            const isActive = String(c.id) === String(activeId);
                            const nomor = numberMap.get(c.id) || 0;
                            const showTK = showTkBadgeFor(c.jenis);
                            return (
                              <li key={c.id}>
                                <button
                                  onClick={() => onPick(c)}
                                  className={`group w-full text-left px-3 py-2.5 transition relative rounded-xl
                                    ring-1 ring-default-200/60
                                    ${isActive
                                      ? "bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 dark:from-indigo-950/30 dark:via-sky-950/30 dark:to-emerald-950/30"
                                      : "hover:bg-default-50/60"}`}
                                >
                                  <span
                                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-full
                                      ${isActive
                                        ? "bg-gradient-to-b from-indigo-500 via-sky-500 to-emerald-500"
                                        : "bg-default-200"}`}
                                  />
                                  <div className="ml-3 flex items-center gap-3">
                                    <span
                                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold
                                        ${isActive
                                          ? "bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-foreground ring-1 ring-default-200"
                                          : "bg-default-100 text-foreground-700"}`}
                                    >
                                      {nomor}
                                    </span>
                                    <div className="min-w-0 flex items-center gap-2">
                                      <div className={`truncate ${isActive ? "font-semibold text-foreground" : "text-foreground-700 group-hover:text-foreground"}`}>
                                        {c.namaCustomer || "-"}
                                      </div>
                                      {showTK && (
                                        <Chip
                                          size="sm"
                                          variant="flat"
                                          color="danger"
                                          className="h-5 px-1.5 text-[10px]"
                                        >
                                          TK
                                        </Chip>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </ScrollShadow>
                    </div>
                  </Card>
                </div>

                {/* tombol tutup (floating) */}
                <button
                  aria-label="Tutup sidebar"
                  onClick={() => setCollapsed(true)}
                  className="absolute right-[-18px] top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center
                             rounded-full shadow-xl ring-1 ring-default-200
                             bg-background/90 backdrop-blur hover:bg-background transition"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground-600" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* === Konten detail === */}
        <section className="min-w-0">
          <Card className="rounded-2xl border border-default-200 shadow-sm">
            <div className="px-4 py-3">
              <CustomerDetail />
            </div>
            <Divider />
          </Card>
        </section>
      </div>
    </div>
  );
}
