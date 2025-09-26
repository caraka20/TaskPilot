import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card, CardHeader, CardBody, Chip, Button, Input,
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Spinner, Tooltip, Progress, Select, SelectItem,
} from "@heroui/react";
import { Search, ListChecks, ClipboardCheck } from "lucide-react";
import {
  scanTuton,
  getCourseSummary,
  listItems,
  type ScanRow,
  type JenisTugas,
  type StatusTugas,
  type TutonItemResponse,
} from "../../services/tuton.service";

/* ========= Types kecil buat cache ========= */
type SummaryLite = {
  courseId: number;
  progress: number;
  absen:   { total: number; done: number };
  diskusi: { total: number; done: number; avg: number | null };
  tugas:   { total: number; done: number; avg: number | null };
};
type ItemIndex = { byKey: Record<string, TutonItemResponse | undefined> }; // key = `${jenis}-${sesi}`

/* ========= util cache Map ========= */
function useCacheMap<K, V>() {
  const mapRef = useRef<Map<K, V>>(new Map());
  return {
    get: (k: K) => mapRef.current.get(k),
    set: (k: K, v: V) => mapRef.current.set(k, v),
    has: (k: K) => mapRef.current.has(k),
  };
}

/* ========= helper tampil chip nilai avg ========= */
function AvgChip({ label, val, tone = "emerald" }: { label: string; val: number | null; tone?: "emerald" | "violet" }) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "bg-violet-500/10 text-violet-700 dark:text-violet-300";
  return (
    <Chip size="sm" variant="flat" className={toneCls}>
      {label} {val != null ? Math.round(val) : "—"}
    </Chip>
  );
}

/* ========= warna untuk skor & state ========= */
function scoreClass(score: number | null, done: boolean) {
  if (score != null) {
    if (score >= 80) return "bg-emerald-600 text-white";
    if (score >= 70) return "bg-amber-500 text-white";
    return "bg-rose-600 text-white";
  }
  // belum ada nilai
  return done
    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
    : "bg-default-200 text-foreground-700";
}

