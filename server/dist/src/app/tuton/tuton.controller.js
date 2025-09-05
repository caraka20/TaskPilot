"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutonController = void 0;
const validation_1 = require("../../middleware/validation");
const response_handler_1 = require("../../utils/response-handler");
const tuton_validation_1 = require("./tuton.validation");
const tuton_service_1 = require("./tuton.service");
class TutonController {
    // ===== Existing =====
    static async addCourse(req, res, next) {
        try {
            const { id } = await validation_1.Validation.validate(tuton_validation_1.TutonValidation.CUSTOMER_ID_PARAM, req.params);
            const body = await validation_1.Validation.validate(tuton_validation_1.TutonValidation.ADD_COURSE_BODY, req.body);
            const result = await tuton_service_1.TutonService.addCourse(id, body);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteCourse(req, res, next) {
        try {
            const { courseId } = await validation_1.Validation.validate(tuton_validation_1.TutonValidation.COURSE_ID_PARAM, req.params);
            const result = await tuton_service_1.TutonService.deleteCourse(courseId);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async getConflicts(req, res, next) {
        try {
            const data = await tuton_service_1.TutonService.getConflicts();
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async getConflictByMatkul(req, res, next) {
        try {
            const { matkul } = await validation_1.Validation.validate(tuton_validation_1.TutonValidation.CONFLICT_MATKUL_PARAM, req.params);
            const data = await tuton_service_1.TutonService.getConflictByMatkul(matkul);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async summary(req, res, next) {
        try {
            const { courseId } = await validation_1.Validation.validate(tuton_validation_1.TutonValidation.COURSE_ID_PARAM, req.params);
            const data = await tuton_service_1.TutonService.summary(courseId);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    // ===== NEW =====
    static async listSubjects(req, res, next) {
        try {
            const { q } = await validation_1.Validation.validate(tuton_validation_1.TutonValidation.SUBJECTS_QUERY, req.query);
            const data = await tuton_service_1.TutonService.listSubjects(q);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async scan(req, res, next) {
        try {
            const args = await validation_1.Validation.validate(tuton_validation_1.TutonValidation.SCAN_QUERY, req.query);
            const data = await tuton_service_1.TutonService.scan(args);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TutonController = TutonController;
exports.default = TutonController;
