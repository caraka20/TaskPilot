import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  namaLengkap: z.string().min(1),
  role: z.enum(['ADMIN', 'USER']).optional()
})
