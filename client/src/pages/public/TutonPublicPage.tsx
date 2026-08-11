// client/src/pages/public/TutonPublicPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card, CardBody, CardHeader, Input, Button, Chip, Progress, Tooltip, Switch,
} from "@heroui/react";
import { Printer, Search, Sparkles } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { getPublicTutonByNim, type PublicCustomerSelfViewResponse } from "../../services/publicTuton.service";

/* ============== Helpers ============== */
const CANONICAL_SESSIONS = {
  DISKUSI: new Set([1, 2, 4, 6, 8]),
  TUGAS: new Set([3, 5, 7]),
  ABSEN: new Set([1, 2, 3, 4, 5, 6, 7, 8]),
} as const;

function toPct01(x?: number | null) {
  if (x == null) return 0;
  if (x < 0) return 0;
  if (x > 1 && x <= 100) return Math.round(x);
  return Math.round(x * 100);
}

/** Chip status/score — compact di mobile, lega di desktop, lebar tetap + padding kanan lebih tebal */
function StatusOrScoreChip({
  nilai, status, copasSoal, className = "",
}: {
  nilai?: number | null;
  status?: string;
  copasSoal?: boolean;
  className?: string;
}) {
  const base =
    "h-7 min-w-[64px] justify-center rounded-lg border px-2 text-center text-xs tabular-nums";

  if (typeof nilai === "number") {
    const cls =
      nilai >= 80
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : nilai >= 60
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";
    return <Chip size="sm" variant="flat" className={`${base} ${cls} ${className}`}>{nilai}</Chip>;
  }
  if (status === "SELESAI") {
    return <Chip size="sm" variant="flat" className={`${base} bg-success-50 text-success-700 border-success-200 ${className}`}>Done</Chip>;
  }
  if (copasSoal) {
    return <Chip size="sm" variant="flat" className={`${base} bg-amber-50 text-amber-700 border-amber-200 ${className}`}>Proses</Chip>;
  }
  return <Chip size="sm" variant="flat" className={`${base} bg-default-100 text-foreground-600 border-default-200 ${className}`}>Belum</Chip>;
}

