"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarilController = void 0;
const response_handler_1 = require("../../utils/response-handler");
const karil_validation_1 = require("./karil.validation");
const karil_service_1 = require("./karil.service");
const validation_1 = require("../../middleware/validation");
class KarilController {
    static async upsert(req, res, next) {
        try {
            const params = karil_validation_1.KarilParamValidation.parse(req.params);
            const body = karil_validation_1.KarilBodyValidation.parse(req.body);
            const result = await karil_service_1.KarilService.upsert(params.id, {
                judul: body.judul,
                tugas1: body.tugas1,
                tugas2: body.tugas2,
                tugas3: body.tugas3,
                tugas4: body.tugas4,
                keterangan: body.keterangan,
            });
            return response_handler_1.ResponseHandler.success(res, result, "Berhasil upsert KARIL detail");
        }
        catch (err) {
            next(err);
        }
    }
    /** GET detail KARIL by customerId */
    static async detail(req, res, next) {
        try {
            const { id } = karil_validation_1.KarilParamValidation.parse(req.params);
            const data = await karil_service_1.KarilService.getDetail(id);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    /** GET list semua KARIL (paging, search, filter progress, sort) */
    static async list(req, res, next) {
        try {
            const query = validation_1.Validation.validate(karil_validation_1.KarilListQueryValidation, req.query);
            const data = await karil_service_1.KarilService.listAll(query);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.KarilController = KarilController;
