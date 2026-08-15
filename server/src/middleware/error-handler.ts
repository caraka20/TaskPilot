import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { errorResponse } from '../utils/api-response'
import { AppError } from './app-error'
import { MulterError } from 'multer'

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof MulterError) {
    return errorResponse(
      res,
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran foto profil maksimal 2 MB.'
        : 'File foto profil tidak dapat diproses.',
      err.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
      'BAD_REQUEST',
    )
  }
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

  // Domain attendance memakai error HTTP kecil yang sengaja independen agar
  // modul dapat diuji sendiri. Tetap ubah ke envelope TaskPilot yang sama.
  if (
    err instanceof Error &&
    typeof (err as Error & { statusCode?: unknown }).statusCode === 'number'
  ) {
    const statusCode = (err as Error & { statusCode: number }).statusCode
    return errorResponse(
      res,
      err.message,
      statusCode,
      statusCode === 401
        ? 'UNAUTHORIZED'
        : statusCode === 403
          ? 'FORBIDDEN'
          : statusCode === 404
            ? 'NOT_FOUND'
            : statusCode === 409
              ? 'CONFLICT'
              : 'BAD_REQUEST',
      (err as Error & { details?: unknown }).details,
    )
  }

  const prismaCode =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code ?? '')
      : ''

  if (prismaCode === 'P2002') {
    return errorResponse(
      res,
      'Data yang sama sudah tercatat. Muat ulang halaman lalu coba kembali.',
      409,
      'CONFLICT',
    )
  }

  if (prismaCode === 'P2025') {
    return errorResponse(res, 'Data yang diminta tidak ditemukan.', 404, 'NOT_FOUND')
  }

  if (prismaCode === 'P2021' || prismaCode === 'P2022') {
    return errorResponse(
      res,
      'Struktur database belum sesuai versi aplikasi. Jalankan migrasi database terbaru.',
      503,
      'DATABASE_MIGRATION_REQUIRED',
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
