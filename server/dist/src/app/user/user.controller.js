"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const validation_1 = require("../../middleware/validation");
const user_validation_1 = require("./user.validation");
const user_service_1 = require("./user.service");
const response_handler_1 = require("../../utils/response-handler");
const success_messages_1 = require("../../utils/success-messages");
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const prisma_1 = require("../../generated/prisma");
class UserController {
    static async register(req, res, next) {
        try {
            const request = await validation_1.Validation.validate(user_validation_1.UserValidation.CREATE, req.body);
            const response = await user_service_1.UserService.register(request);
            return response_handler_1.ResponseHandler.success(res, response, success_messages_1.SUCCESS_MESSAGES.CREATED.USER);
        }
        catch (err) {
            next(err);
        }
    }
    static async login(req, res, next) {
        try {
            const request = await validation_1.Validation.validate(user_validation_1.UserValidation.LOGIN, req.body);
            const response = await user_service_1.UserService.login(request);
            return response_handler_1.ResponseHandler.success(res, response, success_messages_1.SUCCESS_MESSAGES.LOGIN.USER);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAllUsers(_req, res, next) {
        try {
            const users = await user_service_1.UserService.getAllUsers();
            return response_handler_1.ResponseHandler.success(res, users);
        }
        catch (err) {
            next(err);
        }
    }
    static async getUserDetail(req, res, next) {
        try {
            const params = await validation_1.Validation.validate(user_validation_1.UserValidation.DETAIL_USER, req.params);
            const result = await user_service_1.UserService.getUserDetail(params);
            // Back-compat untuk test lama: selalu sediakan 'tugas' sebagai array.
            const tugas = Array.isArray(result?.tugas)
                ? result.tugas
                : Array.isArray(result?.tutonItems)
                    ? result.tutonItems
                    : [];
            const normalized = {
                ...result,
                tugas,
            };
            return response_handler_1.ResponseHandler.success(res, normalized, success_messages_1.SUCCESS_MESSAGES.FETCHED.USER);
        }
        catch (err) {
            next(err);
        }
    }
    static async logout(req, res, next) {
        try {
            const result = await user_service_1.UserService.logout(req);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES.LOGOUT.USER);
        }
        catch (err) {
            next(err);
        }
    }
    static async setJedaOtomatisUser(req, res, next) {
        try {
            const { username } = req.params;
            const payload = await validation_1.Validation.validate(user_validation_1.UserValidation.SET_JEDA_OTOMATIS, req.body);
            const result = await user_service_1.UserService.setJedaOtomatis(username, payload);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES.UPDATED.JEDA_OTOMATIS);
        }
        catch (err) {
            next(err);
        }
    }
    /* ========= API BARU: DETAIL LENGKAP =========
       GET /api/users/:username/everything?from=&to=&histPage=&histLimit=&payPage=&payLimit=
    */
    static async getUserEverything(req, res, next) {
        try {
            const { username } = await validation_1.Validation.validate(user_validation_1.UserValidation.DETAIL_USER, req.params);
            // USER hanya boleh akses dirinya sendiri
            if (req.user?.role === prisma_1.Role.USER && req.user.username !== username) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
            }
            const q = await validation_1.Validation.validate(user_validation_1.UserValidation.DETAIL_DEEP_QUERY, req.query);
            const data = await user_service_1.UserService.getUserEverything(username, q);
            return response_handler_1.ResponseHandler.success(res, data, success_messages_1.SUCCESS_MESSAGES.FETCHED.USER);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
