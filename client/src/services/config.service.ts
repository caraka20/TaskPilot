// src/services/config.service.ts
import type { AxiosInstance, AxiosResponse } from "axios"
import { apiPut, apiDelete } from "../lib/http"

// ===== Types (dipakai FE) =====
export type KonfigurasiResponse = {
  gajiPerJam?: number
  batasJedaMenit?: number
  jedaOtomatisAktif?: boolean
}

type ApiEnvelope<T> = {
  status: "success" | "error"
  data?: T
  message?: string
}

// Raw dari BE (akomodir snake_case / variasi)
type RawConfig = {
  gajiPerJam?: number
  gaji_per_jam?: number
  gaji?: number

  batasJedaMenit?: number
  batas_jeda_menit?: number
  batasJeda?: number

  jedaOtomatisAktif?: boolean
  jeda_otomatis_aktif?: boolean
  jedaOtomatis?: boolean
}

// Payload khusus /konfigurasi/effective
type EffectivePayload = {
  scope?: "GLOBAL" | "OVERRIDE" | string
  username?: string
  effective?: RawConfig
  sources?: {
    global?: RawConfig
    override?: RawConfig
    [k: string]: RawConfig | undefined
  }
}

// ===== Helpers =====
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

function normalizeConfig(raw: unknown): KonfigurasiResponse {
  if (!isObject(raw)) return {}
  const r = raw as RawConfig
  return {
    gajiPerJam: r.gajiPerJam ?? r.gaji_per_jam ?? r.gaji ?? undefined,
    batasJedaMenit: r.batasJedaMenit ?? r.batas_jeda_menit ?? r.batasJeda ?? undefined,
    jedaOtomatisAktif: r.jedaOtomatisAktif ?? r.jeda_otomatis_aktif ?? r.jedaOtomatis ?? undefined,
  }
}

// ===== Global config =====
export async function getGlobalConfig(api: AxiosInstance): Promise<KonfigurasiResponse> {
  const res: AxiosResponse<ApiEnvelope<RawConfig>> = await api.get("/api/konfigurasi", {
    validateStatus: (s) => s >= 200 && s < 300,
  })
  return normalizeConfig(res.data?.data)
}

export async function updateGlobalConfig(
  api: AxiosInstance,
  body: Partial<KonfigurasiResponse>
): Promise<KonfigurasiResponse> {
  // BE menerima camelCase — kalau pun balas snake_case tetap kita normalisasi
  const updated = await apiPut<KonfigurasiResponse, Partial<KonfigurasiResponse>>(
    api,
    "/api/konfigurasi",
    body
  )
  return normalizeConfig(updated)
}

// ===== Effective config (per user) =====
export async function getEffectiveConfig(
  api: AxiosInstance,
  username: string
): Promise<KonfigurasiResponse | null> {
  const res: AxiosResponse<ApiEnvelope<EffectivePayload>> = await api.get(
    "/api/konfigurasi/effective",
    {
      params: { username },
      validateStatus: (s) => (s >= 200 && s < 300) || s === 400 || s === 404,
    }
  )
  if (res.status === 400 || res.status === 404) return null
  const payload = res.data?.data
  if (!payload) return null
  const candidate =
    payload.effective ??
    payload.sources?.override ??
    payload.sources?.global ??
    (payload as unknown)

  return normalizeConfig(candidate)
}

// ===== Overrides (OWNER) =====
/**
 * Upsert override untuk user tertentu
 * PUT /api/konfigurasi/override/:username
 * body: { gajiPerJam?, batasJedaMenit?, jedaOtomatisAktif? } (partial)
 */
export async function putUserOverride(
  api: AxiosInstance,
  username: string,
  body: Partial<KonfigurasiResponse>
): Promise<{ username: string; overrides: KonfigurasiResponse }> {
  const res = await api.put<ApiEnvelope<{ username: string; overrides: RawConfig }>>(
    `/api/konfigurasi/override/${encodeURIComponent(username)}`,
    body
  )
  return {
    username,
    overrides: normalizeConfig(res.data?.data?.overrides) ?? {}
  }
}

/**
 * Hapus override untuk user
 * DELETE /api/konfigurasi/override/:username
 */
export async function deleteUserOverride(
  api: AxiosInstance,
  username: string
): Promise<{ username: string }> {
  const data = await apiDelete<{ username: string }>(
    api,
    `/api/konfigurasi/override/${encodeURIComponent(username)}`
  )
  return data
}

export async function getGlobalConfigCompat(api: AxiosInstance): Promise<KonfigurasiResponse> {
  const candidates = ["/api/konfigurasi", "/api/config/global", "/api/config"];
  let lastErr: unknown;

  for (const url of candidates) {
    try {
      const res = await api.get<ApiEnvelope<RawConfig>>(url, {
        validateStatus: (s) => s >= 200 && s < 300,
      });
      return normalizeConfig(res.data?.data);
    } catch (e: any) {
      if (e?.response?.status === 404) {
        lastErr = e;
        continue; // coba rute berikutnya
      }
      throw e; // error lain langsung lempar
    }
  }

  // kalau semua 404, lempar error terakhir
  throw lastErr ?? new Error("Global config endpoint not found");
}

/**
 * SAVE global config dengan fallback method & rute:
 * - PUT/PATCH  /api/konfigurasi
 * - PUT/PATCH  /api/config/global
 * - PUT/PATCH  /api/config
 *
 * Return: hasil normalisasi (kalau response menyertakan data), kalau tidak ada
 *         data di response, fallback kembalikan 'body' agar typed tetap enak.
 */
export async function saveGlobalConfigCompat(
  api: AxiosInstance,
  body: Partial<KonfigurasiResponse>
): Promise<KonfigurasiResponse> {
  const paths = ["/api/konfigurasi", "/api/config/global", "/api/config"];
  const methods: Array<"put" | "patch"> = ["put", "patch"];
  let lastErr: unknown;

  for (const p of paths) {
    for (const m of methods) {
      try {
        const res = await api[m]<ApiEnvelope<RawConfig>>(p, body, {
          validateStatus: (s) => s >= 200 && s < 300,
        });

        // beberapa BE balikan {status,data}, beberapa langsung object
        const maybe = (res.data as any)?.data ?? res.data;
        const normalized = normalizeConfig(maybe);

        // kalau BE tidak mengembalikan data, kembalikan body (biar ada nilai)
        return Object.keys(normalized).length ? normalized : normalizeConfig(body);
      } catch (e: any) {
        if (e?.response?.status === 404) {
          lastErr = e;
          continue; // coba method/rute lain
        }
        throw e; // error lain langsung lempar
      }
    }
  }

  throw lastErr ?? new Error("All save endpoints not found");
}