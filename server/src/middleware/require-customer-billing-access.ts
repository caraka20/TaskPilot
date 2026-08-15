import type { NextFunction, Response } from "express"
import { AppError } from "./app-error"
import { ERROR_CODE } from "../utils/error-codes"
import type { UserRequest } from "../types/user-request"

/**
 * Mengizinkan OWNER atau USER yang secara eksplisit diberi hak kelola tagihan.
 * Nilai permission dibaca dari database oleh authMiddleware pada setiap request,
 * sehingga pencabutan akses langsung berlaku tanpa perlu menerbitkan token baru.
 */
export function requireCustomerBillingAccess(
  req: UserRequest,
  _res: Response,
  next: NextFunction,
) {
  const user = req.user
  if (!user || (user.role !== "OWNER" && !user.canViewCustomerBilling)) {
    throw AppError.fromCode(ERROR_CODE.FORBIDDEN)
  }

  next()
}
