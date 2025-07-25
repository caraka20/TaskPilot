import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { AppError } from './app-error'
import { ERROR_CODE } from '../utils/error-codes'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
  }

  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)

  if (!payload) {
    throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
  }

  req.user = payload
  next()
}
