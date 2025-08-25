import Swal from "sweetalert2";
import { extractErrorText } from "./apiError";

export async function showApiError(err: unknown) {
  const msg = extractErrorText(err);
  return Swal.fire({ icon: "error", title: msg, confirmButtonText: "OK" });
}
