import { TableColumn, Button } from "@heroui/react";
import { SESSIONS } from "./constants";
// Untuk runtime React (kalau masih butuh); tak masalah meski tak dipakai eksplisit
import React from "react";
// ⬇️ penting: type-only import agar cocok dengan `verbatimModuleSyntax`
import type { ReactElement } from "react";

type Status = "SELESAI" | "BELUM";

export type AbsenHeaderProps = {
  absenHeaderMode: Record<number, Status>;
  onStageHeaderToggle: (sesi: number) => void;
};

/**
 * Generator kolom header Absen (kalau kamu masih pakai file ini).
 * Kalau sudah pakai MatrixTable columns, file ini opsional.
 */
export function renderAbsenHeaderColumns({
  absenHeaderMode,
  onStageHeaderToggle,
}: AbsenHeaderProps): ReactElement[] {
  return SESSIONS.map((s) => {
    const isDone = (absenHeaderMode[s.sesi] ?? "BELUM") === "SELESAI";
    return (
      <TableColumn key={`col-${s.key}`} className="text-center">
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
            onPress={() => onStageHeaderToggle(s.sesi)}
            title={isDone ? "Set Absen → BELUM" : "Set Absen → SELESAI"}
          >
            {isDone ? "Absen ✓" : "Absen —"}
          </Button>
        </div>
      </TableColumn>
    );
  });
}
