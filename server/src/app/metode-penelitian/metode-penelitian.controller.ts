import type { NextFunction, Request, Response } from "express"
import { Validation } from "../../middleware/validation"
import { ResponseHandler } from "../../utils/response-handler"
import { MetodePenelitianService } from "./metode-penelitian.service"
import {
  MetodePenelitianBodyValidation,
  MetodePenelitianListQueryValidation,
  MetodePenelitianParamValidation,
} from "./metode-penelitian.validation"

export class MetodePenelitianController {
  static async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = MetodePenelitianParamValidation.parse(req.params)
      const body = MetodePenelitianBodyValidation.parse(req.body)
      return ResponseHandler.success(res, await MetodePenelitianService.upsert(id, body), "Metode Penelitian berhasil disimpan")
    } catch (error) { next(error) }
  }

  static async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = MetodePenelitianParamValidation.parse(req.params)
      return ResponseHandler.success(res, await MetodePenelitianService.detail(id))
    } catch (error) { next(error) }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = Validation.validate(MetodePenelitianListQueryValidation, req.query)
      return ResponseHandler.success(res, await MetodePenelitianService.list(query))
    } catch (error) { next(error) }
  }
}
