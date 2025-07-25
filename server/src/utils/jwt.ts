import jwt from 'jsonwebtoken'

export interface TokenPayload {
  username: string
}

const SECRET_KEY = process.env.JWT_SECRET_KEY as string
const EXPIRES_IN = '12h'

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as TokenPayload
  } catch {
    return null
  }
}
