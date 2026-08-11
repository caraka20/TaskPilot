// ==========================
// Request / Payload
// ==========================
export interface UpdateKonfigurasiRequest {
  gajiPerJam?: number
  batasJedaMenit?: number
  jedaOtomatisAktif?: boolean
}

export interface PutOverrideKonfigurasiRequest {
  gajiPerJam?: number
  batasJedaMenit?: number
  jedaOtomatisAktif?: boolean
}

export interface GetEffectiveKonfigurasiRequest {
  username: string
}

// ==========================
// Response (API shape)
// ==========================
export interface KonfigurasiResponse {
  gajiPerJam: number
  batasJedaMenit: number
  jedaOtomatisAktif: boolean
}

export interface OverrideResponse {
  username: string
  overrides: {
    gajiPerJam?: number
    batasJedaMenit?: number
    jedaOtomatisAktif?: boolean
  }
  updatedAt?: string | Date
}

// ==========================
// DTO (lapisan service/repo)
// ==========================
export type KonfigurasiGlobalDTO = Readonly<{
  id: number
  gajiPerJam: number
  batasJedaMenit: number
  jedaOtomatisAktif: boolean
  updatedAt: Date
}>

export type KonfigurasiOverrideDTO =
  | Readonly<{
      username: string
      gajiPerJam?: number | null
      batasJedaMenit?: number | null
      jedaOtomatisAktif?: boolean | null
      updatedAt: Date
    }>
  | null

export type EffectiveKonfigurasiDTO = Readonly<{
  scope: "USER" | "GLOBAL"
  username: string
  effective: {
    gajiPerJam: number
    batasJedaMenit: number
    jedaOtomatisAktif: boolean
  }
  sources: {
    global: {
      gajiPerJam: number
      batasJedaMenit: number
      jedaOtomatisAktif: boolean
    }
    override?: {
      gajiPerJam?: number
      batasJedaMenit?: number
      jedaOtomatisAktif?: boolean
    }
  }
}>

// ==========================
// Mapper / Helpers
// ==========================
type WithKonfigurasiFields = {
  gajiPerJam: number
  batasJedaMenit: number
  jedaOtomatisAktif: boolean
}

export function toKonfigurasiResponse<T extends WithKonfigurasiFields>(
  data: T
): KonfigurasiResponse {
  return {
    gajiPerJam: data.gajiPerJam,
    batasJedaMenit: data.batasJedaMenit,
    jedaOtomatisAktif: data.jedaOtomatisAktif,
  }
}

export function mergeEffective(
  globalCfg: KonfigurasiGlobalDTO,
  overrideCfg: KonfigurasiOverrideDTO | undefined | null,
  username: string
): EffectiveKonfigurasiDTO {
  const effective = {
    gajiPerJam: overrideCfg?.gajiPerJam ?? globalCfg.gajiPerJam,
    batasJedaMenit: overrideCfg?.batasJedaMenit ?? globalCfg.batasJedaMenit,
    jedaOtomatisAktif: overrideCfg?.jedaOtomatisAktif ?? globalCfg.jedaOtomatisAktif,
  }

  const sources: EffectiveKonfigurasiDTO["sources"] = {
    global: {
      gajiPerJam: globalCfg.gajiPerJam,
      batasJedaMenit: globalCfg.batasJedaMenit,
      jedaOtomatisAktif: globalCfg.jedaOtomatisAktif,
    },
  }

  if (overrideCfg) {
    const ov: NonNullable<EffectiveKonfigurasiDTO["sources"]["override"]> = {}
    if (overrideCfg.gajiPerJam != null) ov.gajiPerJam = overrideCfg.gajiPerJam
    if (overrideCfg.batasJedaMenit != null) ov.batasJedaMenit = overrideCfg.batasJedaMenit
    if (overrideCfg.jedaOtomatisAktif != null) ov.jedaOtomatisAktif = overrideCfg.jedaOtomatisAktif
    if (Object.keys(ov).length > 0) sources.override = ov
  }

  return {
    scope: overrideCfg ? "USER" : "GLOBAL",
    username,
    effective,
    sources,
  }
}
