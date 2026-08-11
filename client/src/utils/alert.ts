import Swal from "sweetalert2";
import { extractErrorText } from "./apiError";

function alertTheme() {
  const dark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return {
    background: dark ? "#101827" : "#ffffff",
    color: dark ? "#e8edf7" : "#172033",
    customClass: {
      popup: "taskpilot-alert",
      confirmButton: "taskpilot-alert-button",
      cancelButton: "taskpilot-alert-button",
    },
  };
}

// Error alert (sudah ada)
export async function showApiError(err: unknown) {
  const msg = extractErrorText(err);
  return Swal.fire({
    ...alertTheme(),
    icon: "error",
    title: "Gagal",
    text: msg,
    confirmButtonText: "OK",
  });
}

// ✅ sukses umum
export async function showSuccess(title = "Berhasil", text?: string) {
  return Swal.fire({
    ...alertTheme(),
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: "#0ea5e9", // sky-500
  });
}

// ⚠️ konfirmasi (hapus, update, dll)
export async function showConfirm(options?: {
  title?: string;
  text?: string;
  confirmText?: string;
  tone?: "primary" | "danger";
}) {
  const isPrimary = options?.tone === "primary";
  return Swal.fire({
    ...alertTheme(),
    icon: "warning",
    title: options?.title ?? "Apakah kamu yakin?",
    text: options?.text ?? "Tindakan ini tidak bisa dibatalkan.",
    showCancelButton: true,
    confirmButtonText: options?.confirmText ?? "Ya, lanjut",
    cancelButtonText: "Batal",
    reverseButtons: true,
    confirmButtonColor: isPrimary ? "#5b5ce2" : "#e54868",
    cancelButtonColor: "#64748b", // slate-500
  });
}

// ⏳ loading modal
export function showLoading(text = "Memproses...") {
  Swal.fire({
    ...alertTheme(),
    title: text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
}

// ✅ close loading
export function closeAlert() {
  Swal.close();
}

// 🍞 toast ringan
export function showToast(title: string, icon: "success" | "error" | "info" = "success") {
  return Swal.mixin({
    ...alertTheme(),
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  }).fire({ icon, title });
}
