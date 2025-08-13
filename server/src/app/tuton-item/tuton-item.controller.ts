import { NextFunction, Response } from "express"
import { UserRequest } from "../../types/user-request"
import { ResponseHandler } from "../../utils/response-handler"
import { Validation } from "../../middleware/validation"
import { TutonItemValidation } from "./tuton-item.validation"
import { TutonItemService } from "./tuton-item.service"
import { CourseIdParam, ItemIdParam, UpdateNilaiRequest, UpdateStatusRequest, UpdateTutonItemRequest } from "./tuton-item.model"

export class TutonItemController {
  static async listByCourse(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = await Validation.validate<CourseIdParam>(TutonItemValidation.COURSE_ID_PARAM, req.params as any)
      const result = await TutonItemService.listByCourse(courseId)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async update(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { itemId } = await Validation.validate<ItemIdParam>(TutonItemValidation.ITEM_ID_PARAM, req.params as any)
      const body = await Validation.validate<UpdateTutonItemRequest>(TutonItemValidation.UPDATE_BODY, req.body)
      const result = await TutonItemService.update(itemId, body)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async updateStatus(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { itemId } = await Validation.validate<ItemIdParam>(TutonItemValidation.ITEM_ID_PARAM, req.params as any)
      const body = await Validation.validate<UpdateStatusRequest>(TutonItemValidation.UPDATE_STATUS_BODY, req.body)
      const result = await TutonItemService.updateStatus(itemId, body)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async updateNilai(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { itemId } = await Validation.validate<ItemIdParam>(TutonItemValidation.ITEM_ID_PARAM, req.params as any)
      const body = await Validation.validate<UpdateNilaiRequest>(TutonItemValidation.UPDATE_NILAI_BODY, req.body)
      const result = await TutonItemService.updateNilai(itemId, body)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async initForCourse(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = Validation.validate(TutonItemValidation.PARAMS, req.params as any)
      const body = await Validation.validate(TutonItemValidation.INIT, req.body ?? {})
      const result = await TutonItemService.initForCourse(courseId, body)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async bulkUpdateStatus(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = Validation.validate(TutonItemValidation.PARAMS, req.params as any)
      const body = await Validation.validate(TutonItemValidation.BULK_STATUS, req.body ?? {})
      const result = await TutonItemService.bulkUpdateStatus(courseId, body)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async bulkUpdateNilai(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = Validation.validate(TutonItemValidation.PARAMS, req.params as any)
      const body = await Validation.validate(TutonItemValidation.BULK_NILAI, req.body ?? {})
      const result = await TutonItemService.bulkUpdateNilai(courseId, body)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }
  
}

export default TutonItemController
