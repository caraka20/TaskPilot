import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip, Tooltip } from "@heroui/react";
import { Play, Pause, PlayCircle, Square } from "lucide-react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import { useApi } from "../../hooks/useApi";
import { useLiveDuration } from "../../hooks/useLiveDuration";
import { toHMS } from "../../utils/format";
import { isAxiosError } from "axios";

// SERVICES (mode user)
import {
  startJamKerja,
  pauseJamKerja,
  resumeJamKerja,
  endJamKerja,
  type ApiResponse,
} from "../../services/jamKerja.service";
// SERVICES (mode owner)
import { startJamKerjaForUser } from "../../services/jamKerja.owner";

type UiColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";
type Status = "AKTIF" | "JEDA" | "TIDAK_AKTIF";

type Mode = "user" | "owner";

type Props = {
  /** gunakan "user" untuk halaman user, "owner" untuk halaman owner */
  mode: Mode;

  /** status & sesi aktif */
  status: Status;
  activeSessionId?: number | null;

  /** opsional: ID baris jeda yang bisa di-resume (umumnya dipakai di owner) */
  resumeTargetId?: number | null;

  /** waktu berjalan (akumulasi dari server, TANPA delta segmen aktif) */
  detikBerjalan: number;
  /** ISO saat segmen aktif dimulai (kalau status=AKTIF), untuk menghitung delta live */
  startedAt?: string | null;
  /** ISO waktu server saat render; kalau ada, live delta lebih akurat */
  serverNow?: string | null;

  /** callback setelah aksi sukses (mulai/jeda/lanjut/selesai) → refresh data */
  onChanged: () => void;

  /** Auto-pause (idle) */
  autoPauseEnabled?: boolean;
  autoPauseMinutes?: number;

  /**
   * Wajib saat mode="owner": username target yang dikontrol
   * Abaikan pada mode="user".
   */
  targetUsername?: string;
};

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1600,
  timerProgressBar: true,
});

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

function PrettyStatus({ status, durasi }: { status: Status; durasi: number }) {
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
        Gunakan tombol di bawah untuk mengelola sesi kerja.
      </p>
    </div>
  );
}

export default function JamControls({
  mode,
  status,
  activeSessionId,
  resumeTargetId,
  detikBerjalan,
  startedAt,
  serverNow,
  onChanged,
  autoPauseEnabled = true,
  autoPauseMinutes = 5,
  targetUsername,
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
      if (mode === "owner") {
        if (!targetUsername) throw new Error("Username target tidak tersedia");
        await startJamKerjaForUser(api, targetUsername);
        ok("Mulai kerja!");
      } else {
        const res = await startJamKerja(api);
        handleResp(res, "Mulai kerja!");
      }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary, canStart, canPause, canResume, canEnd, mode, targetUsername, status, activeSessionId, resumeTargetId]);

  /* ================== AUTO-PAUSE (IDLE) ================== */
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
      // event kustom dari app saat ada aksi kerja
      "work-activity",
    ];

    events.forEach((ev) => window.addEventListener(ev as any, onAny));
    reset();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev as any, onAny));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPauseEnabled, autoPauseMinutes, status, activeSessionId]);

  /* ========== AUTO-START via work-activity (HANYA mode user) ========== */
  const autoStartGuard = useRef<{ last: number; showing: boolean }>({ last: 0, showing: false });

  useEffect(() => {
    if (mode !== "user") return; // owner: tidak auto-start dari aktivitas user lain
    // hanya beraksi saat belum mulai/jeda dan tidak ada sesi aktif
    if (status === "AKTIF" || activeSessionId) return;

    const onActivity = async () => {
      // Cooldown biar nggak spam pop-up
      const now = Date.now();
      if (autoStartGuard.current.showing) return;
      if (now - autoStartGuard.current.last < 5000) return;
      autoStartGuard.current.last = now;

      autoStartGuard.current.showing = true;
      try {
        const res = await Swal.fire({
          icon: "info",
          title: "Mulai jam kerja?",
          text: "Kamu baru melakukan aktivitas kerja. Mulai jam kerja sekarang?",
          showCancelButton: true,
          confirmButtonText: "Mulai sekarang",
          cancelButtonText: "Batal",
          confirmButtonColor: "#10b981",
        });
        if (res.isConfirmed) {
          await doStart();
        }
      } finally {
        autoStartGuard.current.showing = false;
      }
    };

    window.addEventListener("work-activity", onActivity as any);
    return () => window.removeEventListener("work-activity", onActivity as any);
  }, [mode, status, activeSessionId]); // depend minimal

  return (
    <div className="relative group">
      <div className="absolute -inset-2 rounded-3xl blur-2xl opacity-70 group-hover:opacity-95 transition-opacity bg-gradient-to-br from-emerald-400/16 via-cyan-400/12 to-indigo-400/16" />
      <div className="rounded-[22px] p-[1.5px] bg-gradient-to-r from-white/10 to-white/10">
        <div className="rounded-[20px] border border-default-200/70 bg-background/90 backdrop-blur-sm">
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
              <span>
                {mode === "user"
                  ? "Tip: Untuk mengakhiri saat jeda, lanjutkan dulu sebentar lalu tekan Selesai."
                  : "Tip: Akhiri saat AKTIF, bukan ketika JEDA."}
              </span>
              {status !== "TIDAK_AKTIF" && (
                <span className="font-medium">Berjalan: {toHMS(durasiBerjalanDetik)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
