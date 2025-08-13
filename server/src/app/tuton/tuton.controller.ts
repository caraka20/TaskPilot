import { NextFunction, Response } from "express"
import { UserRequest } from "../../types/user-request"
import { Validation } from "../../middleware/validation"
import { ResponseHandler } from "../../utils/response-handler"
import { TutonValidation } from "./tuton.validation"
import { TutonService } from "./tuton.service"
import { AddCourseRequest, CourseIdParam, CustomerIdParam } from "./tuton.model"
import { TutonItemValidation } from "../tuton-item/tuton-item.validation"
import { TutonSummaryService } from "../tuton-item/tuton-item.service"
import { TutonRepository } from "./tuton.repository"
import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { SUCCESS_MESSAGES } from "../../utils/success-messages"

export class TutonController {
  static async addCourse(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = await Validation.validate<CustomerIdParam>(TutonValidation.CUSTOMER_ID_PARAM, req.params as any)
      const body = await Validation.validate<AddCourseRequest>(TutonValidation.ADD_COURSE_BODY, req.body)

      const result = await TutonService.addCourse(id, body)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async deleteCourse(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = await Validation.validate<CourseIdParam>(TutonValidation.COURSE_ID_PARAM, req.params as any)
      const result = await TutonService.deleteCourse(courseId)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async getConflicts(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const data = await TutonService.getConflicts()
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async getConflictByMatkul(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { matkul } = await Validation.validate(TutonValidation.CONFLICT_MATKUL_PARAM, req.params as any)
      const data = await TutonService.getConflictByMatkul(matkul)
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async summary(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = TutonValidation.COURSE_ID_PARAM.parse(req.params);
      const exists = await TutonRepository.exists(courseId);
      if (!exists) {
        throw AppError.fromCode(ERROR_CODE.NOT_FOUND);
      }
      const summary = await TutonRepository.getSummary(courseId);

      return ResponseHandler.success(res, { courseId, ...summary });
    } catch (err) {
      next(err);
    }
  }

}

export default TutonController
