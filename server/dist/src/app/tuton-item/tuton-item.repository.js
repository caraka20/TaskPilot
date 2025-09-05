"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutonCourseRepository = exports.TutonItemRepository = void 0;
const database_1 = require("../../config/database");
const prisma_1 = require("../../generated/prisma");
class TutonItemRepository {
    static getCourseById(courseId) {
        return database_1.prismaClient.tutonCourse.findUnique({ where: { id: courseId } });
    }
    static listByCourse(courseId) {
        return database_1.prismaClient.tutonItem.findMany({
            where: { courseId },
            orderBy: [{ jenis: "asc" }, { sesi: "asc" }],
        });
    }
    static getItemById(itemId) {
        return database_1.prismaClient.tutonItem.findUnique({ where: { id: itemId } });
    }
    static updateItem(itemId, data) {
        return database_1.prismaClient.tutonItem.update({ where: { id: itemId }, data });
    }
    static countCompletedInCourse(courseId) {
        return database_1.prismaClient.tutonItem.count({ where: { courseId, status: prisma_1.StatusTugas.SELESAI } });
    }
    static updateCourseCompleted(courseId, completedItems) {
        return database_1.prismaClient.tutonCourse.update({ where: { id: courseId }, data: { completedItems } });
    }
    static async recalcCourseCompleted(courseId) {
        const done = await this.countCompletedInCourse(courseId);
        await this.updateCourseCompleted(courseId, done);
        return done;
    }
    static async countByCourse(courseId) {
        return database_1.prismaClient.tutonItem.count({ where: { courseId } });
    }
    static async deleteByCourse(courseId) {
        await database_1.prismaClient.tutonItem.deleteMany({ where: { courseId } });
    }
    static buildDefaultItems(courseId) {
        const items = [];
        for (let s = 1; s <= 8; s++)
            items.push({ courseId, jenis: prisma_1.JenisTugas.DISKUSI, sesi: s, status: prisma_1.StatusTugas.BELUM });
        for (let s = 1; s <= 8; s++)
            items.push({ courseId, jenis: prisma_1.JenisTugas.ABSEN, sesi: s, status: prisma_1.StatusTugas.BELUM });
        for (const s of [3, 5, 7])
            items.push({ courseId, jenis: prisma_1.JenisTugas.TUGAS, sesi: s, status: prisma_1.StatusTugas.BELUM });
        return items;
    }
    static async createDefaults(courseId) {
        const items = this.buildDefaultItems(courseId);
        await database_1.prismaClient.tutonItem.createMany({ data: items });
        return items.length;
    }
    static async clearCompletionMarks(itemId) {
        await database_1.prismaClient.tutonItem.update({
            where: { id: itemId },
            data: { selesaiAt: null },
        });
    }
    static async clearCompletionMarksBulk(itemIds) {
        if (!itemIds.length)
            return;
        await database_1.prismaClient.tutonItem.updateMany({
            where: { id: { in: itemIds } },
            data: { selesaiAt: null },
        });
    }
    static async bulkUpdateStatusTx(items) {
        if (!items.length)
            return [];
        return database_1.prismaClient.$transaction(items.map(i => database_1.prismaClient.tutonItem.update({
            where: { id: i.itemId },
            data: {
                status: i.status,
                selesaiAt: i.status === prisma_1.StatusTugas.SELESAI ? new Date() : null,
            },
        })));
    }
    static async bulkUpdateNilaiTx(items) {
        if (!items.length)
            return [];
        return database_1.prismaClient.$transaction(items.map(i => database_1.prismaClient.tutonItem.update({
            where: { id: i.itemId },
            data: { nilai: i.nilai },
        })));
    }
    static async findByIdsForCourse(courseId, ids) {
        if (!ids.length)
            return [];
        return database_1.prismaClient.tutonItem.findMany({
            where: { courseId, id: { in: ids } },
            select: { id: true },
        });
    }
    static async findByIdsForCourseWithJenis(courseId, ids) {
        if (!ids.length)
            return [];
        return database_1.prismaClient.tutonItem.findMany({
            where: { courseId, id: { in: ids } },
            select: { id: true, jenis: true },
        });
    }
    // ===== NEW: scan untuk dashboard pengecekan sesi =====
    static async scanByFilters(params) {
        const { matkul, jenis, sesi, status, skip, take } = params;
        return database_1.prismaClient.tutonItem.findMany({
            where: {
                status,
                ...(typeof jenis !== "undefined" ? { jenis } : {}),
                ...(typeof sesi !== "undefined" ? { sesi } : {}),
                ...(matkul
                    // ⬇️ tidak pakai `is:`; langsung WhereInput di field relasi
                    ? { course: { matkul: { contains: matkul } } }
                    : {}),
            },
            select: {
                id: true,
                courseId: true,
                jenis: true,
                sesi: true,
                status: true,
                course: {
                    select: {
                        id: true,
                        matkul: true,
                        customer: { select: { id: true, namaCustomer: true } },
                    },
                },
            },
            orderBy: [
                { course: { matkul: "asc" } },
                { sesi: "asc" },
                { jenis: "asc" },
                { id: "asc" },
            ],
            skip,
            take,
        });
    }
    /** Counter untuk scan; bentuk where harus sama */
    static async countScanByFilters(params) {
        const { matkul, jenis, sesi, status } = params;
        return database_1.prismaClient.tutonItem.count({
            where: {
                status,
                ...(typeof jenis !== "undefined" ? { jenis } : {}),
                ...(typeof sesi !== "undefined" ? { sesi } : {}),
                ...(matkul
                    ? { course: { matkul: { contains: matkul } } }
                    : {}),
            },
        });
    }
}
exports.TutonItemRepository = TutonItemRepository;
class TutonCourseRepository {
    static async ensureExists(courseId) {
        return database_1.prismaClient.tutonCourse.findUnique({ where: { id: courseId } });
    }
    static async recalcCompletedItems(courseId) {
        const completed = await database_1.prismaClient.tutonItem.count({
            where: { courseId, status: prisma_1.StatusTugas.SELESAI },
        });
        await database_1.prismaClient.tutonCourse.update({ where: { id: courseId }, data: { completedItems: completed } });
        return completed;
    }
    static async touchTotals(courseId, totalItems) {
        return database_1.prismaClient.tutonCourse.update({ where: { id: courseId }, data: { totalItems } });
    }
    static async summary(courseId) {
        const course = await database_1.prismaClient.tutonCourse.findUnique({
            where: { id: courseId },
            select: { id: true, matkul: true, totalItems: true, completedItems: true, updatedAt: true },
        });
        if (!course)
            return null;
        const [countDiskusi, countAbsen, countTugas, doneDiskusi, doneAbsen, doneTugas, avgDiskusi, avgTugas] = await Promise.all([
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: "DISKUSI" } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: "ABSEN" } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: "TUGAS" } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: "DISKUSI", status: "SELESAI" } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: "ABSEN", status: "SELESAI" } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: "TUGAS", status: "SELESAI" } }),
            database_1.prismaClient.tutonItem.aggregate({ where: { courseId, jenis: "DISKUSI", nilai: { not: null } }, _avg: { nilai: true } }),
            database_1.prismaClient.tutonItem.aggregate({ where: { courseId, jenis: "TUGAS", nilai: { not: null } }, _avg: { nilai: true } }),
        ]);
        return {
            course,
            byJenis: {
                DISKUSI: { total: countDiskusi, done: doneDiskusi, avgNilai: avgDiskusi._avg.nilai ?? null },
                ABSEN: { total: countAbsen, done: doneAbsen },
                TUGAS: { total: countTugas, done: doneTugas, avgNilai: avgTugas._avg.nilai ?? null },
            },
        };
    }
}
exports.TutonCourseRepository = TutonCourseRepository;
