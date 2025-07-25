import { Response } from 'express'

export class ResponseHandler {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
    })
  }

  static error(res: Response, message = 'Something went wrong', statusCode = 500) {
    return res.status(statusCode).json({
      status: 'error',
      message,
    })
  }

  static validationError(res: Response, errors: any, message = 'Validation failed', statusCode = 400) {
    return res.status(statusCode).json({
      status: 'error',
      message,
      errors,
    })
  }
}
