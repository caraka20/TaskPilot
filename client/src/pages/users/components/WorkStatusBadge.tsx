import { Chip } from "@heroui/react";

export type WorkStatus = "AKTIF" | "JEDA" | "SELESAI" | "OFF";

export default function WorkStatusBadge({ status }: { status: WorkStatus }) {
  const map = {
    AKTIF: { color: "success", label: "AKTIF" },
    JEDA: { color: "warning", label: "JEDA" },
    SELESAI: { color: "danger", label: "SELESAI" },
    OFF: { color: "default", label: "TIDAK AKTIF" },
  } as const;

  const cfg = map[status] ?? map.OFF;
  return (
    <Chip size="sm" color={cfg.color as any} variant="flat">
      {cfg.label}
    </Chip>
  );
}
