// client/src/pages/tuton/components/matrix/TutonMatrixRow.tsx
import { Chip, Progress, Button, Tooltip } from "@heroui/react";
import { Pencil, TriangleAlert } from "lucide-react";
import type { Pair } from "./matrix/types";
import { SESSIONS } from "./matrix/constants";
import SessionsCell from "./matrix/SessionsCell";

export default function TutonMatrixRow({
  courseId,
  matkul,
  conflicts,
  rowPairs,
  isCopas,
  toggleCopas,
  markDirty,
  onOpenNilai,
}: {
  courseId: number;
  matkul: string;
  conflicts: Set<string>;
  rowPairs: Pair[];
  // NOTE: signature lama dipertahankan supaya kompatibel dengan pemanggil lama
  isCopas: (kind: "DISKUSI" | "TUGAS", sesi: number) => boolean;
  toggleCopas: (kind: "DISKUSI" | "TUGAS", sesi: number) => void;
  markDirty: (it?: any) => void;
  onOpenNilai: () => void;
}) {
  const pct = rowPairs[0]?.pct ?? 0;
  const conflict = conflicts.has(matkul);

  return (
    <tr className="even:bg-default-50/50 border-b border-default-200">
      {/* MATKUL */}
      <td className="py-3 px-3 align-top">
        <div
          className={[
            "flex items-start justify-between gap-4 rounded-lg p-3",
            conflict ? "bg-emerald-50 border-l-4 border-emerald-500" : "",
          ].join(" ")}
        >
          <div className="min-w-0">
            <div className={["text-[15px] font-semibold truncate", conflict ? "text-emerald-700" : ""].join(" ")}>
              {matkul}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Progress aria-label="progress" value={pct} className="w-[260px]" />
              <span className="text-xs text-foreground-500">{pct}%</span>
            </div>
            {conflict && (
              <div className="mt-2 inline-flex items-center gap-2">
                <Chip size="sm" variant="flat" className="bg-emerald-100 text-emerald-700">
                  <TriangleAlert className="h-3.5 w-3.5 mr-1" /> CONFLICT
                </Chip>
              </div>
            )}
          </div>

          <Tooltip content="Kelola nilai (Diskusi & Tugas)">
            <Button
              size="sm"
              variant="flat"
              startContent={<Pencil className="h-4 w-4" />}
              className="bg-default-100"
              onPress={onOpenNilai}
            >
              Nilai
            </Button>
          </Tooltip>
        </div>
      </td>

      {/* SESSIONS */}
      {SESSIONS.map((s) => {
        const p = rowPairs.find((x) => x.sesi === s.sesi);
        return (
          <td key={`${courseId}-${s.key}`} className="py-3 px-3 align-top text-center">
            <SessionsCell
              sesi={s.sesi}
              /* ⬇️ HAPUS prop 'absen' karena tidak ada di SessionsCell */
              diskusi={p?.diskusi}
              tugas={p?.tugas}
              isCopasDiskusi={!!(p?.diskusi && isCopas("DISKUSI", s.sesi))}
              isCopasTugas={!!(p?.tugas && isCopas("TUGAS", s.sesi))}
              toggleCopasDiskusi={() => toggleCopas("DISKUSI", s.sesi)}
              toggleCopasTugas={() => toggleCopas("TUGAS", s.sesi)}
              markDirty={markDirty}
              compact
            />
          </td>
        );
      })}
    </tr>
  );
}
