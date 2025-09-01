import ScoreEditorPopover from "./ScoreEditorPopover";
import { updateItemNilai } from "../../../services/tuton.service";
import type { StatusTugas, JenisTugas } from "../../../services/tuton.service";

/**
 * Isi tampilan angka/mark di dalam tombol:
 * - BELUM → "D"/"T"
 * - SELESAI:
 *   - ada nilai → angka bold hitam + popover
 *   - belum nilai → "D"/"T" + popover
 */
export default function DTScore({
  itemId,
  jenis,
  status,
  nilai,
  mark,
  onSaved,
  onSavedValue,        // ⬅️ optimistik
  className = "",
  onOpenChange,
  expandTrigger = false,
}: {
  itemId: number;
  jenis: Exclude<JenisTugas, "ABSEN">;
  status: StatusTugas;
  nilai?: number | null;
  mark: "D" | "T";
  onSaved?: () => void | Promise<void>;
  onSavedValue?: (val: number | null) => void;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  expandTrigger?: boolean;
}) {
  const done = String(status).toUpperCase() === "SELESAI";
  const score =
    typeof nilai === "number" && Number.isFinite(nilai) ? Math.round(nilai) : null;

  const save = async (val: number | null) => {
    await updateItemNilai(itemId, val);
    onSavedValue?.(val);       // ⬅️ langsung update tampilan
    await onSaved?.();
  };

  if (!done) {
    // mark plain; biar benar² center
    return (
      <span className={`inline-flex items-center justify-center leading-none ${className}`}>
        {mark}
      </span>
    );
  }

  const content =
    score == null ? (
      <span className={`inline-flex items-center justify-center leading-none ${className}`}>
        {mark}
      </span>
    ) : (
      <span className={`inline-flex items-center justify-center leading-none font-extrabold text-black ${className} text-[14px] md:text-[15px]`}>
        {score}
      </span>
    );

  return (
    <ScoreEditorPopover
      initialScore={score}
      onSubmit={save}
      disabled={!done}
      openOnHover
      onOpenChange={onOpenChange}
      expandTrigger={expandTrigger}
      title={`Nilai ${jenis === "DISKUSI" ? "Diskusi" : "Tugas"} (0–100)`}
    >
      {content}
    </ScoreEditorPopover>
  );
}
