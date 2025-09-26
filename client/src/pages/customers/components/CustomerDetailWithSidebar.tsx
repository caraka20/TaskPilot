// client/src/pages/customers/components/CustomerDetailWithSidebar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Select, SelectItem, Spinner, Tooltip,
  Card, Button, ScrollShadow, Divider, Chip, Input,
} from "@heroui/react";
import { ChevronRight, Filter, Search } from "lucide-react";

import CustomerDetail from "../CustomerDetail";
import { getCustomers } from "../../../services/customer.service";
import type { CustomerItem, CustomerListResponse, CustomerJenis } from "../../../utils/customer";

type JenisFilter = "ALL" | CustomerJenis;

const SIDEBAR_KEY = "customers:sidebarCollapsed";
const CHUNK_DEFAULT = 20;
const SIDEBAR_W = 208;        // lebar sidebar saat terbuka (diperkecil dari 248)
const BTN_W_CLOSED = 48;      // h-12 w-12 (tombol open)
const GAP = 6;                // jarak kecil dari tepi konten (diperkecil dari 8)
const PRESS_IN = 24;          // offset press-in saat collapsed (biar ga mepet)

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

  // persist collapsed
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(SIDEBAR_KEY) === "1");
  useEffect(() => { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); }, [collapsed]);

  // detect theme
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // filters dari URL
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>(normalizeJenisFromSearch(searchParams.get("jenis")));
  const [chunk, setChunk] = useState<number>(() => intFrom(searchParams, "limit", CHUNK_DEFAULT));
  const [rangeKey, setRangeKey] = useState<string>("ALL");

  // search (debounce)
  const [qInput, setQInput] = useState<string>("");
  const [q, setQ] = useState<string>("");
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // data
  const [all, setAll] = useState<CustomerItem[]>([]);
  const [beTotal, setBeTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  // build range
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

  // apply initial range
  useEffect(() => {
    if (didApplyInitialRangeRef.current) return;
    if (beTotal <= 0) return;

    const urlLimit = intFrom(searchParams, "limit", chunk || CHUNK_DEFAULT);
    const size = Math.max(1, urlLimit);
    if (size !== chunk) setChunk(size);

    const urlPage = intFrom(searchParams, "page", 1);
    const pages = Math.max(1, Math.ceil(beTotal / size));
    const safePage = Math.min(Math.max(1, urlPage), pages);

    const start = (safePage - 1) * size + 1;
    const end = Math.min(beTotal, safePage * size);
    const key = `${start}-${end}`;
    setRangeKey(key);

    const sp = new URLSearchParams(location.search);
    sp.set("page", String(safePage));
    sp.set("limit", String(size));
    setSearchParams(sp, { replace: true });

    didApplyInitialRangeRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beTotal]);

  // filter + search + sort
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

    const qq = q.toLowerCase();
    const searched = qq
      ? base.filter((c) =>
          (c.namaCustomer || "").toLowerCase().includes(qq) ||
          (c.nim || "").toLowerCase().includes(qq)
        )
      : base;

    return searched
      .slice()
      .sort((a, b) =>
        (a.namaCustomer || "").localeCompare(b.namaCustomer || "", "id", { sensitivity: "base" })
      );
  }, [all, jenisFilter, q]);

  // numbering
  const numberMap = useMemo(() => {
    const m = new Map<number | string, number>();
    baseByJenis.forEach((c, i) => m.set(c.id, i + 1));
    return m;
  }, [baseByJenis]);

  // apply range
  const filtered = useMemo(() => {
    if (rangeKey === "ALL") return baseByJenis;
    const [s, e] = rangeKey.split("-").map((n) => parseInt(n, 10));
    return baseByJenis.filter((c) => {
      const no = numberMap.get(c.id) || 0;
      return no >= s && no <= e;
    });
  }, [baseByJenis, numberMap, rangeKey]);

  // nav helpers
  const linkTo = (cid: string | number, keepJenis?: JenisFilter) => {
    const jenisParam = keepJenis ?? jenisFilter;
    const sp = new URLSearchParams(location.search);
    if (jenisParam && jenisParam !== "ALL") sp.set("jenis", jenisParam);
    else sp.delete("jenis");
    return { pathname: `/customers/${cid}`, search: `?${sp.toString()}` };
  };
  const onPick = (c: CustomerItem) => navigate(linkTo(c.id, jenisFilter));

  const onChangeJenis = (val: JenisFilter) => {
    setJenisFilter(val);
    setRangeKey("ALL");
    const sp = new URLSearchParams(location.search);
    if (val !== "ALL") sp.set("jenis", val); else sp.delete("jenis");
    sp.delete("page"); sp.delete("limit");
    setSearchParams(sp, { replace: true });
    const firstVisible = baseByJenis[0];
    if (firstVisible) navigate(linkTo(firstVisible.id, val));
  };

  const onChangeRange = (val: string) => {
    const v = val || "ALL";
    setRangeKey(v);
    const sp = new URLSearchParams(location.search);
    if (v === "ALL") {
      sp.delete("page"); sp.delete("limit");
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

  // layout: sidebar di KANAN
  const gridTemplate = collapsed ? "1fr" : `1fr ${SIDEBAR_W}px`;

  const tkBadgeCls =
    "h-5 px-1.5 text-[10px] rounded-md bg-rose-500/18 text-rose-300 ring-1 ring-rose-400/35 " +
    "shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

  // === NEW: badge KARIL
  const karilBadgeCls =
    "h-5 px-1.5 text-[10px] rounded-md bg-amber-500/18 text-amber-300 ring-1 ring-amber-400/35 " +
    "shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

  const baseItemCls =
    "group w-full text-left px-3 py-2 text-[14px] transition relative rounded-xl " +
    "ring-1 ring-default-200/60 bg-content2/70 " +
    "hover:translate-x-[1px] hover:bg-default-100 " +
    "dark:hover:bg-content2";

  const activeLightCls =
    "bg-white ring-2 ring-sky-400/60 ring-offset-2 ring-offset-white " +
    "shadow-[0_6px_18px_rgba(2,132,199,.10),inset_0_0_0_1px_rgba(0,0,0,0.04)]";

  const activeDarkCls =
    "bg-[linear-gradient(90deg,rgba(14,22,38,.85),rgba(14,22,38,.85))] " +
    "ring-2 ring-sky-400/70 ring-offset-2 ring-offset-[#0B1220] " +
    "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_0_0_1px_rgba(3,105,161,.35)]";

  // === ukur gutter kanan dari KONTEN (kolom kiri), bukan dari grid ===
  const gridRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const [gutterRight, setGutterRight] = useState<number>(16);

  useEffect(() => {
    const calc = () => {
      const el = contentRef.current ?? gridRef.current;
      if (!el) { setGutterRight(16); return; }
      const rect = el.getBoundingClientRect();
      const gutter = Math.max(8, Math.round(window.innerWidth - rect.right));
      setGutterRight(gutter);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (gridRef.current) ro.observe(gridRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", calc);
    window.addEventListener("scroll", calc, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
      window.removeEventListener("scroll", calc as any);
    };
  }, []);

  // posisi tombol: nempel ke tepi KONTEN
  const toggleRightPx = gutterRight + (collapsed ? Math.max(GAP, PRESS_IN - (BTN_W_CLOSED / 2)) : GAP);

  return (
    <div className="w-full px-1 md:px-2 py-3 md:py-5" data-customers-shell>
      <div
        ref={gridRef}
        className="grid gap-3 transition-[grid-template-columns] duration-300 h-[calc(100vh-5.5rem)] overflow-hidden"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {/* === Konten Detail (kolom kiri) === */}
        <section ref={contentRef} className="relative min-w-0 h-full overflow-y-auto">
          {/* Tombol toggle (fixed, tidak ikut scroll & nempel tepi konten) */}
          {collapsed ? (
            <Tooltip content="Buka daftar customer" placement="left">
              <Button
                isIconOnly
                aria-label="Buka sidebar"
                radius="full"
                variant="bordered"
                className="fixed top-1/2 -translate-y-1/2 h-12 w-12 shadow-md backdrop-blur
                           supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-[#0B1220]/70 z-50"
                style={{ right: toggleRightPx }}
                onPress={() => setCollapsed(false)}
              >
                <ChevronRight className="h-5 w-5 text-foreground-600" />
              </Button>
            </Tooltip>
          ) : (
            <Tooltip content="Tutup daftar customer" placement="left">
              <Button
                isIconOnly
                aria-label="Tutup sidebar"
                radius="full"
                variant="bordered"
                className="fixed top-1/2 -translate-y-1/2 h-10 w-10 shadow-xl ring-1 ring-default-200
                           bg-background/90 backdrop-blur hover:bg-background transition z-50"
                style={{ right: toggleRightPx }}
                onPress={() => setCollapsed(true)}
              >
                <ChevronRight className="h-4 w-4 text-foreground-600 rotate-180" />
              </Button>
            </Tooltip>
          )}

          <Card className="rounded-2xl border border-default-200 shadow-sm">
            <div className="px-4 py-3">
              <CustomerDetail />
            </div>
            <Divider />
          </Card>
        </section>

        {/* === Sidebar (kolom kanan) — hanya render saat terbuka === */}
        {!collapsed && (
          <aside className="self-start h-full overflow-hidden">
            <div className="relative h-full">
              <div className="rounded-2xl p-[1px] h-full bg-gradient-to-b from-indigo-200/70 via-sky-200/60 to-emerald-200/70 dark:from-indigo-900/40 dark:via-sky-900/40 dark:to-emerald-900/40">
                <Card
                  shadow="sm"
                  className="h-full rounded-[1rem] border border-default-200/60 backdrop-blur supports-[backdrop-filter]:bg-background/80
                             flex flex-col overflow-hidden"
                >
                  {/* Header (sticky) */}
                  <div className="sticky top-0 z-10 border-b border-default-200/60 bg-background/70 backdrop-blur px-3 py-3 rounded-t-[0.95rem]">
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

                    {/* Search */}
                    <div className="mb-2">
                      <Input
                        size="sm"
                        variant="bordered"
                        radius="md"
                        value={qInput}
                        onValueChange={setQInput}
                        placeholder="Cari nama / NIM…"
                        startContent={<Search className="h-4 w-4 text-foreground-400" />}
                      />
                    </div>

                    {/* Jenis */}
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

                    {/* Range */}
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

                  {/* List (scroll only here) */}
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
                          const jenisU = (c.jenis || "").toUpperCase();
                          const isTK = jenisU.includes("TK");
                          const isKARIL = jenisU.includes("KARIL");

                          return (
                            <li key={c.id}>
                              <button
                                onClick={() => onPick(c)}
                                className={[
                                  baseItemCls,
                                  isActive ? (isDark ? activeDarkCls : activeLightCls) : ""
                                ].join(" ")}
                              >
                                {/* aksen kiri */}
                                <span
                                  className={[
                                    "absolute left-0 top-2 bottom-2 w-1 rounded-full transition-colors",
                                    isActive
                                      ? "bg-gradient-to-b from-indigo-500 via-sky-500 to-emerald-500"
                                      : "bg-default-200"
                                  ].join(" ")}
                                />
                                <div className="ml-3 flex items-center gap-3">
                                  {/* bubble nomor */}
                                  <span
                                    className={[
                                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                                      isActive
                                        ? "bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-foreground ring-2 ring-sky-400/60"
                                        : "bg-default-100 text-foreground-700"
                                    ].join(" ")}
                                  >
                                    {nomor}
                                  </span>

                                  {/* nama + badge */}
                                  <div className="min-w-0 flex items-center gap-2 flex-1">
                                    <span className={`block truncate max-w-full text-[15px] ${isActive ? "font-semibold text-foreground" : "text-foreground-700 group-hover:text-foreground"}`}>
                                      {c.namaCustomer || "-"}
                                    </span>
                                    {isTK && (
                                      <Chip size="sm" variant="flat" className={tkBadgeCls}>
                                        TK
                                      </Chip>
                                    )}
                                    {isKARIL && (
                                      <Chip size="sm" variant="flat" className={karilBadgeCls}>
                                        KARIL
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
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
