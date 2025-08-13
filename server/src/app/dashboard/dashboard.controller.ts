import { type Response, type NextFunction } from "express"
import { type UserRequest } from "../../types/user-request"
import DashboardService from "./dashboard.service"
import { ResponseHandler } from "../../utils/response-handler"
import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { Role } from "../../generated/prisma"

export class DashboardController {
  static async summary(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.username || !req.user?.role) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)
      if (req.user.role !== Role.OWNER) throw AppError.fromCode(ERROR_CODE.FORBIDDEN)

      const data = await DashboardService.getSummary()
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }
}

export default DashboardController
