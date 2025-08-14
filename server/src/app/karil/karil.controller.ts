// src/app/karil/karil.controller.ts
import { type Request, type Response, type NextFunction } from "express"
import { ResponseHandler } from "../../utils/response-handler"
import { KarilBodyValidation, KarilParamValidation } from "./karil.validation"
import { KarilService } from "./karil.service"

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
}
