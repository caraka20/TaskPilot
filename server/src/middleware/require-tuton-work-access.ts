import type { NextFunction, Response } from "express";
import { Role, StatusKerja } from "../generated/prisma";
import { prismaClient } from "../config/database";
import { AppError } from "./app-error";
import { ERROR_CODE } from "../utils/error-codes";
import type { UserRequest } from "../types/user-request";

/**
 * Mutasi Tuton hanya boleh dilakukan ketika sesi kerja USER sedang AKTIF.
 * OWNER selalu diizinkan. USER tertentu dapat dikecualikan lewat permission
 * `canEditTutonWithoutWork` yang dibaca ulang oleh authMiddleware pada request.
 */
export async function requireTutonWorkAccess(
  req: UserRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const user = req.user;
    if (!user) {
      throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED);
    }

    if (user.role === Role.OWNER || user.canEditTutonWithoutWork) {
      next();
      return;
    }

    const activeWork = await prismaClient.jamKerja.findFirst({
      where: {
        username: user.username,
        status: StatusKerja.AKTIF,
        jamSelesai: null,
        isOpen: true,
      },
      select: { id: true },
    });

    if (!activeWork) {
      throw new AppError(
        "Mulai atau lanjutkan jam kerja terlebih dahulu sebelum mengubah data Tuton.",
        ERROR_CODE.FORBIDDEN,
        403,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
