import React from "react";
import { Chip, Tooltip } from "@heroui/react";
import { Info } from "lucide-react";
import type { PublicCustomerSelfViewResponse } from "../../../services/publicTuton.service";

// ===== Helpers =====
type Course = PublicCustomerSelfViewResponse["courses"][number];
type Jenis = "DISKUSI" | "TUGAS" | "ABSEN";

const SESSIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const TUGAS_SESI = new Set([3, 5, 7]);

function findItem(c: Course, jenis: Jenis, sesi: number) {
  return c.items[jenis].find((x) => x.sesi === sesi);
}

function Pill({
  label,
  variant = "default",
  children,
}: {
  label?: string;
  variant?: "default" | "success" | "muted" | "warn";
  children?: React.ReactNode;
}) {
  const cls =
    variant === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : variant === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : variant === "muted"
      ? "bg-default-100 text-foreground-600 border-default-200"
      : "bg-content2 text-foreground border-default-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] ${cls}`}>
      {label}
      {children}
    </span>
  );
}

function Nilai({ nilai }: { nilai?: number | null }) {
  if (nilai == null) return null;
  const good = nilai >= 80;
  const ok = nilai >= 60 && nilai < 80;
  const cls = good
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : ok
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] ${cls}`}>
      {nilai}
    </span>
  );
}

function StatusBadge({
  status,
  proses,
  nilai,
  label,
}: {
  status?: string;
  proses?: boolean;
  nilai?: number | null;
  label: "Diskusi" | "Tugas";
}) {
  const done = status === "SELESAI";
  return (
    <div className="flex items-center gap-1.5">
      <Pill label={label} variant={done ? "success" : "muted"} />
      {proses && <Pill label="proses" variant="warn" />}
      <Nilai nilai={nilai ?? null} />
    </div>
  );
}

function AbsenBadge({ status }: { status?: string }) {
  const done = status === "SELESAI";
  return <Pill label={`Absen${done ? " ✓" : ""}`} variant={done ? "success" : "muted"} />;
}

// ===== Table =====
export default function PublicSessionTable({
  courses,
  showScores = true,
}: {
  courses: Course[];
  showScores?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-default-200 overflow-hidden bg-content1">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-default-200">
        <div className="text-lg font-semibold">Tuton Matrix (per Akun)</div>
        <Chip size="sm" variant="flat" className="bg-default-100">
          {courses.length} matkul
        </Chip>
      </div>

      {/* Table head */}
      <div className="grid"
           style={{ gridTemplateColumns: `minmax(160px,1.1fr) repeat(${SESSIONS.length}, minmax(110px, 1fr))` }}
      >
        <div className="sticky left-0 z-[1] bg-primary-600/95 text-white font-semibold px-4 py-3">MATKUL</div>
        {SESSIONS.map((s) => (
          <div key={s} className="bg-primary-600/95 text-white px-3 py-3 font-semibold">
            <div className="flex items-center justify-between">
              <span>
                {s === 3 ? "D3 & T1" : s === 5 ? "D5 & T2" : s === 7 ? "D7 & T3" : `D${s}`}
              </span>
              <Tooltip content="Status Absen pada sesi ini">
                <Info className="h-3.5 w-3.5 opacity-80" />
              </Tooltip>
            </div>
            <div className="mt-1">
              <Pill label="Absen" variant="muted" />
            </div>
          </div>
        ))}

        {/* Table body */}
        {courses.map((c) => (
          <React.Fragment key={c.courseId}>
            {/* first column: matkul */}
            <div className="sticky left-0 z-[1] bg-content1 border-t border-default-200 px-4 py-3 font-medium capitalize">
              {c.matkul}
            </div>

            {/* session cells */}
            {SESSIONS.map((s) => {
              const d = findItem(c, "DISKUSI", s);
              const a = findItem(c, "ABSEN", s);
              const t = TUGAS_SESI.has(s) ? findItem(c, "TUGAS", s === 3 ? 1 : s === 5 ? 2 : 3) : undefined;

              const prosesDiskusi = d && d.copasSoal && d.status !== "SELESAI";
              const prosesTugas = t && t.copasSoal && t.status !== "SELESAI";

              return (
                <div key={s} className="border-t border-default-200 px-3 py-2">
                  <div className="flex flex-col gap-1.5">
                    {/* Absen */}
                    <AbsenBadge status={a?.status} />

                    {/* Diskusi */}
                    <StatusBadge
                      status={d?.status}
                      proses={!!prosesDiskusi}
                      nilai={showScores ? d?.nilai ?? null : null}
                      label="Diskusi"
                    />

                    {/* Tugas (hanya 3/5/7) */}
                    {TUGAS_SESI.has(s) && (
                      <StatusBadge
                        status={t?.status}
                        proses={!!prosesTugas}
                        nilai={showScores ? (t?.nilai ?? null) : null}
                        label="Tugas"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Print polish */}
      <style>{`
        @media (max-width: 900px) {
          /* horizontal scroll on small screens */
          .public-matrix-scroll { overflow: auto; }
        }
        @media print {
          .heroui-chip { border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  );
}
