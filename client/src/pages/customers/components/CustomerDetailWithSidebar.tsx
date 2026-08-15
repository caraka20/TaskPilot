// client/src/pages/customers/components/CustomerDetailWithSidebar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Select, SelectItem, Skeleton, Tooltip,
  Card, Button, ScrollShadow, Chip, Input,
} from "@heroui/react";
import { ChevronRight, Filter, RotateCcw, Search, UsersRound, X } from "lucide-react";

import CustomerDetail from "../CustomerDetail";
import { getCustomers } from "../../../services/customer.service";
import {
  type CustomerItem,
  type CustomerListResponse,
  type CustomerLayanan,
} from "../../../utils/customer";

type LayananFilter = "ALL" | CustomerLayanan;

const SIDEBAR_KEY = "customers:sidebarCollapsed";
const CHUNK_DEFAULT = 20;
const SIDEBAR_W = 256;

function normalizeLayananFromSearch(raw?: string | null): LayananFilter {
  if (!raw) return "ALL";
  const upper = raw.toUpperCase();
  if (upper === "METODE_PENELITIAN") return "METODE_PENELITIAN";
  if (upper === "TUTON") return "TUTON";
  if (upper === "KARIL") return "KARIL";
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

  // Mobile memakai sheet tersendiri supaya detail tetap selebar layar.
  // State ini sengaja dipisahkan dari `collapsed` yang hanya mengatur sidebar desktop.
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const mobileSheetRef = useRef<HTMLElement | null>(null);

  // persist collapsed
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(SIDEBAR_KEY) === "1");
  useEffect(() => { localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0"); }, [collapsed]);

  useEffect(() => {
    if (!mobileListOpen || typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileListOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() => mobileSheetRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileListOpen]);

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
  const [layananFilter, setLayananFilter] = useState<LayananFilter>(
    normalizeLayananFromSearch(searchParams.get("layanan") ?? searchParams.get("jenis"))
  );
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
    const base = all.filter((c) => {
      if (layananFilter === "ALL") return true;
      const layanan = c.layanan?.length
        ? c.layanan
        : [c.jenis];
      return layanan.includes(layananFilter);
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
  }, [all, layananFilter, q]);

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
  const linkTo = (cid: string | number, keepLayanan?: LayananFilter) => {
    const layananParam = keepLayanan ?? layananFilter;
    const sp = new URLSearchParams(location.search);
    sp.delete("jenis");
    if (layananParam && layananParam !== "ALL") sp.set("layanan", layananParam);
    else sp.delete("layanan");
    return { pathname: `/customers/${cid}`, search: `?${sp.toString()}` };
  };
  const onPick = (c: CustomerItem) => {
    setMobileListOpen(false);
    navigate(linkTo(c.id, layananFilter));
  };

  const onChangeLayanan = (val: LayananFilter) => {
    setLayananFilter(val);
    setRangeKey("ALL");
    const sp = new URLSearchParams(location.search);
    sp.delete("jenis");
    if (val !== "ALL") sp.set("layanan", val); else sp.delete("layanan");
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

  const resetFilters = () => {
    setQInput("");
    setQ("");
    setLayananFilter("ALL");
    setRangeKey("ALL");

    const sp = new URLSearchParams(location.search);
    sp.delete("q");
    sp.delete("jenis");
    sp.delete("layanan");
    sp.delete("page");
    sp.delete("limit");
    setSearchParams(sp, { replace: true });
  };

  const hasActiveFilters =
    Boolean(qInput.trim()) || layananFilter !== "ALL" || rangeKey !== "ALL";

  const layananOptions: Array<{ key: LayananFilter; label: string }> = [
    { key: "ALL", label: "Semua" },
    { key: "TUTON", label: "Tuton" },
    { key: "KARIL", label: "Karil" },
    { key: "METODE_PENELITIAN", label: "Metpen" },
  ];

  // layout: sidebar di KANAN
  const gridTemplate = collapsed ? "1fr" : `minmax(0,1fr) ${SIDEBAR_W}px`;

  const baseItemCls =
    "group relative w-full overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 " +
    "border-transparent bg-transparent hover:border-sky-200/80 hover:bg-sky-50/70 " +
    "dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[.07]";

  const activeLightCls =
    "border-sky-300/80 bg-[linear-gradient(110deg,rgba(239,248,255,.98),rgba(240,253,250,.92))] " +
    "shadow-[0_7px_18px_rgba(14,116,144,.10)]";

  const activeDarkCls =
    "border-sky-400/35 bg-[linear-gradient(110deg,rgba(14,51,74,.9),rgba(13,70,68,.72))] " +
    "shadow-[0_7px_18px_rgba(2,132,199,.09)]";

  const renderCustomerPanel = (mobile = false) => (
    <Card
      shadow="none"
      className={[
        "h-full border border-default-200/80 bg-content1/95 backdrop-blur-xl",
        "flex flex-col overflow-hidden",
        mobile
          ? "rounded-t-[28px] rounded-b-none"
          : "rounded-[22px] shadow-[0_14px_38px_rgba(15,23,42,.08)]",
      ].join(" ")}
    >
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#102f4a_0%,#164e64_58%,#0f766e_135%)] px-4 pb-4 pt-4 text-white">
        <div aria-hidden="true" className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-cyan-300/15 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-14 left-6 h-24 w-24 rounded-full bg-emerald-300/10 blur-2xl" />
        {mobile && (
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-2 h-1 w-12 -translate-x-1/2 rounded-full bg-white/40"
          />
        )}
        <div className={`relative flex min-h-11 items-center justify-between gap-3 ${mobile ? "pt-2" : ""}`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <UsersRound className="h-5 w-5 text-cyan-100" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200">Navigasi data</p>
              <h2 className="mt-0.5 truncate text-base font-bold tracking-tight">Daftar customer</h2>
              <p className="mt-0.5 text-[11px] text-slate-300">
                {loading ? "Menyiapkan data…" : `${all.length} customer tersedia`}
              </p>
            </div>
          </div>
          {mobile ? (
            <Button
              isIconOnly
              type="button"
              aria-label="Tutup daftar customer"
              variant="light"
              radius="full"
              className="h-10 min-h-10 w-10 min-w-10 shrink-0 text-white data-[hover=true]:bg-white/10"
              onPress={() => setMobileListOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          ) : (
            <Chip className="border border-white/15 bg-white/10 text-[10px] font-bold text-white" size="sm" variant="flat">
              {filtered.length}
            </Chip>
          )}
        </div>
      </div>

      <div className="z-10 border-b border-default-200/70 bg-content1/95 p-3 backdrop-blur">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
              <Filter className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">Pencarian &amp; filter</p>
              <p className="text-[9px] text-foreground-400">Temukan akun lebih cepat</p>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-bold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        <Input
          aria-label="Cari customer berdasarkan nama atau NIM"
          isClearable
          size={mobile ? "md" : "sm"}
          variant="flat"
          radius="lg"
          value={qInput}
          onValueChange={setQInput}
          onClear={() => setQInput("")}
          placeholder="Cari nama atau NIM"
          startContent={<Search className="h-4 w-4 text-foreground-400" />}
          classNames={{
            inputWrapper:
              "min-h-11 border border-default-200/80 bg-default-100/70 shadow-none transition-colors data-[hover=true]:bg-default-100 group-data-[focus=true]:border-primary/50 group-data-[focus=true]:bg-content1",
            input: "text-sm placeholder:text-foreground-350",
          }}
        />

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-foreground-400">Jenis layanan</span>
            <span className="text-[9px] font-medium text-foreground-400">Pilih satu</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5" aria-label="Filter layanan">
            {layananOptions.map((option) => {
              const selected = layananFilter === option.key;
              return (
                <button
                  type="button"
                  key={option.key}
                  aria-pressed={selected}
                  onClick={() => onChangeLayanan(option.key)}
                  className={[
                    "min-h-9 rounded-xl border px-2 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    selected
                      ? "border-transparent bg-[#123b5a] text-white shadow-[0_5px_14px_rgba(18,59,90,.16)] dark:bg-sky-500/20 dark:text-sky-100 dark:ring-1 dark:ring-sky-400/30"
                      : "border-default-200/80 bg-default-50 text-foreground-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[.07] dark:hover:text-sky-200",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-foreground-400">Rentang daftar</span>
            <span className="text-[9px] font-medium text-foreground-400">{chunk || CHUNK_DEFAULT} per kelompok</span>
          </div>
          <Select
            aria-label="Filter rentang nomor customer"
            size={mobile ? "md" : "sm"}
            selectedKeys={[rangeKey]}
            onChange={(event) => onChangeRange((event.target.value as string) || "ALL")}
            className="w-full"
            classNames={{
              trigger: "min-h-10 rounded-xl border-default-200/80 bg-default-50 shadow-none",
              value: "text-xs font-semibold text-foreground-700",
            }}
            radius="lg"
            variant="bordered"
          >
            {rangeOptions.map((range) =>
              range === "ALL" ? (
                <SelectItem key="ALL" textValue="Tampilkan semua">Tampilkan semua</SelectItem>
              ) : (
                <SelectItem key={range} textValue={`Nomor ${range}`}>Nomor {range}</SelectItem>
              )
            )}
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-default-200/60 bg-default-50/70 px-3 py-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-foreground-400">Customer</span>
        <span className="rounded-full bg-content1 px-2 py-0.5 text-[10px] font-bold text-foreground-500 ring-1 ring-default-200/70">
          {loading ? "…" : `${filtered.length} hasil`}
        </span>
      </div>

      <div className="min-h-0 flex-1 bg-content1">
        <ScrollShadow hideScrollBar className="h-full px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
          {loading && (
            <div className="space-y-1.5 py-1" role="status" aria-label="Memuat customer">
              <span className="sr-only">Memuat customer…</span>
              {Array.from({ length: mobile ? 7 : 9 }, (_, index) => (
                <div className="flex min-h-14 items-center gap-2.5 rounded-xl px-2" key={index}>
                  <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4 rounded-md" />
                    <Skeleton className="h-2.5 w-1/2 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && loadError && (
            <div className="mx-1 mt-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-4 text-center text-xs leading-5 text-danger-700 dark:border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-300" role="alert">
              {loadError}
            </div>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <div className="px-3 py-8 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-default-100 text-foreground-400">
                <Search className="h-4 w-4" />
              </span>
              <p className="mt-3 text-xs font-bold text-foreground-700">Customer tidak ditemukan</p>
              <p className="mt-1 text-[10px] leading-4 text-foreground-400">Ubah kata pencarian atau reset filter.</p>
            </div>
          )}

          {!loading && !loadError && (
            <ul className="space-y-1">
              {filtered.map((customer) => {
                const isActive = String(customer.id) === String(activeId);
                const nomor = numberMap.get(customer.id) || 0;

                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => onPick(customer)}
                      className={[
                        baseItemCls,
                        "min-h-14 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                        isActive ? (isDark ? activeDarkCls : activeLightCls) : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full transition-colors",
                          isActive ? "bg-gradient-to-b from-sky-500 to-teal-500" : "bg-transparent",
                        ].join(" ")}
                      />
                      <div className="flex items-center gap-2.5">
                        <span
                          className={[
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-colors",
                            isActive
                              ? "bg-[#123b5a] text-white shadow-sm dark:bg-sky-400/20 dark:text-sky-100"
                              : "bg-default-100 text-foreground-600 group-hover:bg-white dark:group-hover:bg-default-100",
                          ].join(" ")}
                        >
                          {nomor}
                        </span>

                        <div className="min-w-0 flex-1">
                          <span className={`block truncate text-[13px] ${isActive ? "font-bold text-foreground" : "font-semibold text-foreground-700 group-hover:text-foreground"}`}>
                            {customer.namaCustomer || "-"}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-foreground-400">
                            {customer.nim ? `NIM ${customer.nim}` : "NIM belum tersedia"}
                          </span>
                        </div>

                        <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition ${isActive ? "text-sky-600 dark:text-sky-300" : "text-foreground-300 group-hover:translate-x-0.5 group-hover:text-foreground-500"}`} />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollShadow>
      </div>
    </Card>
  );

  return (
    <div
      data-workspace-page
      className="w-full bg-gradient-to-br from-sky-50/30 via-transparent to-teal-50/30 py-0 dark:from-sky-950/10 dark:to-teal-950/10"
      data-customers-shell
    >
      <div
        className="relative md:grid md:h-[calc(100dvh-2.25rem)] md:gap-3 md:overflow-visible md:transition-[grid-template-columns] md:duration-300"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {/* === Konten Detail (kolom kiri) === */}
        <section className="relative min-w-0 md:h-full md:overflow-y-auto">
          <div className="sticky top-0 z-30 mb-3 md:hidden">
            <Button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={mobileListOpen}
              variant="bordered"
              radius="lg"
              className="min-h-11 w-full justify-between border-default-200 bg-background/90 px-4 shadow-sm backdrop-blur"
              startContent={<UsersRound className="h-5 w-5 text-primary" />}
              endContent={
                <Chip size="sm" variant="flat" color="primary">
                  {loading ? "…" : filtered.length}
                </Chip>
              }
              onPress={() => setMobileListOpen(true)}
            >
              Pilih customer
            </Button>
          </div>

          <div className="pb-1 md:pr-0.5">
            <CustomerDetail />
          </div>
        </section>

        {/* === Sidebar (kolom kanan) — hanya render saat terbuka === */}
        {!collapsed && (
          <aside className="relative hidden h-full self-start overflow-visible md:block">
            <Tooltip content="Tutup daftar customer" placement="left">
              <Button
                isIconOnly
                aria-label="Tutup sidebar"
                radius="full"
                variant="bordered"
                className="absolute left-0 top-1/2 z-50 hidden h-11 w-11 min-w-11 -translate-x-1/2 -translate-y-1/2 bg-background/95 shadow-lg ring-1 ring-default-200 backdrop-blur transition md:inline-flex"
                onPress={() => setCollapsed(true)}
              >
                <ChevronRight className="h-4 w-4 text-foreground-600" />
              </Button>
            </Tooltip>
            <div className="relative h-full overflow-hidden rounded-[22px]">{renderCustomerPanel()}</div>
          </aside>
        )}

        {collapsed && (
          <Tooltip content="Buka daftar customer" placement="left">
            <Button
              isIconOnly
              aria-label="Buka sidebar"
              radius="full"
              variant="bordered"
              className="absolute right-1 top-1/2 z-50 hidden h-11 w-11 min-w-11 -translate-y-1/2 bg-background/95 shadow-lg ring-1 ring-default-200 backdrop-blur transition hover:-translate-x-0.5 md:inline-flex"
              onPress={() => setCollapsed(false)}
            >
              <ChevronRight className="h-4 w-4 rotate-180 text-foreground-600" />
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Mobile customer picker: sheet tidak mengurangi lebar halaman detail. */}
      {mobileListOpen && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label="Tutup daftar customer"
            className="absolute inset-0 h-full w-full cursor-default bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMobileListOpen(false)}
          />
          <section
            ref={mobileSheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Pilih customer"
            tabIndex={-1}
            className="absolute inset-x-0 bottom-0 z-10 h-[min(88dvh,760px)] overflow-hidden rounded-t-3xl shadow-2xl outline-none"
          >
            {renderCustomerPanel(true)}
          </section>
        </div>
      )}
    </div>
  );
}
