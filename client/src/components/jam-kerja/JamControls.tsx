// client/src/components/jam-kerja/JamControls.tsx
import { useMemo, useState } from "react";
import { Button, Chip, Tooltip } from "@heroui/react";
import { toHMS } from "../../utils/format";
import { useApi } from "../../hooks/useApi";
import { useAuthStore } from "../../store/auth.store";
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
  activeSessionId?: number | null;

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

function PrettyStatus({ status, durasi }: { status: Props["status"]; durasi: number }) {
  const color: UiColor =
    status === "AKTIF" ? "success" : status === "JEDA" ? "warning" : "danger";
  const label =
    status === "AKTIF" ? `Aktif · ${toHMS(durasi)}`
    : status === "JEDA" ? `Jeda · ${toHMS(durasi)}`
    : "Tidak Aktif";

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-foreground-500">Status</span>
        <Chip color={color} variant="flat" radius="lg" className="px-3 py-2 text-base font-medium">
          {label}
        </Chip>
      </div>
      <p className="mt-1 text-xs text-foreground-400">
        Gunakan tombol di bawah untuk mengelola sesi kerja kamu.
      </p>
    </div>
  );
}

export default function JamControls({
  status,
  detikBerjalan,
  startedAt,
  serverNow,
  activeSessionId,
  onChanged,
}: Props) {
  const api = useApi();
  const { username } = useAuthStore();
  const [loading, setLoading] = useState<null | "start" | "pause" | "resume" | "end">(null);

  // durasi live (tahan refresh)
  const durasiBerjalanDetik = useLiveDuration({
    status,
    accumulatedSeconds: detikBerjalan,
    startedAt: startedAt ?? null,
    serverNow: serverNow ?? null,
  });

  // 👉 aturan enable tombol:
  // - Mulai: hanya saat TIDAK_AKTIF
  // - Jeda: hanya saat AKTIF
  // - Lanjutkan: hanya saat JEDA
  // - Selesai: **hanya saat AKTIF** (BE menolak jika JEDA)
  const canStart = status === "TIDAK_AKTIF" && !!username && !activeSessionId;
  const canPause = status === "AKTIF" && !!activeSessionId;
  const canResume = status === "JEDA" && !!activeSessionId;
  const canEnd = status === "AKTIF" && !!activeSessionId; // ← penting: jangan izinkan saat JEDA

  const why = {
    start: !username ? "Belum login" : activeSessionId ? "Sesi sudah berjalan" : "Status bukan TIDAK AKTIF",
    pause: !activeSessionId ? "Tidak ada sesi aktif" : "Status bukan AKTIF",
    resume: !activeSessionId ? "Tidak ada sesi jeda" : "Status bukan JEDA",
    end: !activeSessionId ? "Tidak ada sesi aktif" : "Hanya bisa ketika AKTIF (bukan JEDA)",
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
      // BE baca username dari token; jangan kirim body apa pun di FE service
      const res = await startJamKerja(api);
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
    if (!canResume || !activeSessionId) return;
    setLoading("resume");
    try {
      const res = await resumeJamKerja(api, activeSessionId);
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
    <div className="flex flex-col gap-4">
      <PrettyStatus status={status} durasi={durasiBerjalanDetik} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {buttons.map((b, idx) => {
          const btn = (
            <Button
              key={b.key}
              className={`w-full h-11 rounded-2xl ${idx === 0 ? "ring-1 ring-foreground-200" : ""}`}
              variant={idx === 0 ? "solid" : "flat"}
              color={b.color}
              startContent={b.icon}
              isDisabled={b.disabled}
              isLoading={loading === b.loadingKey}
              onPress={b.onPress}
            >
              {b.label}
            </Button>
          );
          return b.disabled ? (
            <Tooltip key={b.key} content={b.reason} placement="top" closeDelay={0}>
              <div>{btn}</div>
            </Tooltip>
          ) : (btn);
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-foreground-400">
        <span>Tip: Untuk mengakhiri saat jeda, lanjutkan dulu sebentar lalu tekan Selesai.</span>
        {status !== "TIDAK_AKTIF" && <span className="font-medium">Berjalan: {toHMS(durasiBerjalanDetik)}</span>}
      </div>
    </div>
  );
}
