import { useMemo, useState } from "react";
import { Button, Chip, Tooltip } from "@heroui/react";
import { toHMS } from "../../utils/format";
import { useApi } from "../../hooks/useApi";
import {
  startJamKerja,
  pauseJamKerja,
  resumeJamKerja,
  endJamKerja,
  type ApiResponse,
} from "../../services/jamKerja.service";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { isAxiosError } from "axios";
import { Play, Pause, PlayCircle, Square } from "lucide-react";
import { useLiveDuration } from "../../hooks/useLiveDuration";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1600,
  timerProgressBar: true,
});

type UiColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

type Props = {
  status: "AKTIF" | "JEDA" | "TIDAK_AKTIF";
  /** ID sesi open (jamSelesai = null) — untuk pause & end */
  activeSessionId?: number | null;
  /** ID baris jeda yang akan di-resume (bisa berbeda dari activeSessionId) */
  resumeTargetId?: number | null;

  // API waktu (baru)
  detikBerjalan: number;       // akumulasi dari server (tanpa delta segmen aktif)
  startedAt?: string | null;   // ISO saat AKTIF
  serverNow?: string | null;   // ISO opsional

  onChanged: () => void;
};

function apiErr(err: unknown) {
  if (isAxiosError(err)) {
    return (
      ((err.response?.data as any)?.message as string | undefined) ||
      err.message ||
      "Terjadi kesalahan"
    );
  }
  if (err instanceof Error) return err.message;
  return "Terjadi kesalahan";
}

/* ======================  UI POLISH  ====================== */

