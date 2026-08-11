import { isAxiosError } from "axios";

export function extractErrorText(err: unknown): string {
  if (isAxiosError(err)) {
    const d: any = err.response?.data ?? {};
    if (typeof d?.errors === "string" && d.errors.trim()) return d.errors.trim();
    if (Array.isArray(d?.errors)) return d.errors.join("\n");
    if (d?.errors && typeof d.errors === "object") {
      try {
        const lines = Object.values(d.errors as Record<string, any>)
          .flat()
          .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
          .join("\n");
        if (lines.trim()) return lines;
      } catch (e) {
        console.log(e);
        
      }
    }
    if (typeof d?.message === "string" && d.message.trim()) return d.message.trim();
    if (typeof d?.code === "string" && d.code.trim()) return d.code.trim();
  }
  return err instanceof Error ? err.message : "Terjadi kesalahan.";
}
