import z, { ZodType } from "zod"
import { JamKerjaAktifQuery, JamKerjaHistoryQuery, RekapJamKerjaQuery, StartJamKerjaRequest } from "./jam-kerja.model"

const PERIOD_MAP: Record<string, 'minggu' | 'bulan'> = {
  minggu: 'minggu', week: 'minggu', weekly: 'minggu', w: 'minggu',
  bulan: 'bulan', month: 'bulan', monthly: 'bulan', m: 'bulan',
}

export class JamKerjaValidation {
  static readonly START: ZodType<StartJamKerjaRequest> = z.object({
    username: z.string().min(3).max(100),
  })

  static readonly HISTORY_QUERY: ZodType<JamKerjaHistoryQuery> = z.object({
    username: z.string().min(3)
  })

  static readonly REKAP_QUERY : ZodType<RekapJamKerjaQuery> = z.object({
    username: z.string().min(3),
    period: z.enum(['minggu', 'bulan'])
  })

  // NEW: untuk /api/jam-kerja/aktif → KEMBALIKAN REKAP
  // Harus ada username & period (biar test "missing username" → 400)
  static readonly AKTIF_QUERY = z.object({
    username: z.string().min(3),
    period: z.enum(['minggu', 'bulan']),
  })
}
