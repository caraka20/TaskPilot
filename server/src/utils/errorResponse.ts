import { ERROR_CODE, ErrorCode } from './errorCode'

export class ErrorResponse extends Error {
  public code: ErrorCode
  public statusCode: number

  constructor(code: ErrorCode, message?: string) {
    super(message || ERROR_CODE[code].message)
    this.code = code
    this.statusCode = ERROR_CODE[code].httpStatus
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
