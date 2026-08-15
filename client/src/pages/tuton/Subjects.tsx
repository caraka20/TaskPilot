import { useEffect, useMemo, useState } from "react";
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Input, Select, SelectItem, Pagination, Spinner,
} from "@heroui/react";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  listSubjects, scanTuton,
  type SubjectEntry, type ScanResponse, type ScanRow,
  type JenisTugas, type StatusTugas,
} from "../../services/tuton.service";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Database,
  Filter,
  RotateCcw,
  ScanSearch,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  ABSEN_SESSIONS,
  DISKUSI_SESSIONS,
  TUGAS_SESSIONS,
} from "./components/matrix/constants";
import WorkspacePageHeader from "../../components/common/WorkspacePageHeader";

/** Tetap: pilihan jenis & status */
const JENIS_OPTIONS: JenisTugas[] = ["ABSEN", "DISKUSI", "TUGAS"];

const JENIS_LABEL: Record<JenisTugas, string> = {
  ABSEN: "Absensi",
  DISKUSI: "Diskusi",
  TUGAS: "Tugas",
};

type CopasFilter = "SEMUA" | "YA" | "TIDAK";

const DEFAULT_PAGE_SIZE = 10;
const SUBJECT_PAGE_SIZE_DEFAULT = 10;

const panelGroupVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.09,
    },
  },
};

const panelItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(2px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.44,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const sessionsForJenis = (jenis: JenisTugas): readonly number[] => {
  if (jenis === "TUGAS") return TUGAS_SESSIONS;
  if (jenis === "DISKUSI") return DISKUSI_SESSIONS;
  return ABSEN_SESSIONS;
};

export default function TutonSubjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();

  // ===== Subjects (matkul) list =====
  const [subjects, setSubjects] = useState<SubjectEntry[]>([]);
  const [q, setQ] = useState("");
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // client-side pagination for subjects
  const [subjectPage, setSubjectPage] = useState(1);
  const [subjectPageSize, setSubjectPageSize] = useState(SUBJECT_PAGE_SIZE_DEFAULT);

  const subjectTotalPages = useMemo(
    () => Math.max(1, Math.ceil(subjects.length / subjectPageSize)),
    [subjects.length, subjectPageSize]
  );
  const subjectsSlice = useMemo(() => {
    const start = (subjectPage - 1) * subjectPageSize;
    return subjects.slice(start, start + subjectPageSize);
  }, [subjects, subjectPage, subjectPageSize]);

  // ===== Scan filters (UI state mirrors query string) =====
  const [matkul, setMatkul] = useState<string>(searchParams.get("matkul") ?? "");
  const [jenis, setJenis] = useState<JenisTugas>((searchParams.get("jenis") as JenisTugas) || "DISKUSI");
  const [sesi, setSesi] = useState<number>(Number(searchParams.get("sesi") || 1));
  const [status, setStatus] = useState<StatusTugas>((searchParams.get("status") as StatusTugas) || "BELUM");
  const [page, setPage] = useState<number>(Number(searchParams.get("page") || 1));
  const [pageSize, setPageSize] = useState<number>(Number(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE));
  const [copas, setCopas] = useState<CopasFilter>(() => {
    const p = (searchParams.get("copas") || "").toUpperCase();
    if (["YA", "TRUE", "1"].includes(p)) return "YA";
    if (["TIDAK", "FALSE", "0"].includes(p)) return "TIDAK";
    return "SEMUA";
  });

  const [scanLoading, setScanLoading] = useState(false);
  const [scan, setScan] = useState<ScanResponse | null>(null);

  // ===== Utils =====
  const ResultRange = ({ total, page, pageSize }: { total: number; page: number; pageSize: number }) => {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(total, page * pageSize);
    return (
      <span className="text-sm text-foreground-500">
        Menampilkan <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span> dari <span className="font-medium">{total}</span>
      </span>
    );
  };

  // ===== load subjects =====
  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await listSubjects(q || undefined);
      setSubjects(data);
      setSubjectPage(1); // reset page tiap cari
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initial

  // ===== URL -> state sync (dan auto fetch scan) =====
  useEffect(() => {
    const pMatkul = searchParams.get("matkul") ?? "";
    const pJenis = (searchParams.get("jenis") as JenisTugas) || "DISKUSI";
    const rawSesi = Number(searchParams.get("sesi") || 1);
    const allowedSessions = sessionsForJenis(pJenis);
    const pSesi = allowedSessions.includes(rawSesi) ? rawSesi : allowedSessions[0];
    const pStatus = (searchParams.get("status") as StatusTugas) || "BELUM";
    const pPage = Number(searchParams.get("page") || 1);
    const pPageSize = Number(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE);
    const pCopasRaw = (searchParams.get("copas") || "").toUpperCase();
    const pCopas: CopasFilter =
      ["YA", "TRUE", "1"].includes(pCopasRaw) ? "YA"
      : ["TIDAK", "FALSE", "0"].includes(pCopasRaw) ? "TIDAK"
      : "SEMUA";

    setMatkul(pMatkul);
    setJenis(pJenis);
    setSesi(pSesi);
    setStatus(pStatus);
    setPage(pPage);
    setPageSize(pPageSize);
    setCopas(pCopas);

    (async () => {
      if (!pJenis || !pSesi || !pStatus) {
        setScan(null);
        return;
      }
      setScanLoading(true);
      try {
        const data = await scanTuton({
          matkul: pMatkul || undefined,
          jenis: pJenis,
          sesi: pSesi,
          status: pStatus,
          page: pPage,
          pageSize: pPageSize,
          // Jika "SEMUA" → kirim undefined (biar BE tidak memfilter)
          copas: pCopas === "SEMUA" ? undefined : pCopas === "YA",
        });
        setScan(data);
      } finally {
        setScanLoading(false);
      }
    })();
  }, [searchParams]);

  // apply current UI filter -> URL
  const applyFiltersToQuery = (opts?: { resetPage?: boolean }) => {
    const params: Record<string, string> = {
      jenis,
      sesi: String(sesi),
      status,
      page: String(opts?.resetPage ? 1 : page),
      pageSize: String(pageSize),
    };
    if (matkul) params.matkul = matkul;
    if (copas !== "SEMUA") params.copas = copas;
    setSearchParams(params);
  };

  // quick scan from a subject row
  const handleQuickScan = (subjectMatkul: string) => {
    const params: Record<string, string> = {
      matkul: subjectMatkul,
      jenis,
      sesi: String(sesi),
      status,
      page: "1",
      pageSize: String(pageSize),
    };
    if (copas !== "SEMUA") params.copas = copas;
    setSearchParams(params);
  };

  // reset filters
  const resetFilters = () => {
    setMatkul("");
    setJenis("DISKUSI");
    setSesi(1);
    setStatus("BELUM");
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
    setCopas("SEMUA");
    setSearchParams({ jenis: "DISKUSI", sesi: "1", status: "BELUM", page: "1", pageSize: String(DEFAULT_PAGE_SIZE) });
  };

  return (
    <div data-workspace-page className="space-y-5 pb-8">
      <WorkspacePageHeader
        eyebrow="ARTECH • Tuton workspace"
        title="Mata kuliah & pemindaian sesi"
        description="Periksa progres Absensi, Diskusi, Tugas, dan status COPAS dalam satu alur yang ringkas."
        icon={BookOpenCheck}
        metrics={[
          { label: "Mata kuliah", value: `${subjects.length} mata kuliah`, icon: BookOpenCheck, tone: "cyan" },
          { label: "Hasil scan", value: `${scan?.meta.total ?? 0} hasil`, icon: Database, tone: "emerald" },
          { label: "Filter aktif", value: `${JENIS_LABEL[jenis]} · Sesi ${sesi}`, icon: Filter, tone: "indigo" },
        ]}
      />

      <section className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]">
        <motion.div
          variants={panelGroupVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
        >
        <motion.div variants={panelItemVariants} className="flex flex-col gap-4 border-b border-default-200/70 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e7f4f7] text-[#155e75] ring-1 ring-[#bfe1e8] dark:bg-cyan-400/10 dark:text-cyan-300 dark:ring-cyan-400/15">
              <ScanSearch className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#16758a] dark:text-cyan-300">Pemindaian sesi</p>
              <h2 className="mt-0.5 text-lg font-bold text-foreground">Temukan pekerjaan yang perlu ditindaklanjuti</h2>
              <p className="mt-1 text-xs leading-5 text-foreground-500">Saring aktivitas Tuton berdasarkan mata kuliah, sesi, status pengerjaan, dan kondisi COPAS.</p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-default-200/80 bg-default-50/80 px-3.5 py-2.5 dark:bg-default-100/50">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[#155e75] shadow-sm dark:bg-slate-800 dark:text-cyan-300">
              {scanLoading ? <Spinner size="sm" color="primary" /> : <Database className="h-4 w-4" />}
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-foreground-400">Hasil terakhir</p>
              <p className="text-sm font-bold text-foreground">{scanLoading ? "Memindai…" : `${scan?.meta.total ?? 0} data ditemukan`}</p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={panelItemVariants} className="border-b border-default-200/70 bg-[#f5f8fb] px-4 py-5 dark:bg-slate-950/30 sm:px-6 sm:py-6">
          <div className="overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-[0_12px_32px_rgba(15,42,76,.055)] dark:border-slate-700/80 dark:bg-slate-900">
            <div className="flex flex-col gap-2 border-b border-slate-200/80 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f2f8] text-[#174d73] dark:bg-sky-400/10 dark:text-sky-300">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Kriteria pemindaian</p>
                  <p className="mt-0.5 text-[11px] text-foreground-400">Pilih target dan kondisi pekerjaan yang ingin diperiksa.</p>
                </div>
              </div>
              <span className="hidden text-[10px] font-semibold text-foreground-400 sm:block">Tekan Enter untuk memindai cepat</span>
            </div>

            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[minmax(230px,1.65fr)_repeat(4,minmax(135px,1fr))] xl:items-end xl:p-5">
              <Input
                aria-label="Mata kuliah"
                label="Mata kuliah"
                placeholder="Semua mata kuliah"
                labelPlacement="outside"
                value={matkul}
                onChange={(e) => setMatkul(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyFiltersToQuery({ resetPage: true }); }}
                startContent={<Search className="h-4 w-4 text-[#16758a]" />}
                classNames={{
                  label: "pb-1 text-[11px] font-bold text-foreground-600",
                  inputWrapper: "min-h-12 rounded-xl border border-slate-200 bg-slate-50/80 shadow-none transition-colors group-data-[focus=true]:border-[#2a7892] group-data-[focus=true]:bg-white dark:border-slate-700 dark:bg-slate-800/80",
                  input: "text-sm font-medium",
                }}
              />

              <Select
                label="Aktivitas"
                labelPlacement="outside"
                selectedKeys={new Set([jenis])}
                onSelectionChange={(keys) => {
                  const next = Array.from(keys as Set<string>)[0] as JenisTugas;
                  setJenis(next);
                  const allowed = sessionsForJenis(next);
                  if (!allowed.includes(sesi)) setSesi(allowed[0]);
                }}
                classNames={{
                  label: "pb-1 text-[11px] font-bold text-foreground-600",
                  trigger: "min-h-12 rounded-xl border border-slate-200 bg-slate-50/80 shadow-none data-[open=true]:border-[#2a7892] dark:border-slate-700 dark:bg-slate-800/80",
                  value: "text-sm font-semibold",
                }}
              >
                {JENIS_OPTIONS.map((item) => <SelectItem key={item}>{JENIS_LABEL[item]}</SelectItem>)}
              </Select>

              <Select
                label="Sesi"
                labelPlacement="outside"
                selectedKeys={new Set([String(sesi)])}
                onSelectionChange={(keys) => setSesi(Number(Array.from(keys as Set<string>)[0] || 1))}
                classNames={{
                  label: "pb-1 text-[11px] font-bold text-foreground-600",
                  trigger: "min-h-12 rounded-xl border border-slate-200 bg-slate-50/80 shadow-none data-[open=true]:border-[#2a7892] dark:border-slate-700 dark:bg-slate-800/80",
                  value: "text-sm font-semibold",
                }}
              >
                {sessionsForJenis(jenis).map((item) => <SelectItem key={String(item)}>Sesi {item}</SelectItem>)}
              </Select>

              <Select
                label="Status pekerjaan"
                labelPlacement="outside"
                selectedKeys={new Set([status])}
                onSelectionChange={(keys) => setStatus(Array.from(keys as Set<string>)[0] as StatusTugas)}
                classNames={{
                  label: "pb-1 text-[11px] font-bold text-foreground-600",
                  trigger: "min-h-12 rounded-xl border border-slate-200 bg-slate-50/80 shadow-none data-[open=true]:border-[#2a7892] dark:border-slate-700 dark:bg-slate-800/80",
                  value: "text-sm font-semibold",
                }}
              >
                <SelectItem key="BELUM">Belum selesai</SelectItem>
                <SelectItem key="SELESAI">Selesai</SelectItem>
              </Select>

              <Select
                label="Status COPAS"
                labelPlacement="outside"
                selectedKeys={new Set([copas])}
                onSelectionChange={(keys) => setCopas(Array.from(keys as Set<string>)[0] as CopasFilter)}
                classNames={{
                  label: "pb-1 text-[11px] font-bold text-foreground-600",
                  trigger: "min-h-12 rounded-xl border border-slate-200 bg-slate-50/80 shadow-none data-[open=true]:border-[#2a7892] dark:border-slate-700 dark:bg-slate-800/80",
                  value: "text-sm font-semibold",
                }}
              >
                <SelectItem key="SEMUA">Semua kondisi</SelectItem>
                <SelectItem key="YA">Sudah COPAS</SelectItem>
                <SelectItem key="TIDAK">Belum COPAS</SelectItem>
              </Select>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200/80 bg-slate-50/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-700/80 dark:bg-slate-800/45">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-400">Filter aktif</span>
                {matkul && <Chip size="sm" variant="flat" className="max-w-[220px] bg-sky-100 text-sky-800 dark:bg-sky-400/10 dark:text-sky-300">{matkul}</Chip>}
                <Chip size="sm" variant="flat" className="bg-[#e8f2f8] text-[#174d73] dark:bg-sky-400/10 dark:text-sky-300">{JENIS_LABEL[jenis]}</Chip>
                <Chip size="sm" variant="flat">Sesi {sesi}</Chip>
                <Chip size="sm" color={status === "BELUM" ? "warning" : "success"} variant="flat">{status === "BELUM" ? "Belum selesai" : "Selesai"}</Chip>
                {copas !== "SEMUA" && <Chip size="sm" variant="flat">{copas === "YA" ? "Sudah COPAS" : "Belum COPAS"}</Chip>}
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                <Button
                  aria-label="Reset seluruh filter"
                  variant="flat"
                  className="min-h-11 rounded-xl px-4 font-semibold text-foreground-600"
                  onPress={resetFilters}
                  startContent={<RotateCcw className="h-4 w-4" />}
                >
                  Reset
                </Button>
                <Button
                  className="min-h-11 rounded-xl bg-[#174d73] px-5 font-bold text-white shadow-[0_8px_20px_rgba(23,77,115,.20)] transition hover:bg-[#123f60]"
                  startContent={!scanLoading && <ScanSearch className="h-4 w-4" />}
                  onPress={() => applyFiltersToQuery({ resetPage: true })}
                  isLoading={scanLoading}
                  isDisabled={scanLoading}
                >
                  Pindai data
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={panelItemVariants} className="px-4 py-5 sm:px-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-bold text-foreground">Hasil pemindaian</h3>
              <p className="mt-1 text-xs text-foreground-500">Klik nama customer untuk membuka detail pekerjaannya.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {scan && <ResultRange total={scan.meta.total} page={page} pageSize={pageSize} />}
              <Select
                aria-label="Jumlah hasil per halaman"
                selectedKeys={new Set([String(pageSize)])}
                onSelectionChange={(keys) => {
                  const nextSize = Number(Array.from(keys as Set<string>)[0] || DEFAULT_PAGE_SIZE);
                  setPageSize(nextSize);
                  const params: Record<string, string> = {
                    ...(matkul ? { matkul } : {}), jenis, sesi: String(sesi), status,
                    page: "1", pageSize: String(nextSize),
                  };
                  if (copas !== "SEMUA") params.copas = copas;
                  setSearchParams(params);
                }}
                className="w-full sm:w-[145px]"
                size="sm"
              >
                {[10, 20, 50, 100].map((item) => <SelectItem key={String(item)}>{item} / halaman</SelectItem>)}
              </Select>
            </div>
          </div>

          <div className="mb-3 rounded-xl bg-primary/5 px-3 py-2 text-xs text-foreground-500 md:hidden">
            Geser tabel ke samping untuk melihat semua kolom.
          </div>
          <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-default-200/80 touch-pan-x" role="region" aria-label="Hasil scan" tabIndex={0}>
            <Table
              aria-label="Hasil pemindaian sesi Tuton"
              removeWrapper
              className="min-w-[880px] bg-content1"
              classNames={{
                th: "h-12 bg-slate-900 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-200 dark:bg-slate-800",
                td: "border-b border-default-100 px-4 py-3.5 text-foreground",
                tr: "last:[&>td]:border-b-0 data-[hover=true]:bg-primary/[0.035]",
              }}
            >
              <TableHeader>
                <TableColumn className="w-[90px]">Item ID</TableColumn>
                <TableColumn>Customer</TableColumn>
                <TableColumn>Mata kuliah</TableColumn>
                <TableColumn className="w-[120px]">Aktivitas</TableColumn>
                <TableColumn className="w-[80px]">Sesi</TableColumn>
                <TableColumn className="w-[130px]">Status</TableColumn>
                <TableColumn className="w-[110px]">Course ID</TableColumn>
              </TableHeader>
              <TableBody isLoading={scanLoading} emptyContent={scanLoading ? "Memuat hasil…" : "Belum ada hasil. Atur filter lalu pilih Pindai."}>
                {(scan?.rows ?? []).map((row: ScanRow) => (
                  <TableRow key={row.itemId}>
                    <TableCell><code className="rounded-md bg-default-100 px-2 py-1 text-xs">{row.itemId}</code></TableCell>
                    <TableCell>
                      <a className="font-semibold text-primary hover:underline" href={`/customers/${row.customerId}`}>{row.customerName}</a>
                    </TableCell>
                    <TableCell className="font-medium">{row.matkul}</TableCell>
                    <TableCell>{JENIS_LABEL[row.jenis]}</TableCell>
                    <TableCell>{row.sesi}</TableCell>
                    <TableCell>
                      <Chip size="sm" color={row.status === "BELUM" ? "warning" : "success"} variant="flat">
                        {row.status === "BELUM" ? "Belum selesai" : "Selesai"}
                      </Chip>
                    </TableCell>
                    <TableCell><code className="text-xs text-foreground-500">{row.courseId}</code></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {scan && Math.ceil(scan.meta.total / pageSize) > 1 && (
            <div className="mt-4 flex justify-center sm:justify-end">
              <Pagination
                showControls
                page={page}
                total={Math.max(1, Math.ceil(scan.meta.total / pageSize))}
                onChange={(nextPage) => {
                  setPage(nextPage);
                  const params: Record<string, string> = {
                    ...(matkul ? { matkul } : {}), jenis, sesi: String(sesi), status,
                    page: String(nextPage), pageSize: String(pageSize),
                  };
                  if (copas !== "SEMUA") params.copas = copas;
                  setSearchParams(params);
                }}
              />
            </div>
          )}
        </motion.div>
        </motion.div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-default-200/80 bg-content1 shadow-[0_12px_35px_rgba(15,23,42,.06)]">
        <motion.div
          variants={panelGroupVariants}
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
        >
        <motion.div variants={panelItemVariants} className="flex flex-col gap-4 border-b border-default-200/70 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Data akademik</p>
              <h2 className="mt-0.5 text-lg font-bold text-foreground">Daftar mata kuliah</h2>
            </div>
          </div>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 lg:flex lg:w-auto lg:items-center">
            <Input
              aria-label="Cari mata kuliah"
              placeholder="Cari mata kuliah…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void loadSubjects(); }}
              className="w-full lg:w-[280px]"
              startContent={<Search className="h-4 w-4 text-foreground-400" />}
              classNames={{ inputWrapper: "min-h-11 bg-default-50 shadow-none" }}
            />
            <Button color="primary" variant="flat" className="min-h-11 font-semibold" onPress={() => void loadSubjects()} isDisabled={loadingSubjects}>
              {loadingSubjects ? <Spinner size="sm" /> : "Cari"}
            </Button>
            <Select
              aria-label="Jumlah mata kuliah per halaman"
              selectedKeys={new Set([String(subjectPageSize)])}
              onSelectionChange={(keys) => {
                const nextSize = Number(Array.from(keys as Set<string>)[0] || SUBJECT_PAGE_SIZE_DEFAULT);
                setSubjectPageSize(nextSize);
                setSubjectPage(1);
              }}
              className="col-span-2 w-full lg:col-span-1 lg:w-[145px]"
            >
              {[10, 20, 50, 100].map((item) => <SelectItem key={String(item)}>{item} / halaman</SelectItem>)}
            </Select>
          </div>
        </motion.div>

        <motion.div variants={panelItemVariants} className="px-4 py-5 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <ResultRange total={subjects.length} page={subjectPage} pageSize={subjectPageSize} />
            <Chip size="sm" variant="flat" startContent={<BookOpenCheck className="h-3.5 w-3.5" />}>
              {subjects.length} mata kuliah
            </Chip>
          </div>
          <div className="mb-3 rounded-xl bg-primary/5 px-3 py-2 text-xs text-foreground-500 md:hidden">
            Geser tabel ke samping untuk melihat tindakan.
          </div>
          <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-default-200/80 touch-pan-x" role="region" aria-label="Daftar mata kuliah" tabIndex={0}>
            <Table
              aria-label="Daftar mata kuliah Tuton"
              removeWrapper
              className="min-w-[680px] bg-content1"
              classNames={{
                th: "h-12 bg-default-50 px-4 text-[11px] font-bold uppercase tracking-wider text-foreground-500",
                td: "border-b border-default-100 px-4 py-3.5 text-foreground",
                tr: "last:[&>td]:border-b-0 data-[hover=true]:bg-primary/[0.035]",
              }}
            >
              <TableHeader>
                <TableColumn>Mata kuliah</TableColumn>
                <TableColumn className="w-[130px] text-center">Total akun</TableColumn>
                <TableColumn className="w-[150px] text-center">Validasi</TableColumn>
                <TableColumn className="w-[170px] text-right">Tindakan</TableColumn>
              </TableHeader>
              <TableBody isLoading={loadingSubjects} emptyContent="Belum ada mata kuliah yang ditemukan.">
                {subjectsSlice.map((subject) => (
                  <TableRow key={subject.matkul}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BookOpenCheck className="h-4 w-4" /></span>
                        <span className="font-semibold">{subject.matkul}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Chip size="sm" variant="flat">{subject.totalCourses} akun</Chip></TableCell>
                    <TableCell className="text-center">
                      <Chip
                        size="sm"
                        color={subject.isConflict ? "warning" : "success"}
                        variant="flat"
                        startContent={subject.isConflict ? <AlertTriangle className="h-3.5 w-3.5" /> : undefined}
                      >
                        {subject.isConflict ? "Perlu dicek" : "Aman"}
                      </Chip>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        endContent={<ArrowRight className="h-4 w-4" />}
                        startContent={<Filter className="h-4 w-4" />}
                        onPress={() => handleQuickScan(subject.matkul)}
                        className="min-h-10 font-semibold"
                      >
                        Scan sesi
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {subjectTotalPages > 1 && (
            <div className="mt-4 flex justify-center sm:justify-end">
              <Pagination showControls page={subjectPage} total={subjectTotalPages} onChange={setSubjectPage} />
            </div>
          )}
        </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