/* ========= grid kecil utk tooltip detail sesi (dengan nilai & warna) ========= */
function SesiGrid({ idx, jenis }: { idx?: ItemIndex; jenis: "DISKUSI" | "TUGAS" }) {
  if (!idx) return <div className="text-foreground-500 text-xs">Tidak ada data</div>;

  return (
    <div className="grid grid-cols-4 gap-1">
      {Array.from({ length: 8 }).map((_, i) => {
        const s = i + 1;
        const it = idx.byKey[`${jenis}-${s}`];
        const status = (it?.status || "").toString().toUpperCase();
        const done = status === "SELESAI";
        const nilai = (it && Number.isFinite(it.nilai as any)) ? Math.round(Number(it.nilai)) : null;
        const cls = scoreClass(nilai, done);

        return (
          <div
            key={s}
            className={[
              "px-2 py-1 rounded-md text-[11px] inline-flex items-center justify-center gap-1",
              "min-w-[40px]",
              cls,
            ].join(" ")}
            title={`${jenis} · S${s}${nilai != null ? ` · Nilai ${nilai}` : done ? " · Selesai" : " · Belum"}`}
          >
            S{s}
            {it?.copas ? "•" : null}
            <span className="ml-1">
              {nilai != null ? <span className="font-semibold tabular-nums">{nilai}</span> : (done ? "✓" : "—")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const DEFAULT_PAGE_SIZE = 10;

export default function TutonList() {
  /* ===== UI minimal ===== */
  const [q, setQ] = useState("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  /* ===== Data ===== */
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ScanRow[]>([]); // gabungan (client-side): unik per course/customer

  /* caches */
  const summaries = useCacheMap<number, SummaryLite>();
  const itemsIdx  = useCacheMap<number, ItemIndex>();

  /* ===== Loader aggregator =====
     Ambil SEMUA kombinasi (ABSEN/DISKUSI/TUGAS x Sesi 1..8 x Status BELUM/SELESAI),
     lalu di-unique per course agar halaman awal menampilkan semua peserta tuton.
  */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const jenisList: JenisTugas[]  = ["ABSEN", "DISKUSI", "TUGAS"];
      const sesiList                 = [1,2,3,4,5,6,7,8];
      const statusList: StatusTugas[] = ["BELUM", "SELESAI"];

      const bag: ScanRow[] = [];
      const backendPageSize = 200;

      for (const j of jenisList) {
        for (const s of sesiList) {
          for (const st of statusList) {
            let p = 1;
            // loop semua halaman
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const res = await scanTuton({
                matkul: undefined,
                jenis: j,
                sesi: s,
                status: st,
                page: p,
                pageSize: backendPageSize,
              });
              bag.push(...res.rows);
              if (!res.meta.hasNext) break;
              p += 1;
            }
          }
        }
      }

      // unik per courseId (menjadi "peserta tuton")
      const seen = new Set<number>();
      const uniq: ScanRow[] = [];
      for (const r of bag) {
        if (!seen.has(r.courseId)) {
          uniq.push(r);
          seen.add(r.courseId);
        }
      }
      setRows(uniq);

      // siapkan cache summary + index item utk setiap course
      const cids = Array.from(new Set(uniq.map((r) => r.courseId)));
      await Promise.allSettled(
        cids.map(async (cid) => {
          if (!summaries.has(cid)) {
            const s = await getCourseSummary(cid);
            summaries.set(cid, {
              courseId: s.courseId,
              progress: Math.round(s.progress ?? 0),
              absen:   { total: s.byJenis.ABSEN.total,   done: s.byJenis.ABSEN.done },
              diskusi: { total: s.byJenis.DISKUSI.total, done: s.byJenis.DISKUSI.done, avg: s.byJenis.DISKUSI.avgNilai },
              tugas:   { total: s.byJenis.TUGAS.total,   done: s.byJenis.TUGAS.done,   avg: s.byJenis.TUGAS.avgNilai },
            });
          }
          if (!itemsIdx.has(cid)) {
            const list = await listItems(cid);
            const map: Record<string, TutonItemResponse> = {};
            list.forEach((it) => { map[`${(it.jenis || "").toString().toUpperCase()}-${it.sesi}`] = it; });
            itemsIdx.set(cid, { byKey: map });
          }
        })
      );
    } finally {
      setLoading(false);
    }
  }, [summaries, itemsIdx]);

  /* initial load (SEMUA) */
  useEffect(() => { load(); }, []); // eslint-disable-line

  /* ======== Client-side search (nama/NIM) ======== */
  const filtered = useMemo(() => {
    const qlower = q.trim().toLowerCase();
    if (!qlower) return rows;
    return rows.filter((r) => {
      const nameHit = r.customerName.toLowerCase().includes(qlower);
      const nimMatch = r.customerName.match(/\b(\d{6,})\b/);
      const nimHit = nimMatch ? nimMatch[1].includes(qlower) : false;
      return nameHit || nimHit;
    });
  }, [rows, q]);

  /* ======== Paging client-side ======== */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSlice = useMemo(() => {
    const safe = Math.min(page, totalPages);
    if (safe !== page) setPage(safe);
    const start = (safe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize, totalPages]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border border-default-200 shadow-md overflow-hidden bg-content1">
        <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500" />

        {/* HEADER */}
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-content2 to-content1">
          <div className="flex items-center gap-3">
            <span className="h-9 w-[3px] rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]" />
            <div className="flex flex-col">
              <div className="text-[17px] sm:text-lg font-semibold tracking-tight">Daftar Tuton</div>
              <div className="text-[13px] sm:text-sm text-foreground-500">
                Semua peserta tuton: absen, diskusi, tugas, nilai & detail sesi (hover).
              </div>
            </div>
          </div>
          <Chip
            size="sm"
            variant="flat"
            className="border border-default-200 bg-content1 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
            startContent={<ListChecks className="h-3.5 w-3.5" />}
          >
            Total: <span className="ml-1 font-medium">{filtered.length}</span>
          </Chip>
        </CardHeader>

        <CardBody className="flex flex-col gap-4">
          {/* SEARCH + PER PAGE */}
          <Card className="border rounded-xl bg-content1">
            <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 to-indigo-500" />
            <CardBody className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <Input
                  aria-label="Cari nama / NIM"
                  label="Cari (nama/NIM)"
                  placeholder="mis. Anisa / 12345…"
                  labelPlacement="outside"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  startContent={<Search className="h-4 w-4 text-foreground-500" />}
                />
                <div className="md:col-span-3" />
                <div className="md:col-span-2 flex items-end justify-end gap-3">
                  <Select
                    aria-label="Per halaman"
                    label="Per halaman"
                    selectedKeys={new Set([String(pageSize)])}
                    onSelectionChange={(k) => {
                      const n = Number(Array.from(k as Set<string>)[0] || DEFAULT_PAGE_SIZE);
                      setPageSize(n);
                      setPage(1);
                    }}
                    className="w-[160px]"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem key={String(n)} textValue={String(n)}>{n} / halaman</SelectItem>
                    ))}
                  </Select>
                  <Button
                    variant="flat"
                    onPress={() => load()}
                    isDisabled={loading}
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white"
                  >
                    {loading ? <Spinner size="sm" /> : "Refresh"}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* TABLE (tanpa kolom Matkul & tanpa CourseID) */}
          <Table
            aria-label="Daftar Tuton (grouped per course)"
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
              <TableColumn>Customer</TableColumn>
              <TableColumn className="w-[150px] text-center">Absen</TableColumn>
              <TableColumn className="w-[200px] text-center">Diskusi</TableColumn>
              <TableColumn className="w-[200px] text-center">Tugas</TableColumn>
              <TableColumn className="w-[220px]">Progress</TableColumn>
              <TableColumn className="w-[220px]">Detail Sesi</TableColumn>
              <TableColumn className="w-[180px] text-center">Nilai</TableColumn>
            </TableHeader>
            <TableBody
              isLoading={loading}
              emptyContent={loading ? "Memuat…" : "Belum ada data."}
            >
              {pageSlice.map((r) => {
                const sum = summaries.get(r.courseId);
                const idx = itemsIdx.get(r.courseId);

                return (
                  <TableRow key={r.courseId}>
                    {/* Customer */}
                    <TableCell>
                      <div className="flex flex-col">
                        <a className="font-semibold text-primary hover:underline" href={`/customers/${r.customerId}`}>
                          {r.customerName}
                        </a>
                        {/* (CourseID disembunyikan sesuai permintaan) */}
                      </div>
                    </TableCell>

                    {/* Absen */}
                    <TableCell className="text-center">
                      {sum ? (
                        <Chip size="sm" variant="flat">
                          {sum.absen.total > 0 ? `${sum.absen.done}/${sum.absen.total}` : "—"}
                        </Chip>
                      ) : (
                        <span className="text-foreground-500">—</span>
                      )}
                    </TableCell>

                    {/* Diskusi */}
                    <TableCell className="text-center">
                      {sum ? (
                        <div className="inline-flex items-center gap-2">
                          <Chip size="sm" variant="flat">
                            {sum.diskusi.total > 0 ? `${sum.diskusi.done}/${sum.diskusi.total}` : "—"}
                          </Chip>
                          <AvgChip label="Avg" val={sum.diskusi.avg} tone="emerald" />
                        </div>
                      ) : (
                        <span className="text-foreground-500">—</span>
                      )}
                    </TableCell>

                    {/* Tugas */}
                    <TableCell className="text-center">
                      {sum ? (
                        <div className="inline-flex items-center gap-2">
                          <Chip size="sm" variant="flat">
                            {sum.tugas.total > 0 ? `${sum.tugas.done}/${sum.tugas.total}` : "—"}
                          </Chip>
                          <AvgChip label="Avg" val={sum.tugas.avg} tone="violet" />
                        </div>
                      ) : (
                        <span className="text-foreground-500">—</span>
                      )}
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      {sum ? (
                        sum.absen.total + sum.diskusi.total + sum.tugas.total > 0 ? (
                          <div className="flex items-center gap-3">
                            <Progress
                              aria-label="Progress"
                              value={sum.progress}
                              className="w-[140px]"
                              color={sum.progress >= 100 ? "success" : sum.progress > 0 ? "primary" : "default"}
                            />
                            <span className="text-sm text-foreground-600">{sum.progress}%</span>
                          </div>
                        ) : (
                          <span className="text-foreground-500">—</span>
                        )
                      ) : (
                        <span className="text-foreground-500">—</span>
                      )}
                    </TableCell>

                    {/* Detail Sesi (hover) */}
                    <TableCell>
                      <Tooltip
                        placement="top-start"
                        offset={8}
                        content={
                          <div className="space-y-2 p-1">
                            <div className="text-[12px] font-medium">Diskusi</div>
                            <SesiGrid idx={idx} jenis="DISKUSI" />
                            <div className="text-[12px] font-medium mt-2">Tugas</div>
                            <SesiGrid idx={idx} jenis="TUGAS" />
                            <div className="mt-2 text-[11px] text-foreground-500 flex items-center gap-1">
                              <ClipboardCheck className="h-3.5 w-3.5" /> Titik • pada kotak menandakan COPAS.
                            </div>
                          </div>
                        }
                      >
                        <div className="inline-flex items-center gap-2 rounded-xl border border-default-200 px-3 py-1.5 bg-content1 cursor-help text-foreground-600">
                          <span className="text-sm">Hover: detail Diskusi & Tugas</span>
                        </div>
                      </Tooltip>
                    </TableCell>

                    {/* Nilai ringkas */}
                    <TableCell className="text-center">
                      {sum ? (
                        <div className="inline-flex items-center gap-2">
                          <AvgChip label="D" val={sum.diskusi.avg} tone="emerald" />
                          <AvgChip label="T" val={sum.tugas.avg}   tone="violet" />
                        </div>
                      ) : (
                        <span className="text-foreground-500">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Paging */}
          {totalPages > 1 && (
            <div className="mt-3 flex justify-end">
              <Pagination
                showControls
                page={page}
                total={totalPages}
                onChange={(p) => setPage(p)}
                classNames={{ cursor: "bg-gradient-to-r from-sky-500 to-indigo-500 text-white" }}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}