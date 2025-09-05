"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GajiController = void 0;
const gaji_service_1 = require("./gaji.service");
const gaji_validation_1 = require("./gaji.validation");
const response_handler_1 = require("../../utils/response-handler");
const success_messages_1 = require("../../utils/success-messages");
const validation_1 = require("../../middleware/validation");
class GajiController {
    static async createGaji(req, res, next) {
        try {
            const request = validation_1.Validation.validate(gaji_validation_1.GajiValidation.CREATE, req.body);
            const result = await gaji_service_1.GajiService.createGaji(request);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES.CREATED.GAJI);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllGaji(req, res, next) {
        try {
            const result = await gaji_service_1.GajiService.getAllGaji(req.query);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES.FETCHED.GAJI);
        }
        catch (err) {
            next(err);
        }
    }
    static async deleteGaji(req, res, next) {
        try {
            const id = Number(req.params.id);
            await gaji_service_1.GajiService.deleteById(id);
            return response_handler_1.ResponseHandler.success(res, null, success_messages_1.SUCCESS_MESSAGES.DELETED.GAJI);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateGaji(req, res, next) {
        try {
            const id = Number(req.params.id);
            const requestUpdate = await validation_1.Validation.validate(gaji_validation_1.GajiValidation.UPDATE, req.body);
            const updated = await gaji_service_1.GajiService.updateById(id, requestUpdate);
            return response_handler_1.ResponseHandler.success(res, updated, success_messages_1.SUCCESS_MESSAGES.UPDATED.GAJI);
        }
        catch (err) {
            next(err);
        }
    }
    static async getMyGaji(req, res, next) {
        try {
            const username = req.user.username;
            const parsed = gaji_validation_1.GajiValidation.GET_MY.parse(req.query);
            const data = await gaji_service_1.GajiService.getMyGaji(username, parsed);
            return res.status(200).json({ status: 'success', data });
        }
        catch (err) {
            next(err);
        }
    }
    // OWNER
    static async getSummary(req, res, next) {
        try {
            const raw = req.query;
            const periodGuess = raw?.period ?? (raw?.scope === 'all' ? 'total' : raw?.scope) ?? 'total';
            const { period } = await validation_1.Validation.validate(gaji_validation_1.GajiValidation.SUMMARY_QUERY, { period: periodGuess });
            const data = await gaji_service_1.GajiService.getSummary(period);
            return response_handler_1.ResponseHandler.success(res, data, success_messages_1.SUCCESS_MESSAGES.FETCHED.GAJI);
        }
        catch (err) {
            next(err);
        }
    }
    // USER (me)
    static async getMySummary(req, res, next) {
        try {
            const username = req.user.username;
            const data = await gaji_service_1.GajiService.getMySummary(username);
            return response_handler_1.ResponseHandler.success(res, data, success_messages_1.SUCCESS_MESSAGES.FETCHED.GAJI);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.GajiController = GajiController;
