import Swal from "sweetalert2";
import { extractErrorText } from "./apiError";

// Error alert (sudah ada)
export async function showApiError(err: unknown) {
  const msg = extractErrorText(err);
  return Swal.fire({
    icon: "error",
    title: "Gagal",
    text: msg,
    confirmButtonText: "OK",
  });
}

// ✅ sukses umum
export async function showSuccess(title = "Berhasil", text?: string) {
  return Swal.fire({
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
}) {
  return Swal.fire({
    icon: "warning",
    title: options?.title ?? "Apakah kamu yakin?",
    text: options?.text ?? "Tindakan ini tidak bisa dibatalkan.",
    showCancelButton: true,
    confirmButtonText: options?.confirmText ?? "Ya, lanjut",
    cancelButtonText: "Batal",
    reverseButtons: true,
    confirmButtonColor: "#ef4444", // merah elegan
    cancelButtonColor: "#64748b", // slate-500
  });
}

// ⏳ loading modal
export function showLoading(text = "Memproses...") {
  Swal.fire({
    title: text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
    background: "#0b1220",
    color: "#e5e7eb",
  });
}

// ✅ close loading
export function closeAlert() {
  Swal.close();
}

// 🍞 toast ringan
export function showToast(title: string, icon: "success" | "error" | "info" = "success") {
  return Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1800,
    timerProgressBar: true,
  }).fire({ icon, title });
}