function FancyShell({ children }: { children: React.ReactNode }) {
  // aura glow + glass look; tanpa dependency tambahan
  return (
    <div className="relative group">
      <div className="absolute -inset-2 rounded-3xl blur-2xl opacity-70 group-hover:opacity-95 transition-opacity bg-gradient-to-br from-emerald-400/16 via-cyan-400/12 to-indigo-400/16" />
      <div className="rounded-[22px] p-[1.5px] bg-gradient-to-r from-white/10 to-white/10">
        <div className="rounded-[20px] border border-default-200/70 bg-background/90 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

function PrettyStatus({ status, durasi }: { status: Props["status"]; durasi: number }) {
  const color: UiColor =
    status === "AKTIF" ? "success" : status === "JEDA" ? "warning" : "danger";
  const label =
    status === "AKTIF" ? `Aktif · ${toHMS(durasi)}`
    : status === "JEDA" ? `Jeda · ${toHMS(durasi)}`
    : "Tidak Aktif";

  return (
    <div className="w-full">
      <div className="mb-2 h-[3px] w-24 rounded-full bg-gradient-to-r from-emerald-400/80 via-teal-400/60 to-cyan-400/80" />
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-foreground-500">Status</span>
        <Chip
          color={color}
          variant="flat"
          radius="lg"
          className="px-3 py-2 text-base font-medium shadow-sm backdrop-blur"
        >
          {label}
        </Chip>
      </div>
      <p className="mt-1 text-xs text-foreground-400">
        Gunakan tombol di bawah untuk mengelola sesi kerja kamu.
      </p>
    </div>
  );
}

/* ======================  MAIN  ====================== */

export default function JamControls({
  status,
  detikBerjalan,
  startedAt,
  serverNow,
  activeSessionId,
  resumeTargetId,
  onChanged,
}: Props) {
  const api = useApi();
  const [loading, setLoading] = useState<null | "start" | "pause" | "resume" | "end">(null);

  const durasiBerjalanDetik = useLiveDuration({
    status,
    accumulatedSeconds: detikBerjalan,
    startedAt: startedAt ?? null,
    serverNow: serverNow ?? null,
  });

  // Aturan enable tombol
  const canStart  = status === "TIDAK_AKTIF" && !activeSessionId;
  const canPause  = status === "AKTIF" && !!activeSessionId;
  const canResume = status === "JEDA"  && !!(resumeTargetId ?? activeSessionId);
  const canEnd    = status === "AKTIF" && !!activeSessionId;

  const why = {
    start:  !canStart  ? "Status bukan TIDAK AKTIF" : "",
    pause:  !activeSessionId ? "Tidak ada sesi aktif" : "Status bukan AKTIF",
    resume: !(resumeTargetId ?? activeSessionId) ? "Tidak ada sesi jeda" : "Status bukan JEDA",
    end:    !activeSessionId ? "Tidak ada sesi aktif" : "Hanya bisa ketika AKTIF (bukan JEDA)",
  };

  const ok = (title: string, text?: string) => toast.fire({ icon: "success", title, text });
  const fail = (title: string, text?: string) => toast.fire({ icon: "error", title, text });

  const handleResp = (res: ApiResponse<any>, okMsg: string) => {
    if (res.status === "success") ok(okMsg);
    else fail(res.message || "Gagal");
  };

  const doStart = async () => {
    if (!canStart) return;
    setLoading("start");
    try {
      const res = await startJamKerja(api); // BE baca dari token
      handleResp(res, "Mulai kerja!");
      onChanged();
    } catch (e) {
      fail("Gagal mulai", apiErr(e));
    } finally {
      setLoading(null);
    }
  };

  const doPause = async () => {
    if (!canPause || !activeSessionId) return;
    setLoading("pause");
    try {
      const res = await pauseJamKerja(api, activeSessionId);
      handleResp(res, "Dijeda");
      onChanged();
    } catch (e) {
      fail("Gagal jeda", apiErr(e));
    } finally {
      setLoading(null);
    }
  };

  const doResume = async () => {
    const targetId = resumeTargetId ?? activeSessionId ?? null;
    if (!canResume || !targetId) return;
    setLoading("resume");
    try {
      const res = await resumeJamKerja(api, targetId);
      handleResp(res, "Dilanjutkan");
      onChanged();
    } catch (e) {
      fail("Gagal lanjut", apiErr(e));
    } finally {
      setLoading(null);
    }
  };

  const doEnd = async () => {
    if (!canEnd || !activeSessionId) return;
    const confirm = await Swal.fire({
      title: "Selesaikan sesi?",
      text: "Durasi akan direkap dan sesi ditutup.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, selesai",
      cancelButtonText: "Batal",
    });
    if (!confirm.isConfirmed) return;

    setLoading("end");
    try {
      const res = await endJamKerja(api, activeSessionId);
      handleResp(res, "Sesi selesai");
      onChanged();
    } catch (e) {
      fail("Gagal selesai", apiErr(e));
    } finally {
      setLoading(null);
    }
  };

  const primary: "start" | "pause" | "resume" =
    status === "TIDAK_AKTIF" ? "start" : status === "AKTIF" ? "pause" : "resume";

  const buttons = useMemo(() => {
    return [
      { key: "start" as const, label: "Mulai Kerja", onPress: doStart, color: "success" as UiColor,
        icon: <Play className="w-4 h-4" />, loadingKey: "start" as const, disabled: !canStart, reason: why.start },
      { key: "pause" as const, label: "Jeda", onPress: doPause, color: "warning" as UiColor,
        icon: <Pause className="w-4 h-4" />, loadingKey: "pause" as const, disabled: !canPause, reason: why.pause },
      { key: "resume" as const, label: "Lanjutkan", onPress: doResume, color: "primary" as UiColor,
        icon: <PlayCircle className="w-4 h-4" />, loadingKey: "resume" as const, disabled: !canResume, reason: why.resume },
      { key: "end" as const, label: "Selesai", onPress: doEnd, color: "danger" as UiColor,
        icon: <Square className="w-4 h-4" />, loadingKey: "end" as const, disabled: !canEnd, reason: why.end },
    ].sort((a, b) => (a.key === primary ? -1 : b.key === primary ? 1 : 0));
  }, [primary, canStart, canPause, canResume, canEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FancyShell>
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <PrettyStatus status={status} durasi={durasiBerjalanDetik} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {buttons.map((b, idx) => {
            const isPrimary = idx === 0;
            const isFancy = isPrimary && !b.disabled;

            const btn = (
              <Button
                key={b.key}
                className={[
                  "w-full h-11 rounded-2xl transition ring-1 ring-default-200",
                  isFancy
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-95 border-0 shadow"
                    : "",
                ].join(" ")}
                variant={isPrimary ? "solid" : "flat"}
                color={b.color}
                startContent={b.icon}
                isDisabled={b.disabled}
                isLoading={loading === (b as any).loadingKey}
                onPress={b.onPress}
              >
                {b.label}
              </Button>
            );
            return b.disabled ? (
              <Tooltip key={b.key} content={b.reason} placement="top" closeDelay={0}>
                <div>{btn}</div>
              </Tooltip>
            ) : (
              btn
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-foreground-400">
          <span>Tip: Untuk mengakhiri saat jeda, lanjutkan dulu sebentar lalu tekan Selesai.</span>
          {status !== "TIDAK_AKTIF" && (
            <span className="font-medium">Berjalan: {toHMS(durasiBerjalanDetik)}</span>
          )}
        </div>
      </div>
    </FancyShell>
  );
}
