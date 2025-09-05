"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = require("./user.model");
const user_repository_1 = require("./user.repository");
const error_codes_1 = require("../../utils/error-codes");
const app_error_1 = require("../../middleware/app-error");
const jwt_1 = require("../../utils/jwt");
const jam_kerja_repository_1 = require("../jam-kerja/jam-kerja.repository");
const gaji_repository_1 = require("../gaji/gaji.repository");
const round2 = (n) => Math.round(n * 100) / 100;
const round0 = (n) => Math.round(n);
function safeISO(s) {
    if (!s)
        return undefined;
    return s.length === 10 ? `${s}T00:00:00.000Z` : s;
}
function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
function endOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}
function startOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
}
function endOfWeek() {
    const s = startOfWeek();
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
}
function startOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}
class UserService {
    static async register(request) {
        const existing = await user_repository_1.UserRepository.findByUsername(request.username);
        if (existing) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_ALREADY_EXISTS);
        }
        const hashPassword = await bcrypt_1.default.hash(request.password, 10);
        request.password = hashPassword;
        const user = await user_repository_1.UserRepository.create(request);
        return (0, user_model_1.toUserResponse)(user);
    }
    static async login(request) {
        const user = await user_repository_1.UserRepository.findByUsername(request.username);
        if (!user)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_NOT_FOUND);
        const isPasswordValid = await bcrypt_1.default.compare(request.password, user.password);
        if (!isPasswordValid)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
        const token = (0, jwt_1.generateToken)({ username: user.username });
        await user_repository_1.UserRepository.login(user.username, token);
        return (0, user_model_1.toLoginResponse)(user, token);
    }
    static async getAllUsers() {
        const users = await user_repository_1.UserRepository.findAllUsers();
        return users.map(user_model_1.toUserResponse);
    }
    static async getUserDetail(request) {
        const user = await user_repository_1.UserRepository.getUserDetail(request.username);
        if (!user)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_NOT_FOUND);
        const base = (0, user_model_1.toUserDetailResponse)(user);
        const ov = await user_repository_1.UserRepository.getOverride(request.username);
        const withOverride = ov
            ? { ...base, jedaOtomatis: ov.jedaOtomatisAktif }
            : base;
        return withOverride;
    }
    static async logout(userReq) {
        await user_repository_1.UserRepository.logout(userReq.user);
        return { loggedOut: true };
    }
    static async setJedaOtomatis(username, payload) {
        const user = await user_repository_1.UserRepository.findByUsername(username);
        if (!user)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_NOT_FOUND);
        return user_repository_1.UserRepository.upsertOverrideJeda(username, payload.aktif);
    }
    /* ========= AGREGAT DETAIL LENGKAP ========= */
    static async getUserEverything(username, query) {
        const base = await user_repository_1.UserRepository.getUserDetail(username);
        if (!base)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_NOT_FOUND);
        // konfigurasi efektif (override > global)
        const eff = await user_repository_1.UserRepository.getEffectiveKonfigurasi(username);
        const gajiPerJam = eff.gajiPerJam || 0;
        // summary jam (hari/minggu/bulan/semua)
        const [todayAgg, weekAgg, monthAgg, allTotalJam] = await Promise.all([
            jam_kerja_repository_1.JamKerjaRepository.rekap(username, startOfToday(), endOfToday()),
            jam_kerja_repository_1.JamKerjaRepository.rekap(username, startOfWeek(), endOfWeek()),
            jam_kerja_repository_1.JamKerjaRepository.rekap(username, startOfMonth(), endOfMonth()),
            jam_kerja_repository_1.JamKerjaRepository.sumTotalJamAll(username),
        ]);
        const hariJam = todayAgg._sum.totalJam ?? 0;
        const mingguJam = weekAgg._sum.totalJam ?? 0;
        const bulanJam = monthAgg._sum.totalJam ?? 0;
        const semuaJam = allTotalJam ?? 0;
        // status & session aktif (ambil latest)
        const latestList = await jam_kerja_repository_1.JamKerjaRepository.findByUsername(username);
        const latest = latestList[0];
        let latestStatus = "OFF";
        if (latest?.status === "AKTIF")
            latestStatus = "AKTIF";
        else if (latest?.status === "JEDA")
            latestStatus = "JEDA";
        else if (latest?.status === "SELESAI")
            latestStatus = "SELESAI";
        const open = await jam_kerja_repository_1.JamKerjaRepository.findOpenByUsername(username);
        const activeSessionId = open[0]?.id ?? null;
        // histori hari ini
        const todayStart = startOfToday();
        const todayEnd = endOfToday();
        const todayItems = latestList.filter((j) => {
            const t = new Date(j.jamMulai).getTime();
            return t >= todayStart.getTime() && t <= todayEnd.getTime();
        });
        // histori by range + pagination
        const histPage = Math.max(1, Number(query.histPage || 1));
        const histLimit = Math.min(100, Math.max(1, Number(query.histLimit || 20)));
        const rangeFrom = safeISO(query.from);
        const rangeTo = safeISO(query.to);
        const ranged = latestList.filter((j) => {
            const t = new Date(j.jamMulai).getTime();
            if (rangeFrom && t < new Date(rangeFrom).getTime())
                return false;
            if (rangeTo && t > new Date(rangeTo).getTime())
                return false;
            return true;
        });
        ranged.sort((a, b) => +new Date(b.jamMulai) - +new Date(a.jamMulai));
        const histTotal = ranged.length;
        const histItems = ranged.slice((histPage - 1) * histLimit, (histPage - 1) * histLimit + histLimit);
        // riwayat pembayaran (pagination)
        const payPage = Math.max(1, Number(query.payPage || 1));
        const payLimit = Math.min(100, Math.max(1, Number(query.payLimit || 10)));
        const { items: payItems, total: payTotal } = await gaji_repository_1.GajiRepository.findMany({ username }, { skip: (payPage - 1) * payLimit, take: payLimit, order: "desc" });
        // summary gaji
        const totalDiterima = await gaji_repository_1.GajiRepository.sumByUsername(username);
        const totalJamAll = round2(semuaJam);
        const upahKeseluruhan = round2(totalJamAll * gajiPerJam);
        const belumDibayar = round2(Math.max(0, upahKeseluruhan - totalDiterima));
        // tugas (mapping dari base)
        const tugas = ((0, user_model_1.toUserDetailResponse)(base).tugas ?? []).slice(0, 50);
        return {
            profile: {
                username: base.username,
                namaLengkap: base.namaLengkap,
                role: base.role,
                createdAt: base.createdAt,
                updatedAt: base.updatedAt,
                totals: {
                    totalJamKerja: base.totalJamKerja,
                    totalGaji: base.totalGaji,
                },
            },
            konfigurasi: eff,
            jamKerja: {
                latestStatus,
                activeSessionId,
                today: { items: todayItems, total: todayItems.length },
                summary: {
                    hari: { totalJam: round2(hariJam), totalGaji: round0(hariJam * gajiPerJam) },
                    minggu: { totalJam: round2(mingguJam), totalGaji: round0(mingguJam * gajiPerJam) },
                    bulan: { totalJam: round2(bulanJam), totalGaji: round0(bulanJam * gajiPerJam) },
                    semua: { totalJam: round2(semuaJam), totalGaji: round0(semuaJam * gajiPerJam) },
                },
                history: {
                    items: histItems,
                    page: histPage,
                    perPage: histLimit,
                    total: histTotal,
                    range: { from: query.from, to: query.to },
                },
            },
            gaji: {
                gajiPerJam,
                summary: {
                    totalJam: totalJamAll,
                    upahKeseluruhan,
                    totalDiterima,
                    belumDibayar,
                },
                riwayat: {
                    items: payItems,
                    page: payPage,
                    perPage: payLimit,
                    total: payTotal,
                },
            },
            tugas,
        };
    }
}
exports.UserService = UserService;
