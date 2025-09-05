"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarilService = void 0;
// src/app/karil/karil.service.ts
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const karil_repository_1 = require("./karil.repository");
const karil_model_1 = require("./karil.model");
class KarilService {
    static async upsert(customerId, payload) {
        const customer = await karil_repository_1.KarilRepository.findCustomerById(customerId);
        if (!customer) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");
        }
        // izinkan KARIL atau TK
        const jenis = String(customer.jenis ?? "").trim().toUpperCase();
        if (jenis !== "KARIL" && jenis !== "TK") {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Customer ini bukan peserta KARIL/TK");
        }
        return karil_repository_1.KarilRepository.upsertByCustomerId({ customerId, ...payload });
    }
    static async getDetail(customerId) {
        const row = await karil_repository_1.KarilRepository.detailByCustomerId(customerId);
        if (!row)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Detail KARIL tidak ditemukan");
        return (0, karil_model_1.mapRowToItem)(row);
    }
    static async listAll(query) {
        const { rows, total } = await karil_repository_1.KarilRepository.listAll(query);
        const items = rows.map(karil_model_1.mapRowToItem);
        const totalPages = Math.max(1, Math.ceil(total / query.limit));
        return { items, pagination: { page: query.page, limit: query.limit, total, totalPages } };
    }
}
exports.KarilService = KarilService;
