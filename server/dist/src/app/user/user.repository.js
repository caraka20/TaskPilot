"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const database_1 = require("../../config/database");
class UserRepository {
    static async findByUsername(username) {
        return database_1.prismaClient.user.findUnique({ where: { username } });
    }
    static async create(data) {
        return database_1.prismaClient.user.create({ data });
    }
    static async findAllUsers() {
        return database_1.prismaClient.user.findMany();
    }
    static async login(username, token) {
        return database_1.prismaClient.user.update({
            where: { username },
            data: { token },
        });
    }
    static async logout(user) {
        return database_1.prismaClient.user.update({
            where: { username: user.username },
            data: { token: null },
        });
    }
    /**
     * DETAIL USER (schema baru)
     * - ikutkan relasi yang kamu perlukan
     */
    static async getUserDetail(username) {
        return database_1.prismaClient.user.findUnique({
            where: { username },
            include: {
                // ✅ urutkan sama seperti repo jam kerja supaya FE dapat status terkini yang benar
                jamKerja: {
                    orderBy: [
                        { jamSelesai: "asc" }, // null (OPEN) dulu
                        { jamMulai: "desc" },
                        { id: "desc" },
                    ],
                },
                riwayatGaji: true,
                tutonItems: {
                    select: {
                        id: true,
                        deskripsi: true,
                        jenis: true,
                        sesi: true,
                        status: true,
                        selesaiAt: true,
                        course: {
                            select: {
                                customer: {
                                    select: {
                                        id: true,
                                        namaCustomer: true,
                                        nim: true,
                                        jurusan: true,
                                    },
                                },
                            },
                        },
                    },
                    take: 50,
                },
            },
        });
    }
    static async getKonfigurasi() {
        return database_1.prismaClient.konfigurasi.findFirst();
    }
    /** Ambil override (jika ada) untuk username */
    static async getOverride(username) {
        return database_1.prismaClient.konfigurasiOverride.findUnique({
            where: { username },
            select: {
                username: true,
                gajiPerJam: true,
                batasJedaMenit: true,
                jedaOtomatisAktif: true,
                updatedAt: true,
            },
        });
    }
    /**
     * Upsert override DENGAN MERGE
     */
    static async upsertOverrideMerged(username, patch) {
        const [globalCfg, current] = await Promise.all([
            database_1.prismaClient.konfigurasi.findFirst(),
            database_1.prismaClient.konfigurasiOverride.findUnique({ where: { username } }),
        ]);
        const merged = {
            gajiPerJam: patch.gajiPerJam ??
                current?.gajiPerJam ??
                (globalCfg?.gajiPerJam ?? 0),
            batasJedaMenit: patch.batasJedaMenit ??
                current?.batasJedaMenit ??
                (globalCfg?.batasJedaMenit ?? 0),
            jedaOtomatisAktif: patch.jedaOtomatisAktif ??
                current?.jedaOtomatisAktif ??
                (globalCfg?.jedaOtomatisAktif ?? false),
            updatedAt: new Date(),
        };
        const row = await database_1.prismaClient.konfigurasiOverride.upsert({
            where: { username },
            update: merged,
            create: { username, ...merged },
            select: {
                username: true,
                gajiPerJam: true,
                batasJedaMenit: true,
                jedaOtomatisAktif: true,
                updatedAt: true,
            },
        });
        return row;
    }
    /** Khusus set jeda otomatis via UserService → tetap kembalikan bentuk yang FE harapkan */
    static async upsertOverrideJeda(username, aktif) {
        const row = await this.upsertOverrideMerged(username, {
            jedaOtomatisAktif: aktif,
        });
        return { username: row.username, jedaOtomatis: row.jedaOtomatisAktif };
    }
    static async deleteOverride(username) {
        await database_1.prismaClient.konfigurasiOverride.delete({ where: { username } });
        return { ok: true };
    }
    static async tambahJamKerjaDanGaji(username, totalJam, gajiPerJam) {
        const totalGaji = (totalJam || 0) * (gajiPerJam || 0);
        try {
            return await database_1.prismaClient.user.update({
                where: { username },
                data: {
                    totalJamKerja: { increment: totalJam },
                    totalGaji: { increment: totalGaji },
                },
            });
        }
        catch {
            return null;
        }
    }
    // Daftar semua username (urut alfabet)
    static async listUsernames() {
        const rows = await database_1.prismaClient.user.findMany({
            select: { username: true },
            orderBy: { username: "asc" },
        });
        return rows.map((r) => r.username);
    }
    // Konfigurasi efektif per user (override > global)
    static async getEffectiveKonfigurasi(username) {
        const [globalCfg, override] = await Promise.all([
            database_1.prismaClient.konfigurasi.findFirst(),
            database_1.prismaClient.konfigurasiOverride.findUnique({ where: { username } }),
        ]);
        return {
            gajiPerJam: Number(override?.gajiPerJam ?? globalCfg?.gajiPerJam ?? 0),
            batasJedaMenit: Number(override?.batasJedaMenit ?? globalCfg?.batasJedaMenit ?? 0),
            jedaOtomatisAktif: Boolean(override?.jedaOtomatisAktif ?? globalCfg?.jedaOtomatisAktif ?? false),
            // kunci: pastikan tipe literal, bukan string biasa
            source: (override ? "override" : "global"),
            updatedAt: override?.updatedAt,
        };
    }
}
exports.UserRepository = UserRepository;
