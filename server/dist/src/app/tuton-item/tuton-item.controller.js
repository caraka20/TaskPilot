"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutonItemController = void 0;
const response_handler_1 = require("../../utils/response-handler");
const validation_1 = require("../../middleware/validation");
const tuton_item_validation_1 = require("./tuton-item.validation");
const tuton_item_service_1 = require("./tuton-item.service");
class TutonItemController {
    static async listByCourse(req, res, next) {
        try {
            const { courseId } = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.COURSE_ID_PARAM, req.params);
            const result = await tuton_item_service_1.TutonItemService.listByCourse(courseId);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async update(req, res, next) {
        try {
            const { itemId } = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.ITEM_ID_PARAM, req.params);
            const body = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.UPDATE_BODY, req.body);
            const result = await tuton_item_service_1.TutonItemService.update(itemId, body);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const { itemId } = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.ITEM_ID_PARAM, req.params);
            const body = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.UPDATE_STATUS_BODY, req.body);
            const result = await tuton_item_service_1.TutonItemService.updateStatus(itemId, body);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateNilai(req, res, next) {
        try {
            const { itemId } = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.ITEM_ID_PARAM, req.params);
            const body = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.UPDATE_NILAI_BODY, req.body);
            const result = await tuton_item_service_1.TutonItemService.updateNilai(itemId, body);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateCopas(req, res, next) {
        try {
            const { itemId } = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.ITEM_ID_PARAM, req.params);
            const body = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.UPDATE_COPAS_BODY, req.body);
            const result = await tuton_item_service_1.TutonItemService.updateCopas(itemId, body);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async initForCourse(req, res, next) {
        try {
            const { courseId } = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.PARAMS, req.params);
            const body = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.INIT, req.body ?? {});
            const result = await tuton_item_service_1.TutonItemService.initForCourse(courseId, body);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async bulkUpdateStatus(req, res, next) {
        try {
            const { courseId } = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.PARAMS, req.params);
            const body = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.BULK_STATUS, req.body ?? {});
            const result = await tuton_item_service_1.TutonItemService.bulkUpdateStatus(courseId, body);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async bulkUpdateNilai(req, res, next) {
        try {
            const { courseId } = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.PARAMS, req.params);
            const body = await validation_1.Validation.validate(tuton_item_validation_1.TutonItemValidation.BULK_NILAI, req.body ?? {});
            const result = await tuton_item_service_1.TutonItemService.bulkUpdateNilai(courseId, body);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TutonItemController = TutonItemController;
exports.default = TutonItemController;
