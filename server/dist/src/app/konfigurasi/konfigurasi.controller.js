"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KonfigurasiController = void 0;
const konfigurasi_service_1 = require("./konfigurasi.service");
const response_handler_1 = require("../../utils/response-handler");
const validation_1 = require("../../middleware/validation");
const konfigurasi_validation_1 = require("./konfigurasi.validation");
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
class KonfigurasiController {
    // GET /api/konfigurasi  (OWNER)
    static async get(req, res, next) {
        try {
            const data = await konfigurasi_service_1.KonfigurasiService.get();
            return response_handler_1.ResponseHandler.success(res, data, 'Konfigurasi berhasil diambil');
        }
        catch (err) {
            next(err);
        }
    }
    // PATCH /api/konfigurasi  (OWNER)
    static async update(req, res, next) {
        try {
            const payload = validation_1.Validation.validate(konfigurasi_validation_1.KonfigurasiValidation.UPDATE_GLOBAL, req.body);
            const result = await konfigurasi_service_1.KonfigurasiService.update(payload);
            return response_handler_1.ResponseHandler.success(res, result, 'Konfigurasi berhasil diperbarui');
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/konfigurasi/effective?username=...  (OWNER; USER hanya diri sendiri)
    static async getEffective(req, res, next) {
        try {
            const { username } = validation_1.Validation.validate(konfigurasi_validation_1.KonfigurasiValidation.GET_EFFECTIVE, req.query);
            // 🔒 USER hanya boleh akses dirinya sendiri
            const role = req.user?.role;
            const requester = req.user?.username;
            if (role === 'USER' && requester !== username) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN, 'Tidak berwenang mengakses konfigurasi user lain');
            }
            const data = await konfigurasi_service_1.KonfigurasiService.getEffective(username);
            return response_handler_1.ResponseHandler.success(res, data, 'Konfigurasi efektif berhasil diambil');
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /api/konfigurasi/override/:username  (OWNER)
    static async putOverride(req, res, next) {
        try {
            const { username } = validation_1.Validation.validate(konfigurasi_validation_1.KonfigurasiValidation.PARAM_USERNAME, req.params);
            const payload = validation_1.Validation.validate(konfigurasi_validation_1.KonfigurasiValidation.PUT_OVERRIDE, req.body);
            const data = await konfigurasi_service_1.KonfigurasiService.putOverride(username, payload);
            return response_handler_1.ResponseHandler.success(res, data, 'Override konfigurasi berhasil disimpan');
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /api/konfigurasi/override/:username  (OWNER)
    static async deleteOverride(req, res, next) {
        try {
            const params = validation_1.Validation.validate(konfigurasi_validation_1.KonfigurasiValidation.DELETE_OVERRIDE, req.params);
            const result = await konfigurasi_service_1.KonfigurasiService.deleteOverride(params.username);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.KonfigurasiController = KonfigurasiController;
