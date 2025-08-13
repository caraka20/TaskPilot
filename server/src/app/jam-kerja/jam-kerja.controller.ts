import { NextFunction, Response } from "express"
import { type UserRequest } from "../../types/user-request"
import { JamKerjaValidation } from "./jam-kerja.validation"
import JamKerjaService from "./jam-kerja.service"
import { ResponseHandler } from "../../utils/response-handler"
import { SUCCESS_MESSAGES } from "../../utils/success-messages"
import { Validation } from "../../middleware/validation"
import {
  type JamKerjaAktifQuery,
  type JamKerjaHistoryQuery,
  type StartJamKerjaRequest,
} from "./jam-kerja.model"
import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { Role } from "../../generated/prisma"

export class JamKerjaController {
  static async start(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
      const result = await JamKerjaService.startJamKerja({
        username: req.user.username,
      })
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.JAM_KERJA.START)
    } catch (err) {
      next(err)
    }
  }

  static async end(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id)
      const result = await JamKerjaService.endJamKerja(id)
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.JAM_KERJA.END)
    } catch (err) {
      next(err)
    }
  }

  static async getHistory(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const query = await Validation.validate<JamKerjaHistoryQuery>(
        JamKerjaValidation.HISTORY_QUERY,
        req.query as Record<string, any>
      )

      if (req.user?.role === Role.USER && req.user.username !== query.username) {
        throw AppError.fromCode(ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri")
      }

      const result = await JamKerjaService.getHistory(query.username)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async rekap(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const query = await Validation.validate(
        JamKerjaValidation.REKAP_QUERY,
        req.query as Record<string, any>
      )

      if (req.user?.role === Role.USER && req.user.username !== query.username) {
        throw AppError.fromCode(ERROR_CODE.FORBIDDEN, "USER hanya bisa melihat datanya sendiri")
      }

      const result = await JamKerjaService.rekap(query.username, query.period)
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.FETCHED.REKAP_JAM_KERJA)
    } catch (err) {
      next(err)
    }
  }

  static async getActive(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user
      if (!user?.username || !user?.role) {
        throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
      }

      // username & period wajib → biar test "missing username" → 400
      const parsed = await Validation.validate(
        JamKerjaValidation.AKTIF_QUERY,
        req.query as Record<string, any>
      )

      const data = await JamKerjaService.getActive(
        { username: user.username, role: user.role },
        parsed
      )

      return ResponseHandler.success(res, data, SUCCESS_MESSAGES.FETCHED.AKTIF_JAM_KERJA)
    } catch (err) {
      next(err)
    }
  }

  /**
   * LEGACY — tetap disediakan bila masih dipakai di tempat lain.
   * (Mengembalikan bentuk JamKerjaResponse[], bukan JamKerjaAktifResponse[])
   */
  static async getAktif(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const query: JamKerjaAktifQuery = {
        username: req.query.username as string,
        period: req.query.period as "minggu" | "bulan" | undefined,
      }

      if (req.user?.role === Role.USER && req.user.username !== query.username) {
        throw AppError.fromCode(ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri")
      }

      const result = await JamKerjaService.getAktif(query)
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.FETCHED.AKTIF_JAM_KERJA)
    } catch (err) {
      next(err)
    }
  }

  static async pause(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.username || !req.user?.role) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
      const id = Number(req.params.id)
      const result = await JamKerjaService.pause({ username: req.user.username, role: req.user.role }, id)
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES?.JAM_KERJA?.PAUSE)
    } catch (err) {
      next(err)
    }
  }

  static async resume(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.username || !req.user?.role) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
      const id = Number(req.params.id)
      const result = await JamKerjaService.resume({ username: req.user.username, role: req.user.role }, id)
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES?.JAM_KERJA?.RESUME)
    } catch (err) {
      next(err)
    }
  }
}

export default JamKerjaController
