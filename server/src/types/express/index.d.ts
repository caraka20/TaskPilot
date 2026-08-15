import { User } from '../../generated/prisma'
declare module 'express-serve-static-core' {
  interface Request {
    user?: User
    auth?: {
      sub: string
      username: string
      role: 'ADMIN' | 'USER'
    }
  }
}
