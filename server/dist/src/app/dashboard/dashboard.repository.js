"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRepository = void 0;
const database_1 = require("../../config/database");
const prisma_1 = require("../../generated/prisma");
function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
function endOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}
function startOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}
class DashboardRepository {
    static async countAktif() {
        return database_1.prismaClient.jamKerja.count({
            where: { status: prisma_1.StatusKerja.AKTIF, jamSelesai: null },
        });
    }
    static async countJeda() {
        return database_1.prismaClient.jamKerja.count({
            where: { status: prisma_1.StatusKerja.JEDA, jamSelesai: null },
        });
    }
    static async sumTotalJamHariIni() {
        const s = startOfToday();
        const e = endOfToday();
        const agg = await database_1.prismaClient.jamKerja.aggregate({
            where: { jamMulai: { gte: s, lte: e }, status: prisma_1.StatusKerja.SELESAI },
            _sum: { totalJam: true },
        });
        return agg._sum.totalJam ?? 0;
    }
    static async sumPayrollBulanBerjalan() {
        const s = startOfMonth();
        const agg = await database_1.prismaClient.salary.aggregate({
            where: { tanggalBayar: { gte: s } },
            _sum: { jumlahBayar: true },
        });
        return agg._sum.jumlahBayar ?? 0;
    }
}
exports.DashboardRepository = DashboardRepository;
