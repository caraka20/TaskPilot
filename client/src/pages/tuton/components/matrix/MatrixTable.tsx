import {
  Table, TableHeader, TableBody, TableRow, TableCell, TableColumn, Tooltip, Button,
} from "@heroui/react";
import { Clipboard } from "lucide-react";

import { SESSIONS } from "./constants";
import SessionsCell from "./SessionsCell";
import type { MinimalCourse, Pair } from "./types";
import type { TutonItemResponse } from "../../../../services/tuton.service";

type Status = "SELESAI" | "BELUM";

type Props = {
  normalized: Array<{ id: number; matkul: string } & MinimalCourse>;
  pairsByCourse: Record<number, Pair[]>;
  pairsVersion: number; // <<<< versi utk force remount
  conflicts: Set<string>;
  absenHeaderMode: Record<number, Status>;
  onToggleHeaderAbsen: (sesi: number) => void;
  isCopas: (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => boolean;
  toggleCopas: (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => void;
  copyMatkul: (rowId: number, text: string) => void;
  copiedId: number | null;
  markDirty: (it?: TutonItemResponse) => void;
};

type Column = { key: string; label: React.ReactNode; sesi?: number };

export default function MatrixTable({
  normalized,
  pairsByCourse,
  pairsVersion,
  conflicts,
  absenHeaderMode,
  onToggleHeaderAbsen,
  isCopas,
  toggleCopas,
  copyMatkul,
  copiedId,
  markDirty,
}: Props) {
  const conflictSet = conflicts ?? new Set<string>();

  const columns: Column[] = [
    { key: "MATKUL", label: "MATKUL" },
    ...SESSIONS.map((s) => {
      const isDone = (absenHeaderMode[s.sesi] ?? "BELUM") === "SELESAI";
      return {
        key: `S${s.sesi}`,
        sesi: s.sesi,
        label: (
          <div className="flex flex-col items-center gap-1">
            <div className="font-medium">{s.label}</div>
            <Button
              size="sm"
              radius="full"
              aria-label={`Toggle absen sesi ${s.sesi}`}
              className={[
                "h-6 px-3 text-[11px]",
                isDone ? "bg-emerald-600 text-white" : "bg-default-200 text-foreground-700",
              ].join(" ")}
              onPress={() => onToggleHeaderAbsen(s.sesi)}
              title={isDone ? "Set Absen → BELUM" : "Set Absen → SELESAI"}
            >
              {isDone ? "Absen ✓" : "Absen —"}
            </Button>
          </div>
        ),
      };
    }),
  ];

  return (
    <div className="overflow-x-auto">
      {/* key memaksa Table re-mount saat data pairs berubah */}
      <Table
        key={pairsVersion} // <<<< kunci penting
        aria-label="Tuton Matrix"
        removeWrapper
        classNames={{
          table: "min-w-[1100px] table-fixed text-[13px] border border-default-200 border-separate border-spacing-0",
          thead: "sticky top-0 z-10 shadow-sm",
          th: "bg-blue-600 text-white font-medium text-[13px] py-2 px-2 text-center border border-blue-500/70",
          td: "py-2 px-2 align-middle text-center border border-default-200",
        }}
        selectionMode="none"
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} className={column.key === "MATKUL" ? "w-[300px] text-left" : "text-center"}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>

        <TableBody items={normalized} emptyContent="Belum ada course">
          {(c) => (
            <TableRow key={c.id} className={conflictSet.has(c.matkul) ? "bg-emerald-50" : ""}>
              {(columnKey) => {
                if (columnKey === "MATKUL") {
                  return (
                    <TableCell className="text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[15px] font-semibold truncate">{c.matkul}</div>

                        <div className="relative">
                          {copiedId === c.id && (
                            <span className="absolute -top-5 right-1 rounded-md bg-emerald-600/95 text-white text-[10px] px-2 py-0.5 shadow z-20">
                              Disalin
                            </span>
                          )}
                          <Tooltip content="Salin nama matkul">
                            <Button
                              size="sm"
                              isIconOnly
                              variant="flat"
                              className="bg-default-100"
                              onPress={() => copyMatkul(c.id, c.matkul)}
                              aria-label={`Salin nama matkul ${c.matkul}`}
                            >
                              <Clipboard className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </TableCell>
                  );
                }

                // Ambil angka sesi dengan aman (hindari NaN)
                const sesiMatch = String(columnKey).match(/\d+/);
                const sesi = Number(sesiMatch?.[0] ?? NaN);
                const arr: Pair[] = pairsByCourse[c.id] ?? [];

                // DEBUG: lihat panjang arr untuk row ini
                console.log("[TP][row-arr]", { courseId: c.id, arrLen: arr.length });

                const p = Number.isFinite(sesi) ? arr.find((x) => x.sesi === sesi) : undefined;

                // DEBUG: pairing per sel
                console.log("[TP][cell]", {
                  rowCourseId: c.id,
                  columnKey: String(columnKey),
                  sesi,
                  hasPair: !!p,
                  diskusi: p?.diskusi ? { id: p.diskusi.id, status: p.diskusi.status, selesaiAt: p.diskusi.selesaiAt } : null,
                  tugas: p?.tugas ? { id: p.tugas.id, status: p.tugas.status, selesaiAt: p.tugas.selesaiAt } : null,
                });

                return (
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <SessionsCell
                        sesi={Number.isFinite(sesi) ? sesi : 0}
                        diskusi={p?.diskusi}
                        tugas={p?.tugas}
                        isCopasDiskusi={!!(p?.diskusi && isCopas(c.id, "DISKUSI", Number.isFinite(sesi) ? sesi : 0))}
                        isCopasTugas={!!(p?.tugas && isCopas(c.id, "TUGAS", Number.isFinite(sesi) ? sesi : 0))}
                        toggleCopasDiskusi={() => Number.isFinite(sesi) && toggleCopas(c.id, "DISKUSI", sesi)}
                        toggleCopasTugas={() => Number.isFinite(sesi) && toggleCopas(c.id, "TUGAS", sesi)}
                        markDirty={markDirty}
                        compact
                      />
                    </div>
                  </TableCell>
                );
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
