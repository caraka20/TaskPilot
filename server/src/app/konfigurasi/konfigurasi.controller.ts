// src/app/konfigurasi/konfigurasi.controller.ts
import { type Request, type Response, type NextFunction } from 'express'
import { KonfigurasiService } from './konfigurasi.service'
import { ResponseHandler } from '../../utils/response-handler'
import { Validation } from '../../middleware/validation'
import { KonfigurasiValidation } from './konfigurasi.validation'
import { type UserRequest } from '../../types/user-request'
import {
  type UpdateKonfigurasiRequest,
  type GetEffectiveKonfigurasiRequest,
  type PutOverrideKonfigurasiRequest,
} from './konfigurasi.model'
import { AppError } from '../../middleware/app-error'
import { ERROR_CODE } from '../../utils/error-codes'

export class KonfigurasiController {
  // GET /api/konfigurasi  (OWNER)
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await KonfigurasiService.get()
      return ResponseHandler.success(res, data, 'Konfigurasi berhasil diambil')
    } catch (err) {
      next(err)
    }
  }

  // PATCH /api/konfigurasi  (OWNER)
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = Validation.validate<UpdateKonfigurasiRequest>(
        KonfigurasiValidation.UPDATE_GLOBAL,
        req.body
      )
      const result = await KonfigurasiService.update(payload)
      return ResponseHandler.success(res, result, 'Konfigurasi berhasil diperbarui')
    } catch (error) {
      next(error)
    }
  }

  // GET /api/konfigurasi/effective?username=...  (OWNER; USER hanya diri sendiri)
  static async getEffective(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { username } = Validation.validate<GetEffectiveKonfigurasiRequest>(
        KonfigurasiValidation.GET_EFFECTIVE,
        req.query
      )

      // 🔒 USER hanya boleh akses dirinya sendiri
      const role = req.user?.role
      const requester = req.user?.username
      if (role === 'USER' && requester !== username) {
        throw AppError.fromCode(
          ERROR_CODE.FORBIDDEN,
          'Tidak berwenang mengakses konfigurasi user lain'
        )
      }

      const data = await KonfigurasiService.getEffective(username)
      return ResponseHandler.success(res, data, 'Konfigurasi efektif berhasil diambil')
    } catch (error) {
      next(error)
    }
  }

  // PUT /api/konfigurasi/override/:username  (OWNER)
  static async putOverride(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { username } = Validation.validate<{ username: string }>(
        KonfigurasiValidation.PARAM_USERNAME,
        req.params
      )

      const payload = Validation.validate<PutOverrideKonfigurasiRequest>(
        KonfigurasiValidation.PUT_OVERRIDE,
        req.body
      )

      const data = await KonfigurasiService.putOverride(username, payload)
      return ResponseHandler.success(res, data, 'Override konfigurasi berhasil disimpan')
    } catch (error) {
      next(error)
    }
  }

  // DELETE /api/konfigurasi/override/:username  (OWNER)
  static async deleteOverride(req: Request, res: Response, next: NextFunction) {
    try {
      const params = Validation.validate(KonfigurasiValidation.DELETE_OVERRIDE, req.params)
      const result = await KonfigurasiService.deleteOverride(params.username)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }
}
