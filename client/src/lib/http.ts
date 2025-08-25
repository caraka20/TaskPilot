// client/src/lib/http.ts
import type { AxiosInstance } from "axios";

/* ===== Helpers ===== */
type Query = Record<string, unknown> | undefined;

function cleanParams(q?: Query) {
  if (!q) return q;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(q)) if (v !== undefined) out[k] = v;
  return out;
}

function pickError(payload: any): string {
  if (!payload) return "Terjadi kesalahan.";
  const er = (payload as any).errors;

  // prioritas: errors (string|array|object) -> message -> code
  if (typeof er === "string" && er.trim()) return er;
  if (Array.isArray(er) && er.length) return er.map(x => String(x ?? "")).join("\n");
  if (er && typeof er === "object") {
    const msg = Object.values(er).flat()
      .map(x => (typeof x === "string" ? x : JSON.stringify(x)))
      .join("\n")
      .trim();
    if (msg) return msg;
  }
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.code === "string" && payload.code.trim()) return payload.code;
  return "Terjadi kesalahan.";
}

function unwrapOnSuccess<T>(body: any): T {
  // envelope: { status: 'success'|'error', data, ... }
  if (body && typeof body === "object" && "status" in body) {
    if (body.status === "success") return body.data as T;
    throw new Error(pickError(body));
  }
  // tanpa envelope
  return body as T;
}

function handle<T>(status: number, data: any): T {
  if (status >= 200 && status < 300) return unwrapOnSuccess<T>(data);
  // status 4xx/5xx → lempar Error dengan pesan terbaik (errors/message/code)
  throw new Error(pickError(data));
}

/* ===== HTTP wrappers ===== */

export async function apiGet<T>(
  client: AxiosInstance,
  url: string,
  params?: Query
): Promise<T> {
  const res = await client.get(url, {
    params: cleanParams(params),
    validateStatus: () => true,
  });
  return handle<T>(res.status, res.data);
}

export async function apiPost<T, B = any>(
  client: AxiosInstance,
  url: string,
  body?: B
): Promise<T> {
  const res = await client.post(url, body, { validateStatus: () => true });
  return handle<T>(res.status, res.data);
}

export async function apiPatch<T, B = any>(
  client: AxiosInstance,
  url: string,
  body?: B
): Promise<T> {
  const res = await client.patch(url, body, { validateStatus: () => true });
  return handle<T>(res.status, res.data);
}

export async function apiPut<T, B = any>(
  client: AxiosInstance,
  url: string,
  body?: B
): Promise<T> {
  const res = await client.put(url, body, { validateStatus: () => true });
  return handle<T>(res.status, res.data);
}

export async function apiDelete<T>(
  client: AxiosInstance,
  url: string
): Promise<T> {
  const res = await client.delete(url, { validateStatus: () => true });
  return handle<T>(res.status, res.data);
}
