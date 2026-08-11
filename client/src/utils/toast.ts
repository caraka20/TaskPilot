// client/src/utils/toast.ts
import Swal from "sweetalert2";

export const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1800,
  timerProgressBar: true,
});

export const showToast = (icon: "success" | "error" | "warning" | "info", title: string, text?: string) =>
  toast.fire({ icon, title, text });
