// client/src/pages/tuton/Subjects.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Card, CardBody, CardHeader,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Chip, Button, Input, Select, SelectItem, Pagination, Spinner, Divider,
} from "@heroui/react";
import { useSearchParams } from "react-router-dom";
import {
  listSubjects, scanTuton,
  type SubjectEntry, type ScanResponse, type ScanRow,
  type JenisTugas, type StatusTugas,
} from "../../services/tuton.service";
import { Filter, Search } from "lucide-react";

const JENIS_OPTIONS: JenisTugas[] = ["ABSEN", "DISKUSI", "TUGAS"];
const STATUS_OPTIONS: StatusTugas[] = ["BELUM", "SELESAI"];
const DEFAULT_PAGE_SIZE = 10;
const SUBJECT_PAGE_SIZE_DEFAULT = 10;

export default function TutonSubjects() {
  const [searchParams, setSearchParams] = useSearchParams();

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
    const pSesi = Number(searchParams.get("sesi") || 1);
    const pStatus = (searchParams.get("status") as StatusTugas) || "BELUM";
    const pPage = Number(searchParams.get("page") || 1);
    const pPageSize = Number(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE);

    setMatkul(pMatkul);
    setJenis(pJenis);
    setSesi(pSesi);
    setStatus(pStatus);
    setPage(pPage);
    setPageSize(pPageSize);

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
        });
        setScan(data);
      } finally {
        setScanLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSearchParams(params);
  };

  // quick scan from a subject row
  const handleQuickScan = (subjectMatkul: string) => {
    setSearchParams({
      matkul: subjectMatkul,
      jenis,
      sesi: String(sesi),
      status,
      page: "1",
      pageSize: String(pageSize),
    });
  };

  // reset filters
  const resetFilters = () => {
    setMatkul("");
    setJenis("DISKUSI");
    setSesi(1);
    setStatus("BELUM");
    setPage(1);
    setPageSize(DEFAULT_PAGE_SIZE);
    setSearchParams({ jenis: "DISKUSI", sesi: "1", status: "BELUM", page: "1", pageSize: String(DEFAULT_PAGE_SIZE) });
  };

  return (
    <div className="mx-auto">
      {/* ===== TITLE CARD (tanpa BackButton) ===== */}
      <Card className="rounded-2xl border border-default-200 shadow-md overflow-hidden bg-content1">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-600" />
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold">Tuton Subjects &amp; Scan</div>
          </div>
          {/* Kita pindahkan pencarian ke card "Daftar Matkul" agar lebih kontekstual */}
        </CardHeader>

        <CardBody className="flex flex-col gap-6">
          {/* ===== SCAN PANEL — dipindah ke ATAS ===== */}
          <Card className="border rounded-xl bg-content1">
            <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 to-indigo-500" />
            <CardHeader className="flex items-center justify-between">
              <div className="font-medium">Scan &amp; Filter</div>
              {scan && (
                <div className="flex flex-wrap items-center gap-2">
                  {matkul && <Chip size="sm" variant="flat" className="bg-content2">{matkul}</Chip>}
                  <Chip size="sm" variant="flat" className="bg-content2">{jenis}</Chip>
                  <Chip size="sm" variant="flat" className="bg-content2">Sesi {sesi}</Chip>
                  <Chip
                    size="sm"
                    color={status === "BELUM" ? "warning" : "success"}
                    variant="flat"
                  >
                    {status}
                  </Chip>
                </div>
              )}
            </CardHeader>

            <CardBody className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input
                  aria-label="Matkul"
                  label="Matkul (opsional)"
                  placeholder="mis. Akuntansi"
                  labelPlacement="outside"
                  value={matkul}
                  onChange={(e) => setMatkul(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") applyFiltersToQuery({ resetPage: true }); }}
                />
                <Select
                  label="Jenis"
                  selectedKeys={new Set([jenis])}
                  onSelectionChange={(k) => setJenis(Array.from(k as Set<string>)[0] as JenisTugas)}
                  labelPlacement="outside"
                >
                  {JENIS_OPTIONS.map((j) => (
                    <SelectItem key={j} textValue={j}>{j}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Sesi"
                  selectedKeys={new Set([String(sesi)])}
                  onSelectionChange={(k) => setSesi(Number(Array.from(k as Set<string>)[0] || 1))}
                  labelPlacement="outside"
                >
                  {Array.from({ length: 8 }).map((_, idx) => {
                    const n = idx + 1;
                    return (
                      <SelectItem key={String(n)} textValue={`Sesi ${n}`}>
                        Sesi {n}
                      </SelectItem>
                    );
                  })}
                </Select>
                <Select
                  label="Status"
                  selectedKeys={new Set([status])}
                  onSelectionChange={(k) => setStatus(Array.from(k as Set<string>)[0] as StatusTugas)}
                  labelPlacement="outside"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} textValue={s}>{s}</SelectItem>
                  ))}
                </Select>
                <div className="flex items-end gap-2">
                  <Button
                    variant="flat"
                    onPress={() => applyFiltersToQuery({ resetPage: true })}
                    isDisabled={scanLoading}
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
                  >
                    {scanLoading ? <Spinner size="sm" /> : "Scan"}
                  </Button>
                  <Button variant="light" onPress={resetFilters}>Reset</Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  aria-label="Per halaman (scan)"
                  label="Per halaman"
                  selectedKeys={new Set([String(pageSize)])}
                  onSelectionChange={(k) => {
                    const n = Number(Array.from(k as Set<string>)[0] || DEFAULT_PAGE_SIZE);
                    setPageSize(n);
                    setSearchParams({
                      ...(matkul ? { matkul } : {}),
                      jenis,
                      sesi: String(sesi),
                      status,
                      page: "1",
                      pageSize: String(n),
                    });
                  }}
                  className="w-[160px]"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={String(n)} textValue={String(n)}>
                      {n} / halaman
                    </SelectItem>
                  ))}
                </Select>
                {scan && <ResultRange total={scan.meta.total} page={page} pageSize={pageSize} />}
              </div>

              <Table
                aria-label="scan result"
                removeWrapper
                isStriped
                className="rounded-xl border border-default-200 bg-content1"
                classNames={{
                  th: "bg-content2 text-foreground-500 font-semibold",
                  td: "text-foreground",
                  tr: "data-[hover=true]:bg-default-50 dark:data-[hover=true]:bg-content2",
                  tbody: "bg-transparent",
                }}
              >
                <TableHeader>
                  <TableColumn className="w-[80px]">ItemID</TableColumn>
                  <TableColumn>Customer</TableColumn>
                  <TableColumn>Matkul</TableColumn>
                  <TableColumn className="w-[110px]">Jenis</TableColumn>
                  <TableColumn className="w-[90px]">Sesi</TableColumn>
                  <TableColumn className="w-[120px]">Status</TableColumn>
                  <TableColumn className="w-[110px]">CourseId</TableColumn>
                </TableHeader>
                <TableBody
                  isLoading={scanLoading}
                  emptyContent={scanLoading ? "Memuat…" : "Belum ada hasil. Gunakan tombol Scan."}
                >
                  {(scan?.rows ?? []).map((r: ScanRow) => (
                    <TableRow key={r.itemId}>
                      <TableCell><code>{r.itemId}</code></TableCell>
                      <TableCell>
                        <a className="text-primary hover:underline" href={`/customers/${r.customerId}`}>
                          {r.customerName}
                        </a>
                      </TableCell>
                      <TableCell>{r.matkul}</TableCell>
                      <TableCell>{r.jenis}</TableCell>
                      <TableCell>{r.sesi}</TableCell>
                      <TableCell>
                        <Chip size="sm" color={r.status === "BELUM" ? "warning" : "success"} variant="flat">
                          {r.status}
                        </Chip>
                      </TableCell>
                      <TableCell><code>{r.courseId}</code></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {scan && (
                <div className="mt-3 flex justify-end">
                  <Pagination
                    showControls
                    page={page}
                    total={Math.max(1, Math.ceil(scan.meta.total / pageSize))}
                    onChange={(p) => {
                      setPage(p);
                      setSearchParams({
                        ...(matkul ? { matkul } : {}),
                        jenis,
                        sesi: String(sesi),
                        status,
                        page: String(p),
                        pageSize: String(pageSize),
                      });
                    }}
                    classNames={{ cursor: "bg-gradient-to-r from-sky-500 to-indigo-500 text-white" }}
                  />
                </div>
              )}
            </CardBody>
          </Card>

          <Divider />

          {/* ===== SUBJECT LIST — kini di bawah ===== */}
          <Card className="border rounded-xl bg-content1">
            <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-600" />
            <CardHeader className="flex items-center justify-between">
              <div className="font-medium">Daftar Matkul</div>
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Cari matkul"
                  size="sm"
                  placeholder="Cari matkul…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") loadSubjects(); }}
                  className="w-[240px]"
                  startContent={<Search className="h-4 w-4 text-foreground-500" />}
                />
                <Button size="sm" variant="flat" onPress={loadSubjects} isDisabled={loadingSubjects}>
                  {loadingSubjects ? <Spinner size="sm" /> : "Cari"}
                </Button>

                <Select
                  aria-label="Per halaman (subjects)"
                  selectedKeys={new Set([String(subjectPageSize)])}
                  onSelectionChange={(k) => {
                    const n = Number(Array.from(k as Set<string>)[0] || SUBJECT_PAGE_SIZE_DEFAULT);
                    setSubjectPageSize(n);
                    setSubjectPage(1);
                  }}
                  className="w-[140px]"
                  size="sm"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={String(n)} textValue={String(n)}>
                      {n} / halaman
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </CardHeader>

            <CardBody className="pt-0">
              <Table
                aria-label="subjects"
                removeWrapper
                isStriped
                className="rounded-xl border border-default-200 bg-content1"
                classNames={{
                  th: "bg-content2 text-foreground-500 font-semibold",
                  td: "text-foreground",
                  tr: "data-[hover=true]:bg-default-50 dark:data-[hover=true]:bg-content2",
                  tbody: "bg-transparent",
                }}
              >
                <TableHeader>
                  <TableColumn>Matkul</TableColumn>
                  <TableColumn className="w-[120px] text-center">Total</TableColumn>
                  <TableColumn className="w-[140px] text-center">Conflict</TableColumn>
                  <TableColumn className="w-[200px] text-right">Aksi</TableColumn>
                </TableHeader>
                <TableBody isLoading={loadingSubjects} emptyContent="Belum ada matkul.">
                  {subjectsSlice.map((s) => (
                    <TableRow key={s.matkul}>
                      <TableCell className="font-medium">{s.matkul}</TableCell>
                      <TableCell className="text-center">
                        <Chip size="sm" variant="flat" className="bg-content2">{s.totalCourses}</Chip>
                      </TableCell>
                      <TableCell className="text-center">
                        <Chip size="sm" color={s.isConflict ? "warning" : "default"} variant="flat">
                          {s.isConflict ? "Ya" : "Tidak"}
                        </Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            startContent={<Filter className="h-4 w-4" />}
                            onPress={() => handleQuickScan(s.matkul)}
                            className="bg-default-100 dark:bg-content2"
                          >
                            Scan sesi
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-3 flex items-center justify-between">
                <ResultRange total={subjects.length} page={subjectPage} pageSize={subjectPageSize} />
                {subjectTotalPages > 1 && (
                  <Pagination
                    showControls
                    page={subjectPage}
                    total={subjectTotalPages}
                    onChange={setSubjectPage}
                    classNames={{ cursor: "bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-600 text-white" }}
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </CardBody>
      </Card>
    </div>
  );
}
