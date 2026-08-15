import { z } from "zod"

export const MetodePenelitianParamValidation = z.object({
  id: z.coerce.number().int().positive(),
})

export const MetodePenelitianBodyValidation = z.object({
  judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(500),
  tugas1: z.boolean().optional(),
  tugas2: z.boolean().optional(),
  tugas3: z.boolean().optional(),
  tugas4: z.boolean().optional(),
  keterangan: z.string().max(1000).nullable().optional(),
})

export const MetodePenelitianListQueryValidation = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  progress: z.enum(["all", "complete", "incomplete"]).default("all"),
  tugasBelum: z.enum(["all", "1", "2", "3", "4"]).default("all"),
  sortBy: z.enum(["updatedAt", "createdAt", "namaCustomer", "nim"]).default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
})
