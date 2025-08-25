import { Card, CardHeader, CardBody } from "@heroui/react";
import JamControls from "../jam-kerja/JamControls";

type Props = {
  statusLabel: "AKTIF" | "JEDA" | "TIDAK_AKTIF";
  activeSessionId: number | null;

  // lama (optional)
  durasiBerjalanDetik?: number;

  // baru (direkomendasikan)
  detikBerjalan?: number;   // accumulated seconds (tanpa delta segmen aktif)
  startedAt?: string | null;
  serverNow?: string | null;

  jedaOtomatisAktif?: boolean;
  batasJedaMenit?: number;

  onChanged: () => void;
};

export default function StatusCard({
  statusLabel,
  activeSessionId,
  durasiBerjalanDetik,
  detikBerjalan,
  startedAt,
  serverNow,
  jedaOtomatisAktif,
  batasJedaMenit,
  onChanged,
}: Props) {
  const normalizedDetik =
    typeof detikBerjalan === "number" ? detikBerjalan : (durasiBerjalanDetik ?? 0);

  return (
    <Card>
      <CardHeader className="text-sm text-foreground-500">Status Kerja</CardHeader>
      <CardBody className="gap-3">
        <JamControls
          status={statusLabel}
          activeSessionId={activeSessionId}
          detikBerjalan={normalizedDetik}
          startedAt={startedAt ?? null}
          serverNow={serverNow ?? null}
          onChanged={onChanged}
        />
        <p className="text-xs text-foreground-500">
          {typeof jedaOtomatisAktif === "boolean"
            ? (jedaOtomatisAktif
                ? `Jeda otomatis aktif • Batas ${batasJedaMenit ?? 0} menit`
                : "Jeda otomatis nonaktif")
            : ""}
        </p>
      </CardBody>
    </Card>
  );
}
