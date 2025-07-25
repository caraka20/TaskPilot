import { ERROR_DEFINITIONS, ErrorCode } from '../utils/error-codes'

export class AppError extends Error {
  code: ErrorCode
  statusCode: number
  details?: unknown

  constructor(message: string, code: ErrorCode, statusCode: number, details?: unknown) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }

  static fromCode(code: ErrorCode, details?: unknown) {
    const def = ERROR_DEFINITIONS[code]
    return new AppError(def.message, code, def.httpStatus, details)
  }
}
