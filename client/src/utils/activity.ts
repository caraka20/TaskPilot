// client/src/utils/activity.ts
export function touchTutonActivity(source?: string) {
  try {
    const bc = new BroadcastChannel("work-activity");
    bc.postMessage({ t: "act", at: Date.now(), src: source || "manual" });
    bc.close();
  } catch (_err) {
    // BroadcastChannel bisa tidak tersedia di beberapa environment
    void _err;
  }

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("wk:lastActivity", String(Date.now()));
    }
  } catch (_err) {
    // Private mode / storage diblokir
    void _err;
  }

  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tuton:activity"));
    }
  } catch (_err) {
    // Lingkungan non-DOM
    void _err;
  }
}
