"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const prisma_1 = require("../../generated/prisma");
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const customer_model_1 = require("./customer.model");
const customer_repository_1 = require("./customer.repository");
class CustomerService {
    static async create(payload) {
        // pastikan NIM unik
        const existing = await customer_repository_1.CustomerRepository.findByNim(payload.nim);
        if (existing)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "NIM sudah terdaftar");
        // simpan password apa adanya (sesuai kebutuhan login e-learning UT)
        const created = await customer_repository_1.CustomerRepository.create({
            namaCustomer: payload.namaCustomer,
            noWa: payload.noWa,
            nim: payload.nim,
            password: payload.password, // <-- TANPA HASH
            jurusan: payload.jurusan,
            jenis: payload.jenis,
            totalBayar: payload.totalBayar,
            sudahBayar: payload.sudahBayar,
        });
        return (0, customer_model_1.toCustomerResponse)(created);
    }
    static async detail(id) {
        const row = await customer_repository_1.CustomerRepository.findDetailById(id);
        if (!row)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND);
        return (0, customer_model_1.toCustomerDetailResponse)(row); // berisi password
    }
    static async addPayment(id, payload) {
        const updated = await customer_repository_1.CustomerRepository.addPayment({
            customerId: id,
            amount: payload.amount,
            catatan: payload.catatan,
            tanggalBayar: payload.tanggalBayar,
        });
        if (!updated)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, 'Customer tidak ditemukan');
        return updated;
    }
    // OWNER: update total tagihan
    static async updateInvoiceTotal(id, totalBayar) {
        try {
            const updated = await customer_repository_1.CustomerRepository.updateInvoiceTotal(id, totalBayar);
            if (!updated)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, 'Customer tidak ditemukan');
            return updated;
        }
        catch (e) {
            if (e?.message === 'TOTAL_LESS_THAN_PAID') {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, 'totalBayar tidak boleh lebih kecil dari jumlah pembayaran yang sudah tercatat');
            }
            throw e;
        }
    }
    // OWNER/USER (opsional: jika mau izinkan USER melihat historinya sendiri)
    static async listPayments(customerId, query) {
        const customer = await customer_repository_1.CustomerRepository.findById(customerId);
        if (!customer)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, 'Customer tidak ditemukan');
        return customer_repository_1.CustomerRepository.listPayments(customerId, query);
    }
    static async remove(id) {
        const existing = await customer_repository_1.CustomerRepository.findById(id);
        if (!existing)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");
        await customer_repository_1.CustomerRepository.remove(id);
        return { deleted: true };
    }
    static async getTutonSummary(customerId) {
        const customer = await customer_repository_1.CustomerRepository.getByIdBasic(customerId);
        if (!customer)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");
        const courses = await customer_repository_1.CustomerRepository.listTutonCoursesByCustomer(customerId);
        const courseIds = courses.map(c => c.id);
        const items = await customer_repository_1.CustomerRepository.listItemsForCourses(courseIds);
        // index items by courseId
        const byCourse = new Map();
        for (const it of items) {
            const list = byCourse.get(it.courseId) ?? [];
            list.push(it);
            byCourse.set(it.courseId, list);
        }
        // helper hitung breakdown untuk satu course
        const buildBreakdown = (courseId) => {
            const list = byCourse.get(courseId) ?? [];
            const make = (jenis, withAvg = false) => {
                const subset = list.filter(i => i.jenis === jenis);
                const total = subset.length;
                const selesai = subset.filter(i => i.status === prisma_1.StatusTugas.SELESAI).length;
                const belum = total - selesai;
                let nilaiAvg = undefined;
                if (withAvg) {
                    const vals = subset.map(i => i.nilai).filter((v) => typeof v === "number");
                    nilaiAvg = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
                }
                return withAvg ? { total, selesai, belum, nilaiAvg } : { total, selesai, belum };
            };
            return {
                DISKUSI: make(prisma_1.JenisTugas.DISKUSI, true),
                ABSEN: make(prisma_1.JenisTugas.ABSEN, false),
                TUGAS: make(prisma_1.JenisTugas.TUGAS, true),
            };
        };
        // bentuk per-course summary
        const courseSummaries = courses.map(c => {
            const breakdown = buildBreakdown(c.id);
            const totalItems = c.totalItems ?? (breakdown.DISKUSI.total + breakdown.ABSEN.total + breakdown.TUGAS.total);
            const completedItems = c.completedItems ?? (breakdown.DISKUSI.selesai + breakdown.ABSEN.selesai + breakdown.TUGAS.selesai);
            const progress = totalItems > 0 ? parseFloat((completedItems / totalItems).toFixed(4)) : 0;
            return {
                courseId: c.id,
                matkul: c.matkul,
                totalItems,
                completedItems,
                progress,
                breakdown,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
            };
        });
        // header summary
        const totalCourses = courseSummaries.length;
        const totalItems = courseSummaries.reduce((a, b) => a + b.totalItems, 0);
        const totalCompleted = courseSummaries.reduce((a, b) => a + b.completedItems, 0);
        const overallProgress = totalItems > 0 ? parseFloat((totalCompleted / totalItems).toFixed(4)) : 0;
        return {
            customerId: customer.id,
            namaCustomer: customer.namaCustomer,
            totalCourses,
            totalItems,
            totalCompleted,
            overallProgress,
            courses: courseSummaries,
        };
    }
    static async list(query) {
        const { rows, total } = await customer_repository_1.CustomerRepository.list(query);
        const items = rows.map(customer_model_1.toCustomerListItem);
        const totalPages = Math.max(1, Math.ceil(total / query.limit));
        return { items, pagination: { page: query.page, limit: query.limit, total, totalPages } };
    }
}
exports.CustomerService = CustomerService;
