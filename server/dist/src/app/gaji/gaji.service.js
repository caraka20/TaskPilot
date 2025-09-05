"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GajiService = void 0;
const database_1 = require("../../config/database");
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const pagination_1 = require("../../utils/pagination");
const konfigurasi_service_1 = require("../konfigurasi/konfigurasi.service");
const jam_kerja_repository_1 = require("../jam-kerja/jam-kerja.repository");
const user_repository_1 = require("../user/user.repository");
const gaji_repository_1 = require("./gaji.repository");
const gaji_model_1 = require("./gaji.model");
const round2 = (n) => Math.round(n * 100) / 100;
class GajiService {
    static async createGaji(request) {
        const { username, jumlahBayar, catatan } = request;
        if (!Number.isFinite(jumlahBayar) || jumlahBayar <= 0) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, 'Jumlah bayar harus > 0');
        }
        // Transaksi: validasi sisa berbasis (totalJam SELESAI × rate efektif) - total dibayar
        const created = await database_1.prismaClient.$transaction(async (tx) => {
            const user = await gaji_repository_1.GajiRepository.findUserByUsername(tx, username);
            if (!user)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_NOT_FOUND);
            // rate efektif (override > global)
            const eff = await konfigurasi_service_1.KonfigurasiService.getEffective(username);
            const gajiPerJam = eff?.effective?.gajiPerJam ?? 0;
            // total jam selesai (all-time) — pakai repo jam kerja (non-tx; konsisten cukup)
            const totalJam = await jam_kerja_repository_1.JamKerjaRepository.sumTotalJamAll(username);
            const upahKeseluruhan = totalJam * gajiPerJam;
            // total yang sudah dibayar (tx)
            const totalPaid = await gaji_repository_1.GajiRepository.sumPaidByUsernameTx(tx, username);
            const remaining = round2(Math.max(0, upahKeseluruhan - totalPaid));
            const EPS = 1e-9;
            if (jumlahBayar - remaining > EPS) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.GAJI_EXCEEDS_REMAINING, `${error_codes_1.ERROR_DEFINITIONS.GAJI_EXCEEDS_REMAINING.message}. Sisa saat ini: ${remaining}`);
            }
            const row = await gaji_repository_1.GajiRepository.createTx(tx, {
                username,
                jumlahBayar,
                catatan: catatan ?? null,
            });
            return row;
        });
        return (0, gaji_model_1.toGajiResponse)(created);
    }
    /* ================= LIST OWNER ================= */
    static async getAllGaji(query) {
        const where = (await Promise.resolve().then(() => __importStar(require('./gaji.model')))).GajiModel.buildWhere(query);
        const { page, limit, skip } = (0, pagination_1.getPagination)(query);
        const [total, list] = await Promise.all([
            gaji_repository_1.GajiRepository.countAll(where),
            gaji_repository_1.GajiRepository.findAllPaginated(where, skip, limit),
        ]);
        return {
            page,
            total,
            perPage: limit,
            data: list.map(gaji_model_1.toGajiResponse),
        };
    }
    /* ================= CRUD by id ================= */
    static async deleteById(id) {
        const gaji = await gaji_repository_1.GajiRepository.findById(id);
        if (!gaji)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, error_codes_1.ERROR_DEFINITIONS.NOT_FOUND);
        await gaji_repository_1.GajiRepository.deleteById(id);
    }
    static async updateById(id, request) {
        // jalankan sebagai transaksi biar konsisten
        const updated = await database_1.prismaClient.$transaction(async (tx) => {
            const row = await gaji_repository_1.GajiRepository.findByIdTx(tx, id);
            if (!row) {
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, error_codes_1.ERROR_DEFINITIONS.NOT_FOUND.message);
            }
            // user pemilik record
            const user = await gaji_repository_1.GajiRepository.findUserByUsername(tx, row.username);
            if (!user)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_NOT_FOUND);
            // siapkan patch dinamis
            const patch = {};
            // jika jumlahBayar dikirim → validasi nominal & sisa
            if (Object.prototype.hasOwnProperty.call(request, "jumlahBayar")) {
                const jml = Number(request.jumlahBayar);
                if (!Number.isFinite(jml) || jml <= 0) {
                    throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Jumlah bayar harus > 0");
                }
                // total yg sudah dibayar EXCEPT baris ini
                const paidExceptThis = await gaji_repository_1.GajiRepository.sumPaidByUsernameExcludingId(tx, row.username, row.id);
                const remaining = (user.totalGaji ?? 0) - paidExceptThis;
                const EPS = 1e-6;
                if (jml - remaining > EPS) {
                    const sisaStr = Math.max(0, Math.round(remaining * 100) / 100);
                    // kirimkan pesan human-friendly pada "errors" oleh error handler-mu
                    throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.GAJI_EXCEEDS_REMAINING, `${error_codes_1.ERROR_DEFINITIONS.GAJI_EXCEEDS_REMAINING.message}. Sisa saat ini: ${sisaStr}`);
                }
                patch.jumlahBayar = jml;
            }
            // jika catatan dikirim → set (boleh null)
            if (Object.prototype.hasOwnProperty.call(request, "catatan")) {
                patch.catatan = request.catatan ?? null;
            }
            if (Object.keys(patch).length === 0) {
                // seharusnya tertangkap di Zod, tapi jaga-jaga
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Tidak ada perubahan");
            }
            const res = await gaji_repository_1.GajiRepository.updateTx(tx, id, patch);
            return res;
        });
        return (0, gaji_model_1.toGajiResponse)(updated);
    }
    /* ================= LIST USER ================= */
    static async getMyGaji(username, query) {
        const page = Math.max(1, Number(query.page || 1));
        const limit = Math.min(100, Math.max(1, Number(query.limit || 10)));
        const skip = (page - 1) * limit;
        const order = query.sort || 'desc';
        const where = { username };
        if (query['tanggalBayar.gte'] || query['tanggalBayar.lte']) {
            where.tanggalBayar = {};
            if (query['tanggalBayar.gte']) {
                const s = query['tanggalBayar.gte'];
                where.tanggalBayar.gte = new Date(s.length === 10 ? `${s}T00:00:00.000Z` : s);
            }
            if (query['tanggalBayar.lte']) {
                const s = query['tanggalBayar.lte'];
                where.tanggalBayar.lte = new Date(s.length === 10 ? `${s}T23:59:59.999Z` : s);
            }
        }
        const { items, total } = await gaji_repository_1.GajiRepository.findMany(where, { skip, take: limit, order });
        const data = items.map((it) => (0, gaji_model_1.toGajiResponse)(it));
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return { items: data, pagination: { page, limit, total, totalPages } };
    }
    /* ================= SUMMARY OWNER ================= */
    static async getSummary(period) {
        const now = new Date();
        let start;
        if (period === 'minggu') {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0);
        }
        else if (period === 'bulan') {
            const d = new Date();
            start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
        }
        const jamWhere = { status: 'SELESAI' };
        if (start)
            jamWhere.jamMulai = { gte: start, lte: now };
        const aggJam = await database_1.prismaClient.jamKerja.aggregate({ where: jamWhere, _sum: { totalJam: true } });
        const totalJam = aggJam._sum.totalJam ?? 0;
        const cfg = await user_repository_1.UserRepository.getKonfigurasi();
        const gajiPerJam = cfg?.gajiPerJam ?? 0;
        const totalGaji = totalJam * gajiPerJam;
        const salaryWhere = {};
        if (start)
            salaryWhere.tanggalBayar = { gte: start, lte: now };
        const aggPay = await database_1.prismaClient.salary.aggregate({ where: salaryWhere, _sum: { jumlahBayar: true } });
        const totalDibayar = aggPay._sum.jumlahBayar ?? 0;
        const belumDibayar = Math.max(0, totalGaji - totalDibayar);
        return { period, totalGaji, totalDibayar, belumDibayar };
    }
    /* ================= SUMMARY USER ================= */
    static async getMySummary(username) {
        const user = await user_repository_1.UserRepository.findByUsername(username);
        if (!user)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_NOT_FOUND);
        const eff = await konfigurasi_service_1.KonfigurasiService.getEffective(username);
        const gajiPerJam = eff?.effective?.gajiPerJam ?? 0;
        const totalJamRaw = await jam_kerja_repository_1.JamKerjaRepository.sumTotalJamAll(username);
        const totalJam = round2(totalJamRaw);
        const totalDiterima = await gaji_repository_1.GajiRepository.sumByUsername(username);
        const upahKeseluruhan = round2(totalJam * gajiPerJam);
        const belumDibayar = round2(Math.max(0, upahKeseluruhan - totalDiterima));
        return {
            username,
            totalJam,
            gajiPerJam,
            upahKeseluruhan,
            totalDiterima,
            belumDibayar,
        };
    }
}
exports.GajiService = GajiService;
