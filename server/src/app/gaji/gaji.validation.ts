import z, { ZodType } from 'zod'
import { CreateGajiRequest, UpdateGajiRequest } from './gaji.model'

export class GajiValidation {
  static readonly CREATE: ZodType<CreateGajiRequest> = z.object({
    username: z.string().min(3).max(100),
    jumlahBayar: z.number().min(1),
    catatan: z.string().nullable().optional(),
  })

  static readonly UPDATE: ZodType<UpdateGajiRequest> = z
    .object({
      jumlahBayar: z.number().min(1).optional(),
      catatan: z.string().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Minimal satu field harus diisi',
    })

  // Query GET /api/gaji/me
  static readonly GET_MY = z.object({
    page: z.union([z.number(), z.string().regex(/^\d+$/)]).default(1).transform(Number),
    limit: z.union([z.number(), z.string().regex(/^\d+$/)]).default(10).transform(Number),
    'tanggalBayar.gte': z.string().regex(/^\d{4}-\d{2}-\d{2}($|T)/).optional(),
    'tanggalBayar.lte': z.string().regex(/^\d{4}-\d{2}-\d{2}($|T)/).optional(),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
  })

  // GET /api/gaji/summary (OWNER): period = total | minggu | bulan
  static readonly SUMMARY_QUERY = z.object({
    period: z.enum(['total', 'minggu', 'bulan']).default('total'),
  })
}
