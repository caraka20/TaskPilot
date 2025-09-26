// client/src/pages/tuton/components/matrix/SessionsCell.tsx
import { useEffect, useState } from "react";
import type { TutonItemResponse } from "../../../../services/tuton.service";
import { isTugas as isTugasSesi } from "./constants";
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
      // hijau bagus
      return "bg-emerald-300 text-black dark:bg-emerald-500 dark:text-white";
    }
    if (score >= 70) {
      // kuning sedang
      return "bg-amber-300 text-black dark:bg-amber-500 dark:text-white";
    }
    // merah rendah
    return "bg-rose-300 text-black dark:bg-rose-500 dark:text-white";
  }
  // tanpa skor
  return done
    ? "bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
    : "bg-default-200 text-foreground-700 dark:bg-content2 dark:text-foreground-500";
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
  const SIZE_SCORED   = compact ? "h-8 md:h-9" : "h-10";
  const SIZE_DEFAULT  = compact ? "h-7 md:h-8" : "h-9";
  const WIDTH_DEFAULT = "w-10 md:w-11";

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
  }, [diskusi?.nilai, diskusi?.id]);
  useEffect(() => {
    setTScoreLocal(tugas && Number.isFinite(tugas.nilai as any) ? Math.round(Number(tugas.nilai)) : null);
  }, [tugas?.nilai, tugas?.id]);

  const [editingDiskusi, setEditingDiskusi] = useState(false);
  const [editingTugas,   setEditingTugas]   = useState(false);

  const Inner = ({ children }: { children: React.ReactNode }) => (
    <span className="w-full inline-flex items-center justify-center text-center leading-none">
      {children}
    </span>
  );

  const baseBtn =
    "relative inline-flex items-center justify-center select-none text-[12px] " +
    "rounded-[10px] md:rounded-lg ring-1 ring-inset ring-default-300 dark:ring-default-200/40 " +
    "shadow-sm transition-colors focus:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400 " +
    "hover:brightness-95";

  return (
    <div className="flex items-center justify-center gap-2">
      {/* DISKUSI */}
      <div className="relative">
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
      </div>

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
