import { Request, Response, NextFunction } from 'express'
import { GajiService } from './gaji.service'
import { GajiValidation } from './gaji.validation'
import { ResponseHandler } from '../../utils/response-handler'
import { SUCCESS_MESSAGES } from '../../utils/success-messages'
import { Validation } from '../../middleware/validation'
import { CreateGajiRequest, GetMyGajiInput } from './gaji.model'
import { UserRequest } from '../../types/user-request'

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

  static async getAllGaji(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GajiService.getAllGaji(req.query)
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.FETCHED.GAJI)
    } catch (err) {
      next(err)
    }
  }

  static async deleteGaji(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      await GajiService.deleteById(id)
      return ResponseHandler.success(res, null, SUCCESS_MESSAGES.DELETED.GAJI)
    } catch (err) {
      next(err)
    }
  }

  static async updateGaji(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const requestUpdate = await Validation.validate(GajiValidation.UPDATE, req.body)
      const updated = await GajiService.updateById(id, requestUpdate)
      return ResponseHandler.success(res, updated, SUCCESS_MESSAGES.UPDATED.GAJI)
    } catch (err) {
      next(err)
    }
  }

  static async getMyGaji(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const username = req.user!.username
      const parsed = GajiValidation.GET_MY.parse(req.query) as GetMyGajiInput
      const data = await GajiService.getMyGaji(username, parsed)
      return res.status(200).json({ status: 'success', data })
    } catch (err) {
      next(err)
    }
  }

  // OWNER
  static async getSummary(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const raw = req.query as Record<string, any>
      const periodGuess = raw?.period ?? (raw?.scope === 'all' ? 'total' : raw?.scope) ?? 'total'
      const { period } = await Validation.validate(GajiValidation.SUMMARY_QUERY, { period: periodGuess })
      const data = await GajiService.getSummary(period)
      return ResponseHandler.success(res, data, SUCCESS_MESSAGES.FETCHED.GAJI)
    } catch (err) {
      next(err)
    }
  }

  // USER (me)
  static async getMySummary(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const username = req.user!.username
      const data = await GajiService.getMySummary(username)
      return ResponseHandler.success(res, data, SUCCESS_MESSAGES.FETCHED.GAJI)
    } catch (err) {
      next(err)
    }
  }
}
