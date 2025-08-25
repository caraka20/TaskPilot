import { NextFunction, Response } from "express";
import { type UserRequest } from "../../types/user-request";
import { JamKerjaValidation } from "./jam-kerja.validation";
import JamKerjaService from "./jam-kerja.service";
import { ResponseHandler } from "../../utils/response-handler";
import { SUCCESS_MESSAGES } from "../../utils/success-messages";
import { Validation } from "../../middleware/validation";
import { AppError } from "../../middleware/app-error";
import { ERROR_CODE } from "../../utils/error-codes";
import { Role } from "../../generated/prisma";

export class JamKerjaController {
  // START: USER selalu start untuk dirinya; OWNER boleh menarget user lain via ?username=
  static async start(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED);

      const targetUsername =
        req.user.role === Role.OWNER && typeof req.query.username === "string" && req.query.username.trim()
          ? String(req.query.username).trim()
          : req.user.username;

      await Validation.validate(JamKerjaValidation.START, { username: targetUsername });

      const result = await JamKerjaService.startJamKerja({ username: targetUsername });
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.JAM_KERJA.START);
    } catch (err) {
      next(err);
    }
  }

  // END: USER hanya boleh end miliknya sendiri; OWNER boleh end siapa pun
  static async end(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED);
      const id = Number(req.params.id);
      const result = await JamKerjaService.endJamKerja(
        { username: req.user.username, role: req.user.role },
        id
      );
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.JAM_KERJA.END);
    } catch (err) {
      next(err);
    }
  }

  static async getHistory(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const query = await Validation.validate(
        JamKerjaValidation.HISTORY_QUERY,
        req.query as Record<string, any>
      );

      if (req.user?.role === Role.USER && req.user.username !== query.username) {
        throw AppError.fromCode(ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
      }

      const result = await JamKerjaService.getHistory(query.username);
      return ResponseHandler.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async rekap(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const query = await Validation.validate(
        JamKerjaValidation.REKAP_QUERY,
        req.query as Record<string, any>
      );

      if (req.user?.role === Role.USER && req.user.username !== query.username) {
        throw AppError.fromCode(ERROR_CODE.FORBIDDEN, "USER hanya bisa melihat datanya sendiri");
      }

      const result = await JamKerjaService.rekap(query.username, query.period);
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.FETCHED.REKAP_JAM_KERJA);
    } catch (err) {
      next(err);
    }
  }

  static async getActive(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user?.username || !user?.role) {
        throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED);
      }

      const parsed = await Validation.validate(
        JamKerjaValidation.AKTIF_QUERY,
        req.query as Record<string, any>
      );

      const data = await JamKerjaService.getActive(
        { username: user.username, role: user.role },
        parsed
      );

      return ResponseHandler.success(res, data, SUCCESS_MESSAGES.FETCHED.AKTIF_JAM_KERJA);
    } catch (err) {
      next(err);
    }
  }

  // LEGACY
  static async getAktif(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const query = {
        username: req.query.username as string,
        period: req.query.period as "minggu" | "bulan" | undefined,
      };

      if (req.user?.role === Role.USER && req.user.username !== query.username) {
        throw AppError.fromCode(ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
      }

      const result = await JamKerjaService.getAktif(query);
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.FETCHED.AKTIF_JAM_KERJA);
    } catch (err) {
      next(err);
    }
  }

  // PAUSE: USER hanya miliknya; OWNER boleh siapa pun
  static async pause(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.username || !req.user?.role) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED);
      const id = Number(req.params.id);
      const result = await JamKerjaService.pause(
        { username: req.user.username, role: req.user.role },
        id
      );
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES?.JAM_KERJA?.PAUSE);
    } catch (err) {
      next(err);
    }
  }

  // RESUME: USER hanya miliknya; OWNER boleh siapa pun
  static async resume(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.username || !req.user?.role) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED);
      const id = Number(req.params.id);
      const result = await JamKerjaService.resume(
        { username: req.user.username, role: req.user.role },
        id
      );
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES?.JAM_KERJA?.RESUME);
    } catch (err) {
      next(err);
    }
  }

  static async ownerSummary(req: UserRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== Role.OWNER) throw AppError.fromCode(ERROR_CODE.FORBIDDEN);
      const q = await JamKerjaValidation.OWNER_SUMMARY_QUERY.parseAsync(req.query);
      const data = await JamKerjaService.buildOwnerSummary(q.username);
      return ResponseHandler.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async userSummary(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const q = await JamKerjaValidation.USER_SUMMARY_QUERY.parseAsync(req.query);
      if (req.user?.role === Role.USER && req.user.username !== q.username) {
        throw AppError.fromCode(ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
      }
      const data = await JamKerjaService.buildUserSummary(q.username);
      return ResponseHandler.success(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export default JamKerjaController;
