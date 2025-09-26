import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Tooltip } from "@heroui/react";
import { Play, Pause, PlayCircle, Square } from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import { useApi } from "../../../hooks/useApi";
import { useLiveDuration } from "../../../hooks/useLiveDuration";
import { toHMS } from "../../../utils/format";

import { startJamKerjaForUser } from "../../../services/jamKerja.owner";
import {
  pauseJamKerja,
  resumeJamKerja,
  endJamKerja,
  type ApiResponse,
} from "../../../services/jamKerja.service";

type UiColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";
type AdminJamStatus = "TIDAK_AKTIF" | "AKTIF" | "JEDA";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1600,
  timerProgressBar: true,
});

function PrettyStatus({ status, durasi }: { status: AdminJamStatus; durasi: number }) {
  const color: UiColor = status === "AKTIF" ? "success" : status === "JEDA" ? "warning" : "danger";
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
      <p className="mt-1 text-xs text-foreground-400">Kontrol oleh OWNER untuk akun ini.</p>
    </div>
  );
}

interface Props {
  targetUsername: string;
  status: AdminJamStatus;
  activeSessionId?: number | null;
  resumeTargetId?: number | null;
  detikBerjalan: number;
  startedAt?: string | null;
  serverNow?: string | null;
  onChanged: () => void;
  autoPauseEnabled?: boolean;
  autoPauseMinutes?: number;
}

export default function AdminJamControls({
  targetUsername,
  status,
  activeSessionId,
  resumeTargetId,
  detikBerjalan,
  startedAt,
  serverNow,
  onChanged,
  autoPauseEnabled = true,
  autoPauseMinutes = 5,
}: Props) {
  const api = useApi();
  const [loading, setLoading] = useState<null | "start" | "pause" | "resume" | "end">(null);

  const durasiBerjalanDetik = useLiveDuration({
    status,
    accumulatedSeconds: detikBerjalan,
    startedAt: startedAt ?? null,
    serverNow: serverNow ?? null,
  });

  const canStart  = status === "TIDAK_AKTIF" && !activeSessionId;
  const canPause  = status === "AKTIF" && !!activeSessionId;
  const canResume = status === "JEDA"  && !!(resumeTargetId ?? activeSessionId);
  const canEnd    = status === "AKTIF" && !!activeSessionId;

  const why = {
    start:  !canStart  ? "Sesi sudah berjalan / status bukan TIDAK AKTIF" : "",
    pause:  !activeSessionId ? "Tidak ada sesi aktif" : "Status bukan AKTIF",
    resume: !(resumeTargetId ?? activeSessionId) ? "Tidak ada sesi jeda" : "Status bukan JEDA",
    end:    !activeSessionId ? "Tidak ada sesi aktif" : "Hanya saat AKTIF (bukan JEDA)",
  };

  const ok   = (t: string, s?: string) => toast.fire({ icon: "success", title: t, text: s });
  const fail = (t: string, s?: string) => toast.fire({ icon: "error",   title: t, text: s });

  const handleResp = (res: ApiResponse<any>, okMsg: string) => {
    if (res.status === "success") ok(okMsg); else fail(res.message || "Gagal");
  };

  const doStart = async () => {
    if (!canStart) return;
    setLoading("start");
    try {
      await startJamKerjaForUser(api, targetUsername);
      ok("Mulai kerja!");
      onChanged();
    } catch (e: any) {
      fail("Gagal mulai", e?.message);
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
    } catch (e: any) {
      fail("Gagal jeda", e?.message);
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
    } catch (e: any) {
      fail("Gagal lanjut", e?.message);
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
    } catch (e: any) {
      fail("Gagal selesai", e?.message);
    } finally {
      setLoading(null);
    }
  };

  const primary: "start" | "pause" | "resume" =
    status === "TIDAK_AKTIF" ? "start" : status === "AKTIF" ? "pause" : "resume";

  const buttons = useMemo(
    () =>
      [
        { key: "start" as const,  label: "Mulai Kerja", onPress: doStart,  color: "success"  as UiColor, icon: <Play className="w-4 h-4" />,      loadingKey: "start"  as const,  disabled: !canStart,  reason: why.start  },
        { key: "pause" as const,  label: "Jeda",        onPress: doPause,  color: "warning" as UiColor, icon: <Pause className="w-4 h-4" />,      loadingKey: "pause"  as const,  disabled: !canPause,  reason: why.pause  },
        { key: "resume" as const, label: "Lanjutkan",   onPress: doResume, color: "primary" as UiColor, icon: <PlayCircle className="w-4 h-4" />, loadingKey: "resume" as const, disabled: !canResume, reason: why.resume },
        { key: "end" as const,    label: "Selesai",     onPress: doEnd,    color: "danger"  as UiColor, icon: <Square className="w-4 h-4" />,     loadingKey: "end"    as const,  disabled: !canEnd,    reason: why.end   },
      ].sort((a, b) => (a.key === primary ? -1 : b.key === primary ? 1 : 0)),
    [primary, canStart, canPause, canResume, canEnd]
  );

  /* ================== AUTO-PAUSE (IDLE) — sama dengan user ================== */
  useEffect(() => {
    if (!autoPauseEnabled || status !== "AKTIF" || !activeSessionId) return;

    const idleMs = Math.max(1, autoPauseMinutes) * 60 * 1000;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const triggerPause = () => { if (status === "AKTIF") { (async () => { await doPause(); })(); } };

    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(triggerPause, idleMs);
    };

    const onAny = () => reset();

    const events: (keyof WindowEventMap | string)[] = [
      "mousemove", "keydown", "click", "scroll",
      "visibilitychange", "focus", "pointermove", "touchstart",
      "work-activity",
    ];

    events.forEach((ev) => window.addEventListener(ev as any, onAny));
    reset();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev as any, onAny));
    };
  }, [autoPauseEnabled, autoPauseMinutes, status, activeSessionId]);

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
          ) : (
            btn
          );
        })}
      </div>
      <div className="text-xs text-foreground-400">
        Tip: Akhiri saat <b>AKTIF</b>, bukan ketika <b>JEDA</b>.
      </div>
    </div>
  );
}
