// client/src/utils/workActivity.ts
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export const WORK_ACTIVITY_EVENT = "work-activity";
export const WORK_STARTED_EVENT = "work-started";

type Status = "AKTIF" | "JEDA" | "TIDAK_AKTIF";
type WorkState = {
  status: Status;
  activeSessionId: number | null;
  resumeTargetId: number | null;
};

type StartNowFn = () => Promise<void> | void;
type ResumeNowFn = (id: number) => Promise<void> | void;
type GetStateFn = () => WorkState;
type GetFreshStateFn = () => Promise<WorkState>;

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
  __startNow = startNow;
  __resumeNow = resumeNow;
  __getState = getState;
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
 * - OWNER  -> bebas tanpa jam kerja
 */
export async function ensureWorkActiveBeforeMutate(opts?: {
  feature?: string;
  throwOnCancel?: boolean;
}): Promise<boolean> {
  const feature = opts?.feature || "melakukan perubahan";

  // ✅ 0) OWNER bebas jam kerja
  try {
    let role = "";

    // cek langsung di root localStorage
    role = localStorage.getItem("role")?.toUpperCase() || "";

    // jika tidak ada, cek key lain (mis. client-auth)
    if (!role) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        try {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const obj = JSON.parse(raw);
          const candidate =
            obj?.role ?? obj?.state?.role ?? obj?.user?.role ?? obj?.auth?.role;
          if (candidate) {
            role = String(candidate).toUpperCase();
            break;
          }
        } catch {
          /* abaikan parsing gagal */
        }
      }
    }

    if (role === "OWNER") {
      return true; // skip jam kerja untuk OWNER
    }
  } catch {
    /* abaikan error localStorage */
  }

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
      void _err;
    }
  }

  // 3) AKTIF -> aman
  if (st.status === "AKTIF") {
    pingWorkActivity();
    return true;
  }

  // 4) JEDA -> tawarkan LANJUTKAN, cari targetId
  if (st.status === "JEDA") {
    let targetId = st.resumeTargetId ?? st.activeSessionId ?? null;
    if (!targetId && __getFreshState) {
      try {
        const fresh = await __getFreshState();
        targetId = fresh.resumeTargetId ?? fresh.activeSessionId ?? null;
      } catch (_err) {
        void _err;
      }
    }

    if (!targetId) {
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
