// client/src/pages/tuton/components/matrix/SessionsCell.tsx
import { useEffect, useState } from "react";
import type { TutonItemResponse } from "../../../../services/tuton.service";
import { isDiskusi as isDiskusiSesi, isTugas as isTugasSesi } from "./constants";
import CopasDot from "./CopasDot";
import DTScore from "../DTScore";

export type SessionsCellProps = {
  sesi: number;
  diskusi?: TutonItemResponse;
  tugas?: TutonItemResponse;
  isCopasDiskusi?: boolean;
  isCopasTugas?: boolean;
  toggleCopasDiskusi?: () => void;
  toggleCopasTugas?: () => void;
  markDirty: (it?: TutonItemResponse) => void;
  compact?: boolean;
};

/**
 * Warna tombol berdasarkan skor/status
 * - Light: 300s utk skor (teks hitam), 600 utk DONE (teks putih), default-200 utk belum selesai.
 * - Dark : 500s utk skor (teks putih), 600 utk DONE (teks putih), content2 utk belum selesai.
 */
function bgByScore(score: number | null, done: boolean) {
  if (score != null) {
    if (score >= 80) {
      return "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:ring-emerald-400/25";
    }
    if (score >= 70) {
      return "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/25";
    }
    return "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-400/15 dark:text-rose-200 dark:ring-rose-400/25";
  }
  return done
    ? "bg-emerald-600 text-white ring-emerald-600 dark:bg-emerald-500 dark:ring-emerald-400"
    : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700";
}

export default function SessionsCell({
  sesi,
  diskusi,
  tugas,
  isCopasDiskusi = false,
  isCopasTugas = false,
  toggleCopasDiskusi,
  toggleCopasTugas,
  markDirty,
  compact = true,
}: SessionsCellProps) {
  const SIZE_SCORED = compact ? "h-9 md:h-8" : "h-10";
  const SIZE_DEFAULT = compact ? "h-9 md:h-8" : "h-9";
  const WIDTH_DEFAULT = "w-10 md:w-11";

  const showDiskusi = isDiskusiSesi(sesi);
  const showTugas = isTugasSesi(sesi);
  const norm = (v: any) => String(v ?? "").trim().toUpperCase();
  const diskusiDone = !!diskusi && (norm(diskusi.status) === "SELESAI" || !!diskusi.selesaiAt);
  const tugasDone   = !!tugas   && (norm(tugas.status)   === "SELESAI" || !!tugas.selesaiAt);

  const [dScoreLocal, setDScoreLocal] = useState<number | null>(
    diskusi && Number.isFinite(diskusi.nilai as any) ? Math.round(Number(diskusi.nilai)) : null
  );
  const [tScoreLocal, setTScoreLocal] = useState<number | null>(
    tugas && Number.isFinite(tugas.nilai as any) ? Math.round(Number(tugas.nilai)) : null
  );

  useEffect(() => {
    setDScoreLocal(diskusi && Number.isFinite(diskusi.nilai as any) ? Math.round(Number(diskusi.nilai)) : null);
  }, [diskusi]);
  useEffect(() => {
    setTScoreLocal(tugas && Number.isFinite(tugas.nilai as any) ? Math.round(Number(tugas.nilai)) : null);
  }, [tugas]);

  const [editingDiskusi, setEditingDiskusi] = useState(false);
  const [editingTugas,   setEditingTugas]   = useState(false);

  const Inner = ({ children }: { children: React.ReactNode }) => (
    <span className="w-full inline-flex items-center justify-center text-center leading-none">
      {children}
    </span>
  );

  const baseBtn =
    "relative inline-flex select-none items-center justify-center text-[12px] " +
    "rounded-[11px] ring-1 ring-inset " +
    "shadow-[0_5px_12px_-10px_rgba(15,23,42,.9)] transition-all focus:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400 " +
    "hover:-translate-y-px hover:brightness-95";

  return (
    <div className="flex items-center justify-center gap-2">
      {/* DISKUSI */}
      {showDiskusi ? <div className="relative">
        <button
          type="button"
          title={`Diskusi sesi ${sesi}`}
          onClick={(e) => {
            if (!diskusi || editingDiskusi) { e.stopPropagation(); return; }
            markDirty(diskusi);
          }}
          onMouseDownCapture={(e) => {
            if (editingDiskusi) { e.stopPropagation(); e.preventDefault(); }
          }}
          className={[
            baseBtn,
            dScoreLocal != null ? SIZE_SCORED : SIZE_DEFAULT,
            WIDTH_DEFAULT,
            bgByScore(dScoreLocal, !!diskusiDone),
            !diskusi && "opacity-50 pointer-events-none",
            dScoreLocal != null ? "font-extrabold tabular-nums" : "font-semibold",
          ].join(" ")}
          disabled={!diskusi}
        >
          {diskusi ? (
            <Inner>
              <DTScore
                itemId={diskusi.id}
                jenis="DISKUSI"
                status={diskusi.status as any}
                nilai={dScoreLocal}
                mark="D"
                onSavedValue={setDScoreLocal}
                onOpenChange={setEditingDiskusi}
                expandTrigger
                className={dScoreLocal != null ? "text-[15px] md:text-[16px] tracking-tight" : ""}
              />
            </Inner>
          ) : (
            <Inner><span>D</span></Inner>
          )}
        </button>

        {diskusi && (
          <CopasDot
            active={isCopasDiskusi}
            onClick={toggleCopasDiskusi}
            title={`Tandai COPAS Diskusi sesi ${sesi}`}
          />
        )}
      </div> : null}

      {/* TUGAS */}
      {showTugas ? (
        <div className="relative">
          <button
            type="button"
            title={`Tugas sesi ${sesi}`}
            onClick={(e) => {
              if (!tugas || editingTugas) { e.stopPropagation(); return; }
              markDirty(tugas);
            }}
            onMouseDownCapture={(e) => {
              if (editingTugas) { e.stopPropagation(); e.preventDefault(); }
            }}
            className={[
              baseBtn,
              tScoreLocal != null ? SIZE_SCORED : SIZE_DEFAULT,
              WIDTH_DEFAULT,
              bgByScore(tScoreLocal, !!tugasDone),
              !tugas && "opacity-50 pointer-events-none",
              tScoreLocal != null ? "font-extrabold tabular-nums" : "font-semibold",
            ].join(" ")}
            disabled={!tugas}
          >
            {tugas ? (
              <Inner>
                <DTScore
                  itemId={tugas.id}
                  jenis="TUGAS"
                  status={tugas.status as any}
                  nilai={tScoreLocal}
                  mark="T"
                  onSavedValue={setTScoreLocal}
                  onOpenChange={setEditingTugas}
                  expandTrigger
                  className={tScoreLocal != null ? "text-[15px] md:text-[16px] tracking-tight" : ""}
                />
              </Inner>
            ) : (
              <Inner><span>T</span></Inner>
            )}
          </button>

          {tugas && (
            <CopasDot
              active={isCopasTugas}
              onClick={toggleCopasTugas}
              title={`Tandai COPAS Tugas sesi ${sesi}`}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