/* ============== Page ============== */
export default function TutonPublicPage() {
  const api = useApi();
  const [sp, setSp] = useSearchParams();

  const [nim, setNim] = useState(sp.get("nim") ?? "");
  const [data, setData] = useState<PublicCustomerSelfViewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showScores, setShowScores] = useState(true);

  const load = useCallback(async (n: string) => {
    setErr(null);
    setLoading(true);
    try {
      const d = await getPublicTutonByNim(api, n);
      setData(d);
    } catch (e: any) {
      setData(null);
      setErr(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const q = sp.get("nim")?.trim() ?? "";
    setNim(q);
    if (q) {
      void load(q);
    } else {
      setData(null);
      setErr(null);
    }
  }, [sp, load]);

  const onSearch = () => {
    const n = nim.trim();
    setSp(n ? { nim: n } : {});
  };

  const headerChips = useMemo(() => {
    if (!data) return null;
    const chipBase = "h-7 rounded-lg px-2 text-xs";
    return (
      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
        <Chip size="sm" variant="flat" className={`bg-content2 text-foreground ${chipBase}`}>{data.jurusan || "—"}</Chip>
        <Chip size="sm" variant="flat" className={`bg-content2 text-foreground ${chipBase}`}>{data.jenis || "—"}</Chip>
        <Chip size="sm" variant="flat" color="primary" className={`shadow-sm ${chipBase}`}>{data.totalCourses} matkul</Chip>
        <Chip size="sm" variant="flat" color="success" className={`shadow-sm ${chipBase}`}>{toPct01(data.overallProgress)}% selesai</Chip>
      </div>
    );
  }, [data]);

  return (
    <main className="mx-auto max-w-[1400px] p-3 sm:p-5 lg:p-6 print:max-w-full print:p-0">
      <Card className="overflow-hidden rounded-3xl border border-default-200 shadow-sm print:shadow-none">
        <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />

        {/* Header compact → upscale di desktop */}
        <CardHeader className="p-3 print:hidden sm:p-5 lg:p-6">
          <div
            className="
              w-full rounded-xl border border-default-200
              bg-[radial-gradient(900px_160px_at_20%_-60%,rgba(56,189,248,.16),transparent),radial-gradient(700px_160px_at_80%_-55%,rgba(167,139,250,.18),transparent)]
              relative overflow-hidden px-4 py-4 sm:px-5 lg:px-6 lg:py-5
            "
          >
            <div className="pointer-events-none absolute inset-x-0 -top-px h-[2px] bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400" />

            <div className="grid grid-cols-1 gap-2 md:flex md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent dark:from-sky-400 dark:to-indigo-400">
                      Laporan Tuton
                    </span>
                  </h1>
                </div>
                {data && <div className="mt-1 md:mt-3">{headerChips}</div>}
              </div>

              <div>
                <div className="flex flex-col gap-1.5 md:items-end">
                  <div className="flex w-full gap-1.5 md:gap-2">
                    <Input
                      size="sm"
                      label="Cari NIM"
                      placeholder="mis. PUB-xxxx"
                      value={nim}
                      onValueChange={setNim}
                      onKeyDown={(e) => e.key === "Enter" && onSearch()}
                      variant="bordered"
                      className="w-full md:w-[240px]"
                      classNames={{ inputWrapper: "min-h-11" }}
                    />
                    <Button
                      size="sm"
                      color="primary"
                      onPress={onSearch}
                      isLoading={loading}
                      startContent={<Search className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                      className="min-h-11 shrink-0 rounded-xl px-4 text-sm"
                    >
                      Tampilkan
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5 md:gap-2 justify-between md:justify-end">
                    <Switch isSelected={showScores} onValueChange={setShowScores} size="sm">
                      <span className="text-sm">Tampilkan nilai</span>
                    </Switch>
                    <Tooltip content="Cetak isi laporan (header disembunyikan)">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<Printer className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                        onPress={() => window.print()}
                        className="min-h-11 rounded-xl px-4 text-sm"
                      >
                        Cetak
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="px-4 pb-5 pt-0 sm:px-6 sm:pb-6">
          <div id="printable">
            {err && (
              <div role="alert" className="mb-4 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {err}
              </div>
            )}

            {!data && !loading && (
              <div className="rounded-2xl border border-dashed border-default-300 p-6 text-center text-sm text-foreground-500 print:hidden">
                Masukkan NIM, lalu klik <b>Tampilkan</b>.
              </div>
            )}
            {loading && <div aria-live="polite" className="rounded-2xl bg-content2 p-6 text-center text-sm text-foreground-500 print:hidden">Memuat laporan…</div>}

            {data && !loading && (
              <>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">{data.namaCustomer}</h2>
                    <p className="mt-1 text-sm text-foreground-500">NIM: {data.nim}</p>
                  </div>
                  <div className="hidden print:block text-[11px] text-foreground-500">
                    {toPct01(data.overallProgress)}% selesai • {data.totalCourses} matkul
                  </div>
                  <div className="print:hidden">{headerChips}</div>
                </div>

                {data.courses.length === 0 ? (
                  <div className="mt-2 rounded-xl border border-dashed border-default-200 p-3 md:p-4 text-[12px] md:text-[13px] text-foreground-500">
                    Belum ada matkul.
                  </div>
                ) : (
                  <div
                    className="
                      mt-2 grid gap-2.5 sm:gap-3.5 lg:gap-5
                      [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]
                      md:[grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]
                      xl:[grid-template-columns:repeat(auto-fit,minmax(380px,1fr))]
                      print:[grid-template-columns:1fr]
                    "
                  >
                    {data.courses.map((c) => {
                      const pct = toPct01(c.progress);

                      // rata-rata nilai (hanya item yang punya nilai)
                      const nilaiList: number[] = [];
                      c.items.DISKUSI.forEach((i) => {
                        if (CANONICAL_SESSIONS.DISKUSI.has(i.sesi) && typeof i.nilai === "number") nilaiList.push(i.nilai);
                      });
                      c.items.TUGAS.forEach((i) => {
                        if (CANONICAL_SESSIONS.TUGAS.has(i.sesi) && typeof i.nilai === "number") nilaiList.push(i.nilai);
                      });
                      const avg = nilaiList.length ? Math.round(nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length) : null;

                      return (
                        <div
                          key={c.courseId}
                          className="rounded-2xl border border-default-200 bg-content1 p-4 shadow-sm sm:p-5 print:break-inside-avoid"
                        >
                          <div className="flex items-start justify-between gap-2 md:gap-3">
                            <div className="min-w-0">
                              <div className="line-clamp-2 text-base font-semibold capitalize">
                                {c.matkul}
                              </div>
                              <div className="mt-1 text-sm text-foreground-500">
                                {c.completedItems}/{c.totalItems} selesai
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                              {avg != null && showScores && (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 print:hidden
                                             h-7 rounded-lg px-2 text-xs"
                                  startContent={<Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5" />}
                                >
                                  Rata-rata {avg}
                                </Chip>
                              )}
                              <Chip
                                size="sm"
                                variant="flat"
                                className="h-7 min-w-[64px] justify-center rounded-lg px-2 text-xs"
                              >
                                {pct}%
                              </Chip>
                            </div>
                          </div>

                          <div className="mt-1.5 md:mt-2">
                            <Progress
                              aria-label="progress"
                              value={pct}
                              classNames={{ indicator: "h-[4px] md:h-[6px]" }}
                            />
                          </div>

                          {/* 3 kolom — compact → lega di desktop */}
                          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 md:mt-3 md:gap-3">
                            {(["DISKUSI","TUGAS","ABSEN"] as const).map((k) => (
                              <section key={k} className="rounded-xl border border-default-200 bg-content2/40 p-3">
                                <h3 className="mb-2 text-xs font-semibold tracking-wide text-foreground-600">{k}</h3>

                                <div className="grid grid-cols-1 gap-1 md:gap-1.5">
                                  {c.items[k]
                                    .filter((it) => CANONICAL_SESSIONS[k].has(it.sesi))
                                    .sort((a, b) => a.sesi - b.sesi)
                                    .map((it) => {
                                    // ABSEN: jika SELESAI → tampilkan nilai 100 (override tampilan)
                                    const displayNilai = !showScores
                                      ? null
                                      : k === "ABSEN" && it.status === "SELESAI"
                                      ? 100
                                      : (it.nilai ?? null);

                                    return (
                                      <div
                                        key={`${k}-${it.sesi}`}
                                        className="
                                          flex items-center gap-1.5 md:gap-2
                                          min-h-10 rounded-lg border border-default-200 bg-content1
                                          px-2 py-1.5
                                        "
                                      >
                                        {/* angka sesi */}
                                        <span className="w-6 text-center text-xs tabular-nums text-foreground-600">
                                          {it.sesi}
                                        </span>
                                        <StatusOrScoreChip
                                          nilai={displayNilai}
                                          status={it.status as any}
                                          copasSoal={it.copasSoal}
                                        />
                                      </div>
                                    );
                                  })}
                                  {c.items[k].filter((it) => CANONICAL_SESSIONS[k].has(it.sesi)).length === 0 && (
                                    <div className="text-xs text-foreground-500">Tidak ada item.</div>
                                  )}
                                </div>
                              </section>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable, #printable * { visibility: visible !important; }
          #printable { position: relative !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .shadow-sm, .shadow, .shadow-md { box-shadow: none !important; }
          .border-default-200 { border-color: #ddd !important; }
          .heroui-progress .heroui-progress-indicator { height: 4px !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </main>
  );
}
