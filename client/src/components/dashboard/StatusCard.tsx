import { Button, Card, CardBody, Chip } from "@heroui/react";
import { ArrowRight, ClipboardCheck, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
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
    <Card className="overflow-hidden border border-default-200/70 bg-background/95 shadow-[0_14px_38px_rgba(15,23,42,.06)] backdrop-blur-sm">
      <div className="h-1 bg-gradient-to-r from-[#174c6d] via-sky-500 to-teal-500" />
      <CardBody className="gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-[#174c6d] dark:bg-sky-500/10 dark:text-sky-300">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[.17em] text-[#176f69] dark:text-teal-300">Sesi jam-jaman</p>
                <Chip size="sm" variant="flat" color={statusLabel === "AKTIF" ? "success" : statusLabel === "JEDA" ? "warning" : "default"}>
                  {statusLabel === "TIDAK_AKTIF" ? "Belum berjalan" : statusLabel}
                </Chip>
              </div>
              <h2 className="mt-1 text-lg font-black tracking-tight text-foreground">Kontrol waktu kerja</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-500">
                Gunakan panel ini khusus untuk pekerjaan berbasis jam. Harian dan Borongan dicatat melalui halaman Absensi.
              </p>
            </div>
          </div>
          <Button
            as={Link}
            to="/attendance"
            variant="flat"
            endContent={<ArrowRight className="h-4 w-4" />}
            startContent={<ClipboardCheck className="h-4 w-4" />}
            className="min-h-11 shrink-0 rounded-xl bg-teal-50 font-bold text-[#17645f] dark:bg-teal-500/10 dark:text-teal-300"
          >
            Buka Harian &amp; Borongan
          </Button>
        </div>

        <div className="rounded-2xl border border-default-200/70 bg-default-50/70 p-4 dark:bg-default-100/40">
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
        </div>
      </CardBody>
    </Card>
  );
}
