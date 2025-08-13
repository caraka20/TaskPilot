import { Response, NextFunction,Request } from 'express'
import { verifyToken } from '../utils/jwt'
import { AppError } from './app-error'
import { ERROR_CODE } from '../utils/error-codes'
import { UserRequest } from '../types/user-request'
import { prismaClient } from '../config/database' 

export const authMiddleware = async ( req: UserRequest, res: Response, next: NextFunction
) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
  }

  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)

  if (!payload || !payload.username) {
    throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
  }

  const user = await prismaClient.user.findUnique({
    where: { username: payload.username },
  })

  if (!user) {
    throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
  }

  req.user = user
  next()
}
