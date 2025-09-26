// client/src/utils/workActivity.ts
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export const WORK_ACTIVITY_EVENT = "work-activity";
export const WORK_STARTED_EVENT  = "work-started";

type Status = "AKTIF" | "JEDA" | "TIDAK_AKTIF";
type WorkState = {
  status: Status;
  activeSessionId: number | null;
  resumeTargetId: number | null;
};

type StartNowFn      = () => Promise<void> | void;
type ResumeNowFn     = (id: number) => Promise<void> | void;
type GetStateFn      = () => WorkState;          // baca cepat dari store (tanpa re-render)
type GetFreshStateFn = () => Promise<WorkState>; // cek server (terbaru)

let __startNow: StartNowFn | null = null;
let __resumeNow: ResumeNowFn | null = null;
let __getState: GetStateFn | null = null;
let __getFreshState: GetFreshStateFn | null = null;

/** Register handler sekali di App.tsx */
export function initWorkActivityAutoStart(
  startNow: StartNowFn,
  resumeNow: ResumeNowFn,
  getState: GetStateFn,
  getFreshState?: GetFreshStateFn
) {
  __startNow     = startNow;
  __resumeNow    = resumeNow;
  __getState     = getState;
  __getFreshState = getFreshState ?? null;

  return () => {
    __startNow = null;
    __resumeNow = null;
    __getState = null;
    __getFreshState = null;
  };
}

export function pingWorkActivity() {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(WORK_ACTIVITY_EVENT));
    }
  } catch (_err) {
    // lingkungan non-DOM / event gagal publish tidak kritis
    void _err;
  }
}

function modalAsk(opts: { title: string; text: string; confirm: string }) {
  return Swal.fire({
    icon: "info",
    title: opts.title,
    text: opts.text,
    showCancelButton: true,
    confirmButtonText: opts.confirm,
    cancelButtonText: "Batal",
    confirmButtonColor: "#10b981",
  });
}

function modalFail(title: string, text?: string) {
  return Swal.fire({ icon: "error", title, text: text || "Terjadi kesalahan" });
}

/**
 * Pastikan jam kerja aktif sebelum mutasi.
 * - AKTIF  -> lanjut true
 * - JEDA   -> tanya "Lanjutkan", lalu panggil resume (ambil targetId dari state atau refresh server)
 * - OFF    -> tanya "Mulai sekarang", lalu panggil start
 */
export async function ensureWorkActiveBeforeMutate(opts?: {
  feature?: string;
  throwOnCancel?: boolean;
}): Promise<boolean> {
  const feature = opts?.feature || "melakukan perubahan";

  // 1) baca state cepat
  let st: WorkState =
    (__getState?.() as WorkState | undefined) ?? {
      status: "TIDAK_AKTIF",
      activeSessionId: null,
      resumeTargetId: null,
    };

  // 2) kalau terlihat OFF, refresh ke server (seringnya ini ternyata JEDA)
  if (st.status === "TIDAK_AKTIF" && __getFreshState) {
    try {
      st = await __getFreshState();
    } catch (_err) {
      // kalau gagal refresh, pakai state lokal saja
      void _err;
    }
  }

  // 3) AKTIF -> aman
  if (st.status === "AKTIF") {
    pingWorkActivity();
    return true;
  }

  // 4) JEDA -> tawarkan LANJUTKAN, cari targetId dgn tegas
  if (st.status === "JEDA") {
    // cari id untuk resume: prefer resumeTargetId, lalu activeSessionId
    let targetId = st.resumeTargetId ?? st.activeSessionId ?? null;

    // kalau belum ketemu, refresh dulu ke server (strong guarantee)
    if (!targetId && __getFreshState) {
      try {
        const fresh = await __getFreshState();
        targetId = fresh.resumeTargetId ?? fresh.activeSessionId ?? null;
      } catch (_err) {
        // jika gagal, tetap lanjut dengan targetId saat ini (mungkin null)
        void _err;
      }
    }

    if (!targetId) {
      // fallback darurat: informasikan user
      await modalFail(
        "Tidak bisa lanjutkan",
        "ID sesi jeda tidak ditemukan. Coba muat ulang halaman."
      );
      return false;
    }

    const ok = await modalAsk({
      title: "Sedang Jeda",
      text: `Kamu hendak ${feature}. Lanjutkan jam kerja dulu?`,
      confirm: "Lanjutkan",
    });
    if (!ok.isConfirmed) return false;

    try {
      if (!__resumeNow) throw new Error("Resume handler tidak tersedia");
      await __resumeNow(targetId);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(WORK_STARTED_EVENT));
      }
      pingWorkActivity();
      return true;
    } catch (e: any) {
      await modalFail("Gagal lanjutkan", e?.message);
      return false;
    }
  }

  // 5) OFF -> tawarkan MULAI
  const startRes = await modalAsk({
    title: "Belum Mulai Kerja",
    text: `Kamu hendak ${feature}. Mulai jam kerja dulu?`,
    confirm: "Mulai sekarang",
  });
  if (!startRes.isConfirmed) {
    if (opts?.throwOnCancel) throw new Error("Dibatalkan: belum mulai kerja");
    return false;
  }

  try {
    if (!__startNow) throw new Error("Start handler tidak tersedia");
    await __startNow();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(WORK_STARTED_EVENT));
    }
    pingWorkActivity();
    return true;
  } catch (e: any) {
    await modalFail("Gagal mulai", e?.message);
    return false;
  }
}
