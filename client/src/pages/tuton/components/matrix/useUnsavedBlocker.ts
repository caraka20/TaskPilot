import { useEffect } from "react";
import Swal from "sweetalert2";

/** Blokir refresh/close tab + intercept link SPA */
export default function useUnsavedBlocker(active: boolean) {
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!active) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const onDocClick = async (e: Event) => {
      if (!active) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      const isExternal = /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
      if (isExternal || href.startsWith("#")) return;

      e.preventDefault();
      const ask = await Swal.fire({
        icon: "question",
        title: "Simpan perubahan?",
        text: "Ada perubahan yang belum disimpan. Simpan dulu sebelum pindah halaman?",
        showCancelButton: true,
        confirmButtonText: "Tetap Tinggalkan",
        cancelButtonText: "Batal",
      });
      if (ask.isConfirmed) {
        window.removeEventListener("beforeunload", beforeUnload);
        document.removeEventListener("click", onDocClick, true);
        window.location.href = href;
      }
    };

    if (active) {
      window.addEventListener("beforeunload", beforeUnload);
      document.addEventListener("click", onDocClick, true);
    }
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onDocClick, true);
    };
  }, [active]);
}
