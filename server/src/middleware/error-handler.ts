import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { errorResponse } from '../utils/api-response'
import { AppError } from './app-error'

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Zod validation error
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      field: e.path?.join('.') || '(unknown)',
      message: e.message,
    }))

    return errorResponse(
      res,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    )
  }

  // Custom AppError
  if (err instanceof AppError) {
    return errorResponse(
      res,
      err.message,
      err.statusCode || 500,
      err.code || "INTERNAL_SERVER_ERROR",
      err.details
    )
  }

// Generic JavaScript Error
if (err instanceof Error) {
  return errorResponse(
    res,
    err.message || 'Unexpected error',
    500,
    'INTERNAL_SERVER_ERROR'
  )
}

// Unknown error (fallback)
return errorResponse(
  res,
  'Unknown error',
  500,
  'INTERNAL_SERVER_ERROR'
)
}