"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JamKerjaController = void 0;
const jam_kerja_validation_1 = require("./jam-kerja.validation");
const jam_kerja_service_1 = __importDefault(require("./jam-kerja.service"));
const response_handler_1 = require("../../utils/response-handler");
const success_messages_1 = require("../../utils/success-messages");
const validation_1 = require("../../middleware/validation");
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const prisma_1 = require("../../generated/prisma");
class JamKerjaController {
    // START: USER → dirinya; OWNER → boleh target via ?username= atau body.username
    static async start(req, res, next) {
        try {
            if (!req.user)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
            const fromQuery = typeof req.query.username === "string" ? req.query.username.trim() : "";
            const fromBody = typeof (req.body?.username) === "string" ? req.body.username.trim() : "";
            const targetUsername = req.user.role === prisma_1.Role.OWNER
                ? (fromQuery || fromBody || req.user.username)
                : req.user.username;
            await validation_1.Validation.validate(jam_kerja_validation_1.JamKerjaValidation.START, { username: targetUsername });
            const result = await jam_kerja_service_1.default.startJamKerja({ username: targetUsername });
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES.JAM_KERJA.START);
        }
        catch (err) {
            next(err);
        }
    }
    // END: USER hanya miliknya; OWNER bebas
    static async end(req, res, next) {
        try {
            if (!req.user)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
            const id = Number(req.params.id);
            const result = await jam_kerja_service_1.default.endJamKerja({ username: req.user.username, role: req.user.role }, id);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES.JAM_KERJA.END);
        }
        catch (err) {
            next(err);
        }
    }
    static async getHistory(req, res, next) {
        try {
            const query = await validation_1.Validation.validate(jam_kerja_validation_1.JamKerjaValidation.HISTORY_QUERY, req.query);
            if (req.user?.role === prisma_1.Role.USER && req.user.username !== query.username) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
            }
            const result = await jam_kerja_service_1.default.getHistory(query.username);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async rekap(req, res, next) {
        try {
            const query = await validation_1.Validation.validate(jam_kerja_validation_1.JamKerjaValidation.REKAP_QUERY, req.query);
            if (req.user?.role === prisma_1.Role.USER && req.user.username !== query.username) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN, "USER hanya bisa melihat datanya sendiri");
            }
            const result = await jam_kerja_service_1.default.rekap(query.username, query.period);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES.FETCHED.REKAP_JAM_KERJA);
        }
        catch (err) {
            next(err);
        }
    }
    static async getActive(req, res, next) {
        try {
            const user = req.user;
            if (!user?.username || !user?.role) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
            }
            const parsed = await validation_1.Validation.validate(jam_kerja_validation_1.JamKerjaValidation.AKTIF_QUERY, req.query);
            const data = await jam_kerja_service_1.default.getActive({ username: user.username, role: user.role }, parsed);
            return response_handler_1.ResponseHandler.success(res, data, success_messages_1.SUCCESS_MESSAGES.FETCHED.AKTIF_JAM_KERJA);
        }
        catch (err) {
            next(err);
        }
    }
    // LEGACY
    static async getAktif(req, res, next) {
        try {
            const query = {
                username: req.query.username,
                period: req.query.period,
            };
            if (req.user?.role === prisma_1.Role.USER && req.user.username !== query.username) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
            }
            const result = await jam_kerja_service_1.default.getAktif(query);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES.FETCHED.AKTIF_JAM_KERJA);
        }
        catch (err) {
            next(err);
        }
    }
    static async pause(req, res, next) {
        try {
            if (!req.user?.username || !req.user?.role)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
            const id = Number(req.params.id);
            const result = await jam_kerja_service_1.default.pause({ username: req.user.username, role: req.user.role }, id);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES?.JAM_KERJA?.PAUSE);
        }
        catch (err) {
            next(err);
        }
    }
    static async resume(req, res, next) {
        try {
            if (!req.user?.username || !req.user?.role)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
            const id = Number(req.params.id);
            const result = await jam_kerja_service_1.default.resume({ username: req.user.username, role: req.user.role }, id);
            return response_handler_1.ResponseHandler.success(res, result, success_messages_1.SUCCESS_MESSAGES?.JAM_KERJA?.RESUME);
        }
        catch (err) {
            next(err);
        }
    }
    static async ownerSummary(req, res, next) {
        try {
            if (req.user?.role !== prisma_1.Role.OWNER)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN);
            const q = await jam_kerja_validation_1.JamKerjaValidation.OWNER_SUMMARY_QUERY.parseAsync(req.query);
            const data = await jam_kerja_service_1.default.buildOwnerSummary(q.username);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async userSummary(req, res, next) {
        try {
            const q = await jam_kerja_validation_1.JamKerjaValidation.USER_SUMMARY_QUERY.parseAsync(req.query);
            if (req.user?.role === prisma_1.Role.USER && req.user.username !== q.username) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
            }
            const data = await jam_kerja_service_1.default.buildUserSummary(q.username);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.JamKerjaController = JamKerjaController;
exports.default = JamKerjaController;
