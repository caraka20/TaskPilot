// src/app/karil/karil.controller.ts
import { type Request, type Response, type NextFunction } from "express"
import { ResponseHandler } from "../../utils/response-handler"
import { KarilBodyValidation, KarilParamValidation, KarilListQueryValidation } from "./karil.validation"
import { KarilService } from "./karil.service"
import { Validation } from "../../middleware/validation"

export class KarilController {
  static async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const params = KarilParamValidation.parse(req.params)
      const body = KarilBodyValidation.parse(req.body)
      const result = await KarilService.upsert(params.id, {
        judul: body.judul,
        tugas1: body.tugas1,
        tugas2: body.tugas2,
        tugas3: body.tugas3,
        tugas4: body.tugas4,
        keterangan: body.keterangan,
      })
      return ResponseHandler.success(res, result, "Berhasil upsert KARIL detail")
    } catch (err) {
      next(err)
    }
  }

  /** GET detail KARIL by customerId */
  static async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = KarilParamValidation.parse(req.params)
      const data = await KarilService.getDetail(id)
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  /** GET list semua KARIL (paging, search, filter progress, sort) */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = Validation.validate(KarilListQueryValidation, req.query)
      const data = await KarilService.listAll(query)
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }
}
