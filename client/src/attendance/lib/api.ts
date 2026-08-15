import { useAuthStore } from "../../store/auth.store";

const endpoint = (path: string) => {
  const baseUrl = useAuthStore.getState().baseUrl.replace(/\/$/, "");
  return `${baseUrl}/api/attendance${path}`;
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ApiOptions = RequestInit;

function errorMessage(body: any, fallback: string) {
  const details = body?.details ?? body?.errors ?? body?.error?.details
  if (typeof body?.message === "string" && body.message.trim()) return body.message
  if (typeof body?.error?.message === "string" && body.error.message.trim()) return body.error.message
  if (typeof body?.errors === "string" && body.errors.trim()) return body.errors
  if (Array.isArray(body?.errors)) {
    const joined = body.errors
      .map((item: any) => item?.message ?? item)
      .filter(Boolean)
      .join("; ")
    if (joined) return joined
  }
  if (details && typeof details === "object") {
    const joined = Object.values(details).flat().filter(Boolean).join("; ")
    if (joined) return joined
  }
  return fallback
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status === "error") {
    throw new ApiError(
      errorMessage(body, `Permintaan gagal diproses (${response.status}).`),
      response.status,
      body?.details,
    );
  }
  return (body?.status === "success" ? body.data : body) as T;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const init = options;
  const token = useAuthStore.getState().token;
  const hasJsonBody = Boolean(init.body) && !(init.body instanceof FormData);
  const response = await fetch(endpoint(path), {
    ...init,
    headers: {
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  return parseResponse<T>(response);
}

export async function download(path: string, filename: string) {
  const token = useAuthStore.getState().token;
  const response = await fetch(endpoint(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(errorMessage(error, `File gagal diunduh (${response.status}).`), response.status);
  }
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
