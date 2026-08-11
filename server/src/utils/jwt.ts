import jwt from 'jsonwebtoken'
import { getRequiredEnv } from '../config/env'

export interface TokenPayload {
  username: string
}

const EXPIRES_IN = '12h'

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, getRequiredEnv('JWT_SECRET_KEY'), {
    expiresIn: EXPIRES_IN,
  })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getRequiredEnv('JWT_SECRET_KEY')) as TokenPayload
  } catch {
    return null
  }
}
