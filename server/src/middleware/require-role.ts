import { Response, NextFunction } from 'express'
import { AppError } from './app-error'
import { ERROR_CODE } from '../utils/error-codes'
import { UserRequest } from '../types/user-request'

export function requireRole(...allowedRoles: string[]) {
  return (req: UserRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role

    if (!role || !allowedRoles.includes(role)) {
      throw AppError.fromCode(ERROR_CODE.FORBIDDEN)
    }

    next()
  }
}
