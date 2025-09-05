"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutonItemService = void 0;
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const database_1 = require("../../config/database");
const prisma_1 = require("../../generated/prisma");
const tuton_item_repository_1 = require("./tuton-item.repository");
const tuton_item_model_1 = require("./tuton-item.model");
class TutonItemService {
    static async listByCourse(courseId) {
        const course = await tuton_item_repository_1.TutonItemRepository.getCourseById(courseId);
        if (!course)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Course tidak ditemukan");
        const items = await tuton_item_repository_1.TutonItemRepository.listByCourse(courseId);
        return items.map(tuton_item_model_1.toTutonItemResponse);
    }
    static async update(itemId, payload) {
        const item = await tuton_item_repository_1.TutonItemRepository.getItemById(itemId);
        if (!item)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Item tidak ditemukan");
        if (payload.hasOwnProperty("nilai") && item.jenis === prisma_1.JenisTugas.ABSEN) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki nilai");
        }
        if (payload.hasOwnProperty("copas") && item.jenis === prisma_1.JenisTugas.ABSEN) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki copas soal");
        }
        const data = {};
        if (typeof payload.deskripsi !== "undefined")
            data.deskripsi = payload.deskripsi;
        if (typeof payload.nilai !== "undefined")
            data.nilai = payload.nilai;
        if (typeof payload.copas !== "undefined")
            data.copasSoal = payload.copas;
        // Atur status + “cap selesai”
        if (typeof payload.status !== "undefined") {
            if (payload.status === prisma_1.StatusTugas.SELESAI) {
                data.status = prisma_1.StatusTugas.SELESAI;
                data.selesaiAt = new Date();
            }
            else {
                data.status = prisma_1.StatusTugas.BELUM;
                data.selesaiAt = null; // NEW: clear penanda selesai saat revert
            }
        }
        const updated = await database_1.prismaClient.$transaction(async (tx) => {
            const updatedItem = await tx.tutonItem.update({ where: { id: itemId }, data });
            // Recalc progress course bila status berubah
            if (typeof payload.status !== "undefined") {
                const completedCount = await tx.tutonItem.count({
                    where: { courseId: updatedItem.courseId, status: prisma_1.StatusTugas.SELESAI },
                });
                await tx.tutonCourse.update({ where: { id: updatedItem.courseId }, data: { completedItems: completedCount } });
            }
            return updatedItem;
        });
        return (0, tuton_item_model_1.toTutonItemResponse)(updated);
    }
    static async updateStatus(itemId, payload) {
        return this.update(itemId, { status: payload.status });
    }
    static async updateNilai(itemId, payload) {
        const item = await tuton_item_repository_1.TutonItemRepository.getItemById(itemId);
        if (!item)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Item tidak ditemukan");
        if (item.jenis === prisma_1.JenisTugas.ABSEN) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki nilai");
        }
        return this.update(itemId, { nilai: payload.nilai });
    }
    static async updateCopas(itemId, payload) {
        const item = await tuton_item_repository_1.TutonItemRepository.getItemById(itemId);
        if (!item)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Item tidak ditemukan");
        if (item.jenis === prisma_1.JenisTugas.ABSEN) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki copas soal");
        }
        const updated = await tuton_item_repository_1.TutonItemRepository.updateItem(itemId, { copasSoal: payload.copas });
        return (0, tuton_item_model_1.toTutonItemResponse)(updated);
    }
    static async initForCourse(courseId, payload) {
        const course = await tuton_item_repository_1.TutonCourseRepository.ensureExists(courseId);
        if (!course)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND);
        const existing = await tuton_item_repository_1.TutonItemRepository.countByCourse(courseId);
        let created = false;
        if (existing === 0 || payload.overwrite) {
            if (existing > 0)
                await tuton_item_repository_1.TutonItemRepository.deleteByCourse(courseId);
            const total = await tuton_item_repository_1.TutonItemRepository.createDefaults(courseId);
            await tuton_item_repository_1.TutonCourseRepository.touchTotals(courseId, total);
            await tuton_item_repository_1.TutonCourseRepository.recalcCompletedItems(courseId);
            created = true;
        }
        const after = await tuton_item_repository_1.TutonCourseRepository.ensureExists(courseId);
        return {
            courseId,
            created,
            totalItems: after?.totalItems ?? 0,
            completedItems: after?.completedItems ?? 0,
        };
    }
    static async bulkUpdateNilai(courseId, payload) {
        const course = await tuton_item_repository_1.TutonItemRepository.getCourseById(courseId);
        if (!course)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Course not found");
        if (!payload.items?.length)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "items wajib diisi");
        const ids = payload.items.map(i => i.itemId);
        const owned = await tuton_item_repository_1.TutonItemRepository.findByIdsForCourseWithJenis(courseId, ids);
        if (owned.length !== ids.length) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Beberapa item bukan milik course yang dimaksud");
        }
        const absenIds = owned.filter(o => o.jenis === "ABSEN").map(o => o.id);
        if (absenIds.length) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, `ABSEN tidak memiliki nilai (itemId: ${absenIds.join(", ")})`);
        }
        await tuton_item_repository_1.TutonItemRepository.bulkUpdateNilaiTx(payload.items);
        await tuton_item_repository_1.TutonItemRepository.recalcCourseCompleted(courseId);
        return { updated: ids.length };
    }
    static async bulkUpdateStatus(courseId, payload) {
        const course = await tuton_item_repository_1.TutonItemRepository.getCourseById(courseId);
        if (!course)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND);
        if (!payload.items?.length)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "items wajib diisi");
        const ids = payload.items.map(i => i.itemId);
        const owned = await tuton_item_repository_1.TutonItemRepository.findByIdsForCourse(courseId, ids);
        if (owned.length !== ids.length) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Beberapa item bukan milik course yang dimaksud");
        }
        // Update status + selesaiAt (di TX)
        await tuton_item_repository_1.TutonItemRepository.bulkUpdateStatusTx(payload.items);
        // NEW: ekstra aman — bersihkan selesaiAt untuk semua yang di-set ke BELUM (idempotent)
        const revertedIds = payload.items.filter(i => i.status === prisma_1.StatusTugas.BELUM).map(i => i.itemId);
        if (revertedIds.length)
            await tuton_item_repository_1.TutonItemRepository.clearCompletionMarksBulk(revertedIds);
        // Recalc progress course biar konsisten di FE
        await tuton_item_repository_1.TutonItemRepository.recalcCourseCompleted(courseId);
        return { updated: ids.length };
    }
}
exports.TutonItemService = TutonItemService;
