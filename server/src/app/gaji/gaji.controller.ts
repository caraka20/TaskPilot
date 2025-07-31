import { Request, Response, NextFunction } from 'express'
import { GajiService } from './gaji.service'
import { GajiValidation } from './gaji.validation'
import { ResponseHandler } from '../../utils/response-handler' 
import { SUCCESS_MESSAGES } from '../../utils/success-messages'
import { Validation } from '../../middleware/validation'
import { CreateGajiRequest } from './gaji.model'

export class GajiController {

  static async createGaji(req: Request, res: Response, next: NextFunction) {
    try {
        const request = Validation.validate<CreateGajiRequest>(GajiValidation.CREATE, req.body)
        const result = await GajiService.createGaji(request)
        return ResponseHandler.success(res, result, SUCCESS_MESSAGES.CREATED.GAJI)
    } catch (err) {
        next(err)
    }
  }

  // Ambil semua data gaji
  static async getAllGaji(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GajiService.getAllGaji()
      return ResponseHandler.success(res, result)
    } catch (err) {
        next(err)
    }
  }

}
