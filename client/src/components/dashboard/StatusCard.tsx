import { Card, CardHeader, CardBody } from "@heroui/react";
import JamControls from "../jam-kerja/JamControls";

type Status = "AKTIF" | "JEDA" | "TIDAK_AKTIF";

type Props = {
  statusLabel: Status;
  activeSessionId: number | null;

  /** (Deprecated) — masih didukung sementara untuk kompatibilitas lama */
  durasiBerjalanDetik?: number;

  /** Rekomendasi baru: detik akumulasi tanpa delta segmen aktif (server side) */
  detikBerjalan?: number;
  /** ISO jam mulai segmen AKTIF (kalau AKTIF), dipakai untuk delta live */
  startedAt?: string | null;
  /** ISO waktu server saat render, opsional (lebih akurat kalau ada) */
  serverNow?: string | null;

  /** Auto-pause (idle) */
  jedaOtomatisAktif?: boolean;
  batasJedaMenit?: number;

  onChanged: () => void;
};

export default function StatusCard({
  statusLabel,
  activeSessionId,
  // legacy
  durasiBerjalanDetik,
  // new
  detikBerjalan,
  startedAt = null,
  serverNow = null,
  // auto-pause
  jedaOtomatisAktif = false,
  batasJedaMenit = 5,
  onChanged,
}: Props) {
  const normalizedDetik =
    typeof detikBerjalan === "number"
      ? detikBerjalan
      : Math.max(0, Number(durasiBerjalanDetik || 0));

  const startedIso = startedAt || undefined;
  const serverNowIso = serverNow || undefined;

  return (
    <Card className="border border-default-200/70 bg-background/90 backdrop-blur-sm">
      <CardHeader className="text-sm text-foreground-500">Status Kerja</CardHeader>
      <CardBody className="gap-3">
      <JamControls
        mode="user"
        status={statusLabel}
        activeSessionId={activeSessionId ?? undefined}
        detikBerjalan={normalizedDetik}
        startedAt={startedIso}
        serverNow={serverNowIso}
        onChanged={onChanged}
        autoPauseEnabled={Boolean(jedaOtomatisAktif)}
        autoPauseMinutes={Number.isFinite(batasJedaMenit) ? Math.max(1, batasJedaMenit) : 5}
      />
      </CardBody>
    </Card>
  );
}
