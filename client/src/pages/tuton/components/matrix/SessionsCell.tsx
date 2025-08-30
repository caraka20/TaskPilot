import type { TutonItemResponse } from "../../../../services/tuton.service";
import { isTugas as isTugasSesi } from "./constants";
import CopasDot from "./CopasDot";

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
  const btnSize = compact ? "h-7 px-2" : "h-9 px-3";
  const iconSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const showTugas = isTugasSesi(sesi);

  const norm = (v: any) => String(v ?? "").trim().toUpperCase();
  // DONE jika status "SELESAI" ATAU selesaiAt ada
  const diskusiDone = !!diskusi && (norm(diskusi.status) === "SELESAI" || !!diskusi.selesaiAt);
  const tugasDone   = !!tugas   && (norm(tugas.status)   === "SELESAI" || !!tugas.selesaiAt);

  // DEBUG: nilai yang menentukan warna tombol
  console.log("[TP][render-cell]", {
    sesi,
    hasDiskusi: !!diskusi,
    diskusiStatus: diskusi?.status,
    diskusiSelesaiAt: diskusi?.selesaiAt,
    diskusiDone,
    hasTugas: !!tugas,
    tugasStatus: tugas?.status,
    tugasSelesaiAt: tugas?.selesaiAt,
    tugasDone
  });

  return (
    <div className="flex items-center justify-center gap-2">
      {/* DISKUSI */}
      <div className="relative">
        <button
          type="button"
          title={`Diskusi sesi ${sesi}`}
          onClick={() => diskusi && markDirty(diskusi)}
          className={[
            "inline-flex items-center gap-1 rounded-full text-[12px]",
            btnSize,
            diskusiDone ? "bg-emerald-600 text-white" : "bg-default-200 text-foreground-700",
            "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500",
            !diskusi && "opacity-50 pointer-events-none",
          ].join(" ")}
          disabled={!diskusi}
        >
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
          </svg>
          D
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
            onClick={() => tugas && markDirty(tugas)}
            className={[
              "inline-flex items-center gap-1 rounded-full text-[12px]",
              btnSize,
              tugasDone ? "bg-emerald-600 text-white" : "bg-default-200 text-foreground-700",
              "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500",
              !tugas && "opacity-50 pointer-events-none",
            ].join(" ")}
            disabled={!tugas}
          >
            <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9 2h6a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2-2zm0 2v2h6V4H9z" />
            </svg>
            T
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
