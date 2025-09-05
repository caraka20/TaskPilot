import { useEffect, useRef, useState, memo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableColumn,
  Button,
  Tooltip,
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
  pairsVersion: number; // force remount bila benar-benar perlu
  conflicts: Set<string>;
  absenHeaderMode: Record<number, Status>;
  onToggleHeaderAbsen: (sesi: number) => void;
  isCopas: (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => boolean;
  toggleCopas: (cid: number, kind: "DISKUSI" | "TUGAS", sesi: number) => void;
  copyMatkul: (rowId: number, text: string) => void;
  copiedId: number | null; // opsional (tidak wajib dipakai)
  markDirty: (it?: TutonItemResponse) => void;
};

type Column = { key: string; label: React.ReactNode; sesi?: number };

/** Tombol salin dengan Tooltip hover & badge "Disalin" tepat di atas tombol */
const CopyMatkulButton = memo(function CopyMatkulButton({
  rowId,
  text,
  onCopy,
}: {
  rowId: number;
  text: string;
  onCopy: (rowId: number, text: string) => void;
}) {
  const [justCopied, setJustCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const doCopy = () => {
    try {
      onCopy(rowId, text);
      // ekstra: coba Clipboard API (aman di browser modern)
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } finally {
      setJustCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setJustCopied(false), 1400) as unknown as number;
    }
  };

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    // relative + pt-5 memberi ruang vertikal untuk badge di atas tombol (anti-clip)
    <div className="relative pt-5">
      {/* Badge sukses copy */}
      <span
        role="status"
        aria-live="polite"
        className={[
          "pointer-events-none absolute right-0 top-0 z-50 rounded-md",
          "bg-emerald-600/95 text-white text-[10px] px-2 py-0.5 shadow",
          "transition-all duration-200 will-change-transform",
          justCopied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
        ].join(" ")}
      >
        Disalin
      </span>

      {/* Tooltip hover untuk ikon salin */}
      <Tooltip content="Salin nama matkul" placement="top-end" offset={6} showArrow>
        <Button
          size="sm"
          isIconOnly
          variant="flat"
          className="bg-default-100 text-foreground-600 cursor-pointer
                     hover:bg-default-200 active:bg-default-300 transition-colors"
          onPress={doCopy}
          aria-label={`Salin nama matkul ${text}`}
          title="Salin nama matkul" // fallback native
        >
          <Clipboard className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );
});

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
      <Table
        key={pairsVersion}
        aria-label="Tuton Matrix"
        removeWrapper
        classNames={{
          table:
            "min-w-[1100px] table-fixed text-[13px] border border-default-200 border-separate border-spacing-0",
          thead: "sticky top-0 z-10 shadow-sm",
          th: "bg-blue-600 text-white font-medium text-[13px] py-2 px-2 text-center border border-blue-500/70",
          // penting: izinkan konten di atas tombol terlihat (badge)
          td: "py-2 px-2 align-middle text-center border border-default-200 overflow-visible",
        }}
        selectionMode="none"
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              className={column.key === "MATKUL" ? "w-[300px] text-left" : "text-center"}
            >
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
                    <TableCell className="text-left overflow-visible">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[15px] font-semibold truncate">{c.matkul}</div>

                        <CopyMatkulButton
                          rowId={c.id}
                          text={c.matkul}
                          // Penting: jangan ubah pairsVersion di sini
                          onCopy={(rowId, text) => {
                            copyMatkul(rowId, text);
                          }}
                        />
                      </div>
                    </TableCell>
                  );
                }

                // Ambil angka sesi dengan aman (hindari NaN)
                const sesiMatch = String(columnKey).match(/\d+/);
                const sesi = Number(sesiMatch?.[0] ?? NaN);
                const arr: Pair[] = pairsByCourse[c.id] ?? [];
                const p = Number.isFinite(sesi) ? arr.find((x) => x.sesi === sesi) : undefined;

                return (
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <SessionsCell
                        sesi={Number.isFinite(sesi) ? sesi : 0}
                        diskusi={p?.diskusi}
                        tugas={p?.tugas}
                        isCopasDiskusi={!!(
                          p?.diskusi && isCopas(c.id, "DISKUSI", Number.isFinite(sesi) ? sesi : 0)
                        )}
                        isCopasTugas={!!(
                          p?.tugas && isCopas(c.id, "TUGAS", Number.isFinite(sesi) ? sesi : 0)
                        )}
                        toggleCopasDiskusi={() =>
                          Number.isFinite(sesi) && toggleCopas(c.id, "DISKUSI", sesi)
                        }
                        toggleCopasTugas={() =>
                          Number.isFinite(sesi) && toggleCopas(c.id, "TUGAS", sesi)
                        }
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
