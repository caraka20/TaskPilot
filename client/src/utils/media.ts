const configuredApiBaseUrl = String(
  import.meta.env.VITE_API_BASE_URL ?? "",
).trim();

const developmentApiBaseUrl = import.meta.env.DEV
  ? String(
      import.meta.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000",
    ).trim()
  : "";

/**
 * Mengubah path upload backend menjadi URL yang dapat dibuka browser.
 *
 * Development:
 * /uploads/avatar.jpg -> http://localhost:3000/uploads/avatar.jpg
 *
 * Production:
 * Mengikuti VITE_API_BASE_URL.
 */
export function resolveBackendAssetUrl(
  path: string | null | undefined,
  baseUrl = configuredApiBaseUrl,
) {
  const cleanPath = path?.trim();

  if (!cleanPath) return undefined;

  if (/^(?:https?:|data:|blob:)/i.test(cleanPath)) {
    return cleanPath;
  }

  const normalizedPath = cleanPath.startsWith("/")
    ? cleanPath
    : `/${cleanPath}`;

  const normalizedBase = (
    baseUrl ||
    configuredApiBaseUrl ||
    developmentApiBaseUrl
  )
    .trim()
    .replace(/\/+$/, "");

  return normalizedBase
    ? `${normalizedBase}${normalizedPath}`
    : normalizedPath;
}