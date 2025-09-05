"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutonRepository = void 0;
const database_1 = require("../../config/database");
const prisma_1 = require("../../generated/prisma");
class TutonRepository {
    // --- Customer / Course basic ops ---
    static findCustomerById(id) {
        return database_1.prismaClient.customer.findUnique({ where: { id } });
    }
    static findCourseByCustomerAndMatkul(customerId, matkul) {
        // @@unique([customerId, matkul]) ⇒ key: customerId_matkul
        return database_1.prismaClient.tutonCourse.findUnique({
            where: { customerId_matkul: { customerId, matkul } },
        });
    }
    static createCourse(customerId, matkul) {
        return database_1.prismaClient.tutonCourse.create({
            data: { customerId, matkul },
        });
    }
    static findCourseById(courseId) {
        return database_1.prismaClient.tutonCourse.findUnique({ where: { id: courseId } });
    }
    static deleteCourse(courseId) {
        // TutonItem onDelete: Cascade → otomatis ikut terhapus
        return database_1.prismaClient.tutonCourse.delete({ where: { id: courseId } });
    }
    // TutonRepository.createItemsForCourse
    static async createItemsForCourse(courseId) {
        const items = [];
        // DISKUSI — boleh punya copasSoal (default false, boleh di-skip)
        for (let s = 1; s <= 8; s++) {
            items.push({
                courseId,
                jenis: prisma_1.JenisTugas.DISKUSI,
                sesi: s,
                status: prisma_1.StatusTugas.BELUM,
                copasSoal: false, // opsional (default false di schema), boleh dihapus
            });
        }
        // ABSEN — TIDAK punya copas/copasSoal
        for (let s = 1; s <= 8; s++) {
            items.push({
                courseId,
                jenis: prisma_1.JenisTugas.ABSEN,
                sesi: s,
                status: prisma_1.StatusTugas.BELUM,
                // jangan kirim copas/copasSoal di ABSEN
            });
        }
        // TUGAS — boleh punya copasSoal (default false)
        for (const s of [3, 5, 7]) {
            items.push({
                courseId,
                jenis: prisma_1.JenisTugas.TUGAS,
                sesi: s,
                status: prisma_1.StatusTugas.BELUM,
                copasSoal: false, // opsional
            });
        }
        await database_1.prismaClient.tutonItem.createMany({ data: items });
        return items.length;
    }
    static updateCourseTotals(courseId, totalItems, completedItems = 0) {
        return database_1.prismaClient.tutonCourse.update({
            where: { id: courseId },
            data: { totalItems, completedItems },
        });
    }
    // --- Lists / Conflicts ---
    static async listAllCoursesWithCustomerMinimal() {
        return database_1.prismaClient.tutonCourse.findMany({
            select: {
                id: true,
                matkul: true,
                createdAt: true,
                customer: { select: { id: true, namaCustomer: true } },
            },
            orderBy: [{ matkul: "asc" }, { createdAt: "asc" }],
        });
    }
    static async listCoursesByMatkul(matkul) {
        return database_1.prismaClient.tutonCourse.findMany({
            where: { matkul },
            select: {
                id: true,
                createdAt: true,
                customer: { select: { id: true, namaCustomer: true } },
            },
            orderBy: { createdAt: "asc" },
        });
    }
    // Konflik per matkul tanpa groupBy: kumpulkan lalu reduce di JS
    static async groupCoursesByMatkul() {
        const rows = await database_1.prismaClient.tutonCourse.findMany({
            select: { matkul: true },
        });
        const map = new Map();
        for (const r of rows)
            map.set(r.matkul, (map.get(r.matkul) ?? 0) + 1);
        return Array.from(map.entries())
            .map(([matkul, total]) => ({ matkul, total }))
            .sort((a, b) => b.total - a.total || a.matkul.localeCompare(b.matkul));
    }
    // --- Exist / Summary / Refresh ---
    static async exists(courseId) {
        const row = await database_1.prismaClient.tutonCourse.findUnique({
            where: { id: courseId },
            select: { id: true },
        });
        return !!row;
    }
    // Summary berbasis TutonItem (bukan field di course)
    static async getSummary(courseId) {
        const course = await database_1.prismaClient.tutonCourse.findUnique({
            where: { id: courseId },
            select: { id: true, matkul: true },
        });
        if (!course)
            return null;
        const [totalItems, completedItems, diskusiTotal, diskusiDone, diskusiAvg, absenTotal, absenDone, tugasTotal, tugasDone, tugasAvg,] = await database_1.prismaClient.$transaction([
            database_1.prismaClient.tutonItem.count({ where: { courseId } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: prisma_1.JenisTugas.DISKUSI } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: prisma_1.JenisTugas.DISKUSI, status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.aggregate({
                where: { courseId, jenis: prisma_1.JenisTugas.DISKUSI, nilai: { not: null } },
                _avg: { nilai: true },
            }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: prisma_1.JenisTugas.ABSEN } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: prisma_1.JenisTugas.ABSEN, status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: prisma_1.JenisTugas.TUGAS } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, jenis: prisma_1.JenisTugas.TUGAS, status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.aggregate({
                where: { courseId, jenis: prisma_1.JenisTugas.TUGAS, nilai: { not: null } },
                _avg: { nilai: true },
            }),
        ]);
        const progress = totalItems > 0
            ? Math.round((completedItems / totalItems) * 100)
            : 0;
        return {
            courseId,
            matkul: course.matkul,
            totalItems,
            completedItems,
            progress,
            byJenis: {
                DISKUSI: {
                    total: diskusiTotal,
                    done: diskusiDone,
                    avgNilai: diskusiAvg._avg.nilai ?? null,
                },
                ABSEN: {
                    total: absenTotal,
                    done: absenDone,
                },
                TUGAS: {
                    total: tugasTotal,
                    done: tugasDone,
                    avgNilai: tugasAvg._avg.nilai ?? null,
                },
            },
            updatedAt: new Date().toISOString(),
        };
    }
    /** Sinkronkan kembali kolom ringkasan di tabel course (opsional dipakai endpoint bulk) */
    static async refreshCompletedItems(courseId) {
        const [total, completed] = await database_1.prismaClient.$transaction([
            database_1.prismaClient.tutonItem.count({ where: { courseId } }),
            database_1.prismaClient.tutonItem.count({ where: { courseId, status: prisma_1.StatusTugas.SELESAI } }),
        ]);
        return database_1.prismaClient.tutonCourse.update({
            where: { id: courseId },
            data: { totalItems: total, completedItems: completed },
            select: { id: true, totalItems: true, completedItems: true },
        });
    }
}
exports.TutonRepository = TutonRepository;
