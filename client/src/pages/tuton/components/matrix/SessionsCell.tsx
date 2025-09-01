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

function bgByScore(score: number | null, done: boolean) {
  if (score != null) {
    if (score >= 80) return "bg-emerald-300";
    if (score >= 70) return "bg-amber-300";
    return "bg-rose-300";
  }
  return done ? "bg-emerald-600 text-white" : "bg-default-200 text-foreground-700";
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
  // Dimensi tombol (tanpa ikon). Scored sedikit lebih besar, tapi tetap tidak melebihi cell.
  const SIZE_SCORED  = compact ? "h-8 md:h-9" : "h-10";
  const SIZE_DEFAULT = compact ? "h-7 md:h-8" : "h-9";
  const WIDTH_DEFAULT = "w-9  md:w-10"; // ~36–40px

  const showTugas = isTugasSesi(sesi);
  const norm = (v: any) => String(v ?? "").trim().toUpperCase();
  const diskusiDone = !!diskusi && (norm(diskusi.status) === "SELESAI" || !!diskusi.selesaiAt);
  const tugasDone   = !!tugas   && (norm(tugas.status)   === "SELESAI" || !!tugas.selesaiAt);

  // local optimistic score
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

  // wrapper agar konten selalu center
  const Inner = ({ children }: { children: React.ReactNode }) => (
    <span className="w-full inline-flex items-center justify-center text-center leading-none">
      {children}
    </span>
  );

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
            "relative inline-flex items-center justify-center rounded-full text-[12px] select-none",
            dScoreLocal != null ? SIZE_SCORED : SIZE_DEFAULT,
            dScoreLocal != null ? WIDTH_DEFAULT : WIDTH_DEFAULT,
            bgByScore(dScoreLocal, !!diskusiDone),
            "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 hover:brightness-95",
            !diskusi && "opacity-50 pointer-events-none",
            dScoreLocal != null ? "text-black" : "",
          ].join(" ")}
          disabled={!diskusi}
        >
          {dScoreLocal == null ? (
            <Inner>
              {diskusi ? (
                <DTScore
                  itemId={diskusi.id}
                  jenis="DISKUSI"
                  status={diskusi.status as any}
                  nilai={dScoreLocal}
                  mark="D"               // hanya huruf D
                  onSavedValue={setDScoreLocal}
                  onOpenChange={setEditingDiskusi}
                  expandTrigger
                  className="font-semibold"
                />
              ) : (
                <span className="font-semibold">D</span>
              )}
            </Inner>
          ) : (
            diskusi ? (
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
                  className="font-extrabold text-black text-[15px] md:text-[16px] tracking-tight tabular-nums"
                />
              </Inner>
            ) : (
              <Inner>
                <span className="font-extrabold text-black text-[15px] md:text-[16px] tracking-tight tabular-nums">
                  {dScoreLocal}
                </span>
              </Inner>
            )
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
              "relative inline-flex items-center justify-center rounded-full text-[12px] select-none",
              tScoreLocal != null ? SIZE_SCORED : SIZE_DEFAULT,
              tScoreLocal != null ? WIDTH_DEFAULT : WIDTH_DEFAULT,
              bgByScore(tScoreLocal, !!tugasDone),
              "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 hover:brightness-95",
              !tugas && "opacity-50 pointer-events-none",
              tScoreLocal != null ? "text-black" : "",
            ].join(" ")}
            disabled={!tugas}
          >
            {tScoreLocal == null ? (
              <Inner>
                {tugas ? (
                  <DTScore
                    itemId={tugas.id}
                    jenis="TUGAS"
                    status={tugas.status as any}
                    nilai={tScoreLocal}
                    mark="T"             // hanya huruf T
                    onSavedValue={setTScoreLocal}
                    onOpenChange={setEditingTugas}
                    expandTrigger
                    className="font-semibold"
                  />
                ) : (
                  <span className="font-semibold">T</span>
                )}
              </Inner>
            ) : (
              tugas ? (
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
                    className="font-extrabold text-black text-[15px] md:text-[16px] tracking-tight tabular-nums"
                  />
                </Inner>
              ) : (
                <Inner>
                  <span className="font-extrabold text-black text-[15px] md:text-[16px] tracking-tight tabular-nums">
                    {tScoreLocal}
                  </span>
                </Inner>
              )
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
