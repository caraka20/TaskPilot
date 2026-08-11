import { z, type ZodType } from "zod"
import {
  UpdateKonfigurasiRequest,
  GetEffectiveKonfigurasiRequest,
  PutOverrideKonfigurasiRequest,
} from "./konfigurasi.model"

function atLeastOneKey<T extends object>() {
  return (val: T, ctx: z.RefinementCtx) => {
    if (Object.keys(val ?? {}).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimal satu field harus diisi",
      })
    }
  }
}

export class KonfigurasiValidation {
  // PATCH /api/konfigurasi
  static readonly UPDATE_GLOBAL: ZodType<UpdateKonfigurasiRequest> = z
    .object({
      gajiPerJam: z.number().min(1000).optional(),
      batasJedaMenit: z.number().min(1).max(120).optional(),
      jedaOtomatisAktif: z.boolean().optional(),
    })
    .superRefine(atLeastOneKey())

  // GET /api/konfigurasi/effective?username=...
  static readonly GET_EFFECTIVE: ZodType<GetEffectiveKonfigurasiRequest> = z.object({
    username: z.string().min(6).max(20),
  })

  // PUT /api/konfigurasi/overrides/:username
  static readonly PUT_OVERRIDE: ZodType<PutOverrideKonfigurasiRequest> = z
    .object({
      gajiPerJam: z.number().min(1000).optional(),
      batasJedaMenit: z.number().min(1).max(120).optional(),
      jedaOtomatisAktif: z.boolean().optional(),
    })
    .superRefine(atLeastOneKey())

  static readonly PARAM_USERNAME = z.object({
    username: z.string().min(6).max(20),
  })

  static readonly DELETE_OVERRIDE = z.object({
    username: z.string().min(1, "Username wajib diisi"),
  })
}
