"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutonService = void 0;
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const tuton_repository_1 = require("./tuton.repository");
const tuton_model_1 = require("./tuton.model");
const prisma_1 = require("../../generated/prisma");
const tuton_item_repository_1 = require("../tuton-item/tuton-item.repository");
class TutonService {
    // ===== Existing =====
    static async addCourse(customerId, payload) {
        const customer = await tuton_repository_1.TutonRepository.findCustomerById(customerId);
        if (!customer)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");
        const existing = await tuton_repository_1.TutonRepository.findCourseByCustomerAndMatkul(customerId, payload.matkul);
        if (existing)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Matkul sudah terdaftar untuk customer ini");
        const course = await tuton_repository_1.TutonRepository.createCourse(customerId, payload.matkul);
        const shouldGenerate = payload.generateItems !== false;
        let total = course.totalItems;
        if (shouldGenerate) {
            const created = await tuton_repository_1.TutonRepository.createItemsForCourse(course.id);
            const updated = await tuton_repository_1.TutonRepository.updateCourseTotals(course.id, created, 0);
            return (0, tuton_model_1.toTutonCourseResponse)(updated);
        }
        if (total !== 0) {
            const updated = await tuton_repository_1.TutonRepository.updateCourseTotals(course.id, 0, 0);
            return (0, tuton_model_1.toTutonCourseResponse)(updated);
        }
        return (0, tuton_model_1.toTutonCourseResponse)(course);
    }
    static async deleteCourse(courseId) {
        const found = await tuton_repository_1.TutonRepository.findCourseById(courseId);
        if (!found)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Course tidak ditemukan");
        await tuton_repository_1.TutonRepository.deleteCourse(courseId);
        return { deleted: true };
    }
    static async getConflicts() {
        const rows = await tuton_repository_1.TutonRepository.listAllCoursesWithCustomerMinimal();
        const map = new Map();
        for (const r of rows) {
            const list = map.get(r.matkul) ?? [];
            list.push({
                courseId: r.id,
                customerId: r.customer.id,
                namaCustomer: r.customer.namaCustomer,
                createdAt: r.createdAt,
                isDuplicate: false,
            });
            map.set(r.matkul, list);
        }
        const result = [];
        for (const [matkul, customers] of map.entries()) {
            if (customers.length > 1) {
                customers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                customers.forEach((c, i) => (c.isDuplicate = i > 0));
                result.push({ matkul, total: customers.length, customers });
            }
        }
        return result;
    }
    static async getConflictByMatkul(matkul) {
        const rows = await tuton_repository_1.TutonRepository.listCoursesByMatkul(matkul);
        if (rows.length === 0)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Matkul tidak ditemukan atau tidak ada konflik");
        const customers = rows
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((r, idx) => ({
            courseId: r.id,
            customerId: r.customer.id,
            namaCustomer: r.customer.namaCustomer,
            createdAt: r.createdAt,
            isDuplicate: idx > 0,
        }));
        if (customers.length <= 1)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Belum ada duplikasi untuk matkul ini");
        return { matkul, total: customers.length, customers };
    }
    static async summary(courseId) {
        const sum = await tuton_repository_1.TutonRepository.getSummary(courseId);
        if (!sum)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Course not found");
        return sum;
    }
    // ===== NEW =====
    static async listSubjects(q) {
        const rows = await tuton_repository_1.TutonRepository.groupCoursesByMatkul(); // { matkul, total }
        const mapped = rows.map(r => ({
            matkul: r.matkul,
            totalCourses: r.total,
            isConflict: r.total > 1,
        }));
        if (!q)
            return mapped;
        const needle = q.toLowerCase();
        return mapped.filter(s => s.matkul.toLowerCase().includes(needle));
    }
    static async scan(filters) {
        const status = filters.status ?? prisma_1.StatusTugas.BELUM;
        const page = Math.max(1, filters.page ?? 1);
        const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        // ⬇️ cast hasil Promise.all jadi tuple tegas [ScanRow[], number]
        const [rows, total] = (await Promise.all([
            tuton_item_repository_1.TutonItemRepository.scanByFilters({
                matkul: filters.matkul,
                jenis: filters.jenis,
                sesi: filters.sesi,
                status,
                skip,
                take,
            }),
            tuton_item_repository_1.TutonItemRepository.countScanByFilters({
                matkul: filters.matkul,
                jenis: filters.jenis,
                sesi: filters.sesi,
                status,
            }),
        ]));
        const data = rows.map(r => ({
            itemId: r.id,
            courseId: r.courseId,
            customerId: r.course.customer.id,
            customerName: r.course.customer.namaCustomer,
            matkul: r.course.matkul,
            jenis: r.jenis,
            sesi: r.sesi,
            status: r.status,
        }));
        return {
            meta: { page, pageSize, total, hasNext: skip + data.length < total },
            filters: {
                matkul: filters.matkul ?? null,
                jenis: filters.jenis ?? null,
                sesi: typeof filters.sesi === "number" ? filters.sesi : null,
                status,
            },
            rows: data,
        };
    }
}
exports.TutonService = TutonService;
