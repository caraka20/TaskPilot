import type { Response } from 'express'
import { ERROR_DEFINITIONS, type ErrorCode } from './error-codes'

export interface ApiResponse<T> {
  status: 'success' | 'error'
  message: string
  code?: ErrorCode
  data?: T
  errors?: any
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  })
}

export const errorResponse = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  code: ErrorCode = 'INTERNAL_SERVER_ERROR',
  errors?: unknown
): Response<ApiResponse<null>> => {
  return res.status(statusCode).json({
    status: 'error',
    code,
    message,
    errors,
  })
}

export const errorResponseFromCode = (
  res: Response,
  code: ErrorCode,
  errors?: unknown
): Response<ApiResponse<null>> => {
  const def = ERROR_DEFINITIONS[code]
  return errorResponse(res, def.message, def.httpStatus, code, errors)
}
