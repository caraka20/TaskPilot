"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JamKerjaRepository = void 0;
const database_1 = require("../../config/database");
const prisma_1 = require("../../generated/prisma");
class JamKerjaRepository {
    /** Segmen terbuka: AKTIF atau JEDA yang belum ditutup (jamSelesai = null) */
    static async findOpenByUsername(username) {
        return database_1.prismaClient.jamKerja.findMany({
            where: {
                username,
                OR: [
                    { status: prisma_1.StatusKerja.AKTIF, jamSelesai: null },
                    { status: prisma_1.StatusKerja.JEDA, jamSelesai: null },
                ],
            },
            orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
        });
    }
    /** Buat segmen baru AKTIF; isi kolom wajib */
    static async createStart(username, jamMulai) {
        const tanggal = new Date(jamMulai.getFullYear(), jamMulai.getMonth(), jamMulai.getDate(), 0, 0, 0, 0);
        return database_1.prismaClient.jamKerja.create({
            data: {
                username,
                tanggal,
                jamMulai,
                jamSelesai: null,
                totalJam: 0,
                status: prisma_1.StatusKerja.AKTIF,
            },
        });
    }
    static async findById(id) {
        return database_1.prismaClient.jamKerja.findUnique({ where: { id } });
    }
    static async closeAs(id, jamSelesai, totalJam, status) {
        return database_1.prismaClient.jamKerja.update({
            where: { id },
            data: { jamSelesai, totalJam, status },
        });
    }
    static async endJamKerja(id, jamSelesai, totalJam) {
        return this.closeAs(id, jamSelesai, totalJam, prisma_1.StatusKerja.SELESAI);
    }
    static async findByUsername(username) {
        return database_1.prismaClient.jamKerja.findMany({
            where: { username },
            orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
            take: 200,
        });
    }
    static async rekap(username, start, end) {
        return database_1.prismaClient.jamKerja.aggregate({
            where: {
                username,
                jamMulai: { gte: start, lte: end },
                status: prisma_1.StatusKerja.SELESAI,
            },
            _sum: { totalJam: true },
        });
    }
    static async findAktif(query) {
        return database_1.prismaClient.jamKerja.findMany({
            where: {
                username: query.username,
                status: { in: [prisma_1.StatusKerja.AKTIF, prisma_1.StatusKerja.JEDA] },
            },
            orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
        });
    }
    static async updateStatus(id, status) {
        return database_1.prismaClient.jamKerja.update({
            where: { id },
            data: { status },
        });
    }
    static async sumTotalJamAll(username) {
        const agg = await database_1.prismaClient.jamKerja.aggregate({
            where: { username, status: prisma_1.StatusKerja.SELESAI },
            _sum: { totalJam: true },
        });
        return Number(agg._sum.totalJam ?? 0);
    }
    static async findLatestByUsername(username) {
        return database_1.prismaClient.jamKerja.findFirst({
            where: { username },
            orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
        });
    }
    static async findCurrentAll() {
        return database_1.prismaClient.jamKerja.findMany({
            where: { jamSelesai: null },
            select: { username: true, status: true, jamSelesai: true, jamMulai: true, id: true },
            orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
        });
    }
    static async rekapAktif(username, start, end) {
        return database_1.prismaClient.jamKerja.aggregate({
            where: {
                username,
                jamMulai: { gte: start, lte: end },
                status: { in: [prisma_1.StatusKerja.AKTIF, prisma_1.StatusKerja.JEDA] },
            },
            _sum: { totalJam: true },
        });
    }
}
exports.JamKerjaRepository = JamKerjaRepository;
exports.default = JamKerjaRepository;
