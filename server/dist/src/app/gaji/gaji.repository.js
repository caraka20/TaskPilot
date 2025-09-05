"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GajiRepository = void 0;
const database_1 = require("../../config/database");
class GajiRepository {
    /* =========================
     * Non-transactional methods
     * ========================= */
    static async create(data) {
        return database_1.prismaClient.salary.create({
            data: {
                username: data.username,
                jumlahBayar: data.jumlahBayar,
                catatan: data.catatan ?? null,
            },
        });
    }
    static async findAllPaginated(where, skip, take) {
        return database_1.prismaClient.salary.findMany({
            where,
            skip,
            take,
            orderBy: { tanggalBayar: 'desc' },
            include: { user: true },
        });
    }
    static async countAll(where) {
        return database_1.prismaClient.salary.count({ where });
    }
    static async findById(id) {
        return database_1.prismaClient.salary.findUnique({ where: { id } });
    }
    static async deleteById(id) {
        return database_1.prismaClient.salary.delete({ where: { id } });
    }
    static async updateById(id, data) {
        return database_1.prismaClient.salary.update({ where: { id }, data });
    }
    static async findMany(where, opts) {
        const [items, total] = await Promise.all([
            database_1.prismaClient.salary.findMany({
                where,
                orderBy: { tanggalBayar: opts.order },
                skip: opts.skip,
                take: opts.take,
                select: {
                    id: true,
                    username: true,
                    jumlahBayar: true,
                    catatan: true,
                    tanggalBayar: true,
                    user: { select: { namaLengkap: true } },
                },
            }),
            database_1.prismaClient.salary.count({ where }),
        ]);
        return { items, total };
    }
    /** Sum pembayaran all-time per user (non-tx) */
    static async sumByUsername(username) {
        const agg = await database_1.prismaClient.salary.aggregate({
            where: { username },
            _sum: { jumlahBayar: true },
        });
        return agg._sum.jumlahBayar ?? 0;
    }
    /* =========================
     * Transactional helpers
     * ========================= */
    /** Ambil user dalam TX (untuk cek totalGaji & keberadaan user) */
    static async findUserByUsername(tx, username) {
        return tx.user.findUnique({ where: { username } });
    }
    /** Sum pembayaran user dalam TX (semua baris) */
    static async sumPaidByUsernameTx(tx, username) {
        const agg = await tx.salary.aggregate({
            where: { username },
            _sum: { jumlahBayar: true },
        });
        return agg._sum.jumlahBayar ?? 0;
    }
    /** Sum pembayaran user dalam TX, TIDAK menghitung baris `excludeId` */
    static async sumPaidByUsernameExcludingId(tx, username, excludeId) {
        const agg = await tx.salary.aggregate({
            where: { username, NOT: { id: excludeId } },
            _sum: { jumlahBayar: true },
        });
        return agg._sum.jumlahBayar ?? 0;
    }
    /** Insert salary dalam TX */
    static async createTx(tx, payload) {
        return tx.salary.create({
            data: {
                username: payload.username,
                jumlahBayar: payload.jumlahBayar,
                catatan: payload.catatan ?? null,
            },
        });
    }
    /** Ambil salary by id dalam TX */
    static async findByIdTx(tx, id) {
        return tx.salary.findUnique({ where: { id } });
    }
    /** Update salary dalam TX */
    static async updateTx(tx, id, data) {
        return tx.salary.update({ where: { id }, data });
    }
}
exports.GajiRepository = GajiRepository;
