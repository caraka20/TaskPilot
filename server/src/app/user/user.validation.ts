import { z, ZodType } from 'zod'
import { UserDetailRequest, LoginRequest, RegisterRequest } from './user.model'

export class UserValidation {
    static readonly CREATE : ZodType<RegisterRequest> = z.object({
      password: z.string().min(6).max(20),
      namaLengkap: z.string().min(6),
      username : z.string().min(6).max(10)
    })

    static readonly LOGIN : ZodType<LoginRequest> = z.object({
      username : z.string().min(6).max(20),
      password : z.string().min(6).max(20)
    })

    static readonly DETAIL_USER: ZodType<UserDetailRequest> = z.object({
      username: z.string().min(6).max(20)
    })

}


