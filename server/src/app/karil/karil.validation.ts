// src/app/karil/karil.validation.ts
import { z } from "zod"

export const KarilParamValidation = z.object({
  id: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive()),
})

export const KarilBodyValidation = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  tugas1: z.boolean().optional(),
  tugas2: z.boolean().optional(),
  tugas3: z.boolean().optional(),
  tugas4: z.boolean().optional(),
  keterangan: z.string().max(1000, "Keterangan terlalu panjang").optional(),
})

export const KarilListQueryValidation = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  progress: z.enum(["all","complete","incomplete"]).default("all"),
  sortBy: z.enum(["updatedAt","createdAt","namaCustomer","nim"]).default("updatedAt"),
  sortDir: z.enum(["asc","desc"]).default("desc"),
})

export type KarilParam = z.infer<typeof KarilParamValidation>
export type KarilBody = z.infer<typeof KarilBodyValidation>
export type KarilListQueryRaw = z.input<typeof KarilListQueryValidation>
export type KarilListQuery = z.infer<typeof KarilListQueryValidation>
