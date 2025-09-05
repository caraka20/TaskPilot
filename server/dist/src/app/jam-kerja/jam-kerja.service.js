"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JamKerjaService = void 0;
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const user_repository_1 = require("../user/user.repository");
const jam_kerja_model_1 = require("./jam-kerja.model");
const jam_kerja_repository_1 = require("./jam-kerja.repository");
const server_1 = require("../../server");
const prisma_1 = require("../../generated/prisma");
/* helpers tanggal */
function startOfToday() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0); }
function endOfToday() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); }
function startOfWeek() { const now = new Date(); const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1); return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0); }
function endOfWeek() { const s = startOfWeek(); const e = new Date(s); e.setDate(e.getDate() + 6); e.setHours(23, 59, 59, 999); return e; }
function startOfMonth() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); }
function endOfMonth() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); }
const round2 = (n) => Math.round(n * 100) / 100;
const round0 = (n) => Math.round(n);
function toNum(x, d = 0) { const n = Number(x); return Number.isFinite(n) ? n : d; }
async function getRateFor(username) {
    try {
        const eff = await user_repository_1.UserRepository.getEffectiveKonfigurasi?.(username);
        const val = toNum(eff?.gajiPerJam, NaN);
        if (!Number.isNaN(val) && val > 0)
            return val;
    }
    catch { }
    try {
        const g = await user_repository_1.UserRepository.getKonfigurasi();
        const val = toNum(g?.gajiPerJam, NaN);
        if (!Number.isNaN(val) && val > 0)
            return val;
    }
    catch { }
    const envVal = toNum(process.env.DEFAULT_GAJI_PER_JAM, NaN);
    if (!Number.isNaN(envVal) && envVal > 0)
        return envVal;
    return 10000;
}
class JamKerjaService {
    /* START */
    static async startJamKerja(payload) {
        // pastikan user ada → kalau tidak, jangan biarkan Prisma error 500
        const target = await user_repository_1.UserRepository.findByUsername(payload.username);
        if (!target)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.USER_NOT_FOUND);
        // jika sudah ada sesi terbuka, kembalikan saja (tidak error) supaya FE langsung sync
        const open = await jam_kerja_repository_1.JamKerjaRepository.findOpenByUsername(payload.username);
        if (open.length > 0)
            return open[0];
        // buat segmen baru
        const now = new Date();
        const jamKerja = await jam_kerja_repository_1.JamKerjaRepository.createStart(payload.username, now);
        server_1.io?.emit?.("jamKerja:started", {
            id: jamKerja.id,
            username: jamKerja.username,
            jamMulai: jamKerja.jamMulai,
            status: jamKerja.status,
        });
        return jamKerja;
    }
    /* END (SELESAI) */
    static async endJamKerja(current, id) {
        const row = await jam_kerja_repository_1.JamKerjaRepository.findById(id);
        if (!row)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND);
        if (current.role !== prisma_1.Role.OWNER && row.username !== current.username) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN);
        }
        if (row.status !== "AKTIF" || row.jamSelesai) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Sesi tidak aktif");
        }
        const now = new Date();
        const durasiJam = (now.getTime() - new Date(row.jamMulai).getTime()) / 3600000;
        const totalJam = Math.max(0, round2(durasiJam));
        const gajiPerJam = await getRateFor(row.username);
        await jam_kerja_repository_1.JamKerjaRepository.endJamKerja(id, now, totalJam);
        await user_repository_1.UserRepository.tambahJamKerjaDanGaji(row.username, totalJam, gajiPerJam);
        server_1.io?.emit?.("jamKerja:ended", {
            id: row.id,
            username: row.username,
            jamSelesai: now,
            totalJam,
            status: "SELESAI",
        });
        return { totalJam, jamSelesai: now };
    }
    /* HISTORY */
    static async getHistory(username) {
        const list = await jam_kerja_repository_1.JamKerjaRepository.findByUsername(username);
        return list.map((j) => ({
            id: j.id, username: j.username,
            jamMulai: j.jamMulai, jamSelesai: j.jamSelesai,
            totalJam: j.totalJam, status: j.status, tanggal: j.tanggal,
        }));
    }
    /* REKAP */
    static async rekap(username, period) {
        const now = new Date();
        let start;
        if (period === "minggu") {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(now.getFullYear(), now.getMonth(), diff);
        }
        else {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const result = await jam_kerja_repository_1.JamKerjaRepository.rekap(username, start, new Date());
        const totalJam = result._sum.totalJam || 0;
        return (0, jam_kerja_model_1.toRekapJamKerjaResponse)(username, totalJam, period);
    }
    static async getActive(current, query) {
        if (current.role === prisma_1.Role.USER && query.username !== current.username) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
        }
        const now = new Date();
        let start;
        if (query.period === "minggu") {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start = new Date(now.getFullYear(), now.getMonth(), diff);
        }
        else {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const agg = await jam_kerja_repository_1.JamKerjaRepository.rekapAktif?.(query.username, start, now);
        const totalJam = agg?._sum.totalJam || 0;
        return (0, jam_kerja_model_1.toRekapJamKerjaResponse)(query.username, totalJam, query.period);
    }
    static async getAktif(query) {
        const list = await jam_kerja_repository_1.JamKerjaRepository.findAktif(query);
        return list.map((j) => ({
            id: j.id, username: j.username,
            jamMulai: j.jamMulai, jamSelesai: j.jamSelesai,
            totalJam: j.totalJam, status: j.status, tanggal: j.tanggal,
        }));
    }
    /* PAUSE/RESUME */
    static async pause(current, id) {
        const row = await jam_kerja_repository_1.JamKerjaRepository.findById(id);
        if (!row)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND);
        if (current.role !== prisma_1.Role.OWNER && row.username !== current.username) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN);
        }
        if (row.status !== "AKTIF" || row.jamSelesai)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Sesi tidak bisa dijeda");
        const now = new Date();
        const durasiJam = (now.getTime() - new Date(row.jamMulai).getTime()) / 3600000;
        const updated = await jam_kerja_repository_1.JamKerjaRepository.closeAs(id, now, Math.max(0, Math.round(durasiJam * 100) / 100), prisma_1.StatusKerja.JEDA);
        server_1.io?.emit?.("jamKerja:paused", {
            id: updated.id, username: updated.username, status: updated.status,
            jamMulai: updated.jamMulai, jamSelesai: updated.jamSelesai, totalJam: updated.totalJam,
        });
        return updated;
    }
    static async resume(current, id) {
        const row = await jam_kerja_repository_1.JamKerjaRepository.findById(id);
        if (!row)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND);
        if (current.role !== prisma_1.Role.OWNER && row.username !== current.username) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN);
        }
        if (row.status !== "JEDA") {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Sesi tidak bisa diresume");
        }
        // legacy flip jika belum ditutup
        if (!row.jamSelesai) {
            const updated = await jam_kerja_repository_1.JamKerjaRepository.updateStatus(id, prisma_1.StatusKerja.AKTIF);
            server_1.io?.emit?.("jamKerja:resumed", {
                id: updated.id, username: updated.username, status: updated.status, jamMulai: updated.jamMulai,
            });
            return updated;
        }
        // segmen baru jika jeda sudah ditutup
        const open = await jam_kerja_repository_1.JamKerjaRepository.findOpenByUsername(row.username);
        if (open.length > 0) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Masih ada sesi aktif");
        }
        const now = new Date();
        const created = await jam_kerja_repository_1.JamKerjaRepository.createStart(row.username, now);
        server_1.io?.emit?.("jamKerja:resumed", {
            id: created.id, username: created.username, status: created.status, jamMulai: created.jamMulai,
        });
        return created;
    }
    /* SUMMARY (tetap) */
    static async buildUserSummary(username) {
        const gajiPerJam = await getRateFor(username);
        const latestList = await jam_kerja_repository_1.JamKerjaRepository.findByUsername(username);
        const latest = latestList[0];
        const [todayAgg, weekAgg, monthAgg, allJam] = await Promise.all([
            jam_kerja_repository_1.JamKerjaRepository.rekap(username, startOfToday(), endOfToday()),
            jam_kerja_repository_1.JamKerjaRepository.rekap(username, startOfWeek(), endOfWeek()),
            jam_kerja_repository_1.JamKerjaRepository.rekap(username, startOfMonth(), endOfMonth()),
            jam_kerja_repository_1.JamKerjaRepository.sumTotalJamAll(username),
        ]);
        const todayJam = toNum(todayAgg._sum.totalJam);
        const weekJam = toNum(weekAgg._sum.totalJam);
        const monthJam = toNum(monthAgg._sum.totalJam);
        const allTotal = toNum(allJam);
        let status = "OFF";
        if (latest?.status === "AKTIF")
            status = "AKTIF";
        else if (latest?.status === "JEDA")
            status = "JEDA";
        else if (latest?.status === "SELESAI")
            status = "SELESAI";
        return {
            username,
            status,
            sesiTerakhir: latest ? {
                id: latest.id, jamMulai: latest.jamMulai, jamSelesai: latest.jamSelesai, status: latest.status,
            } : null,
            totals: {
                hari: { totalJam: round2(todayJam), totalGaji: round0(todayJam * gajiPerJam) },
                minggu: { totalJam: round2(weekJam), totalGaji: round0(weekJam * gajiPerJam) },
                bulan: { totalJam: round2(monthJam), totalGaji: round0(monthJam * gajiPerJam) },
                semua: { totalJam: round2(allTotal), totalGaji: round0(allTotal * gajiPerJam) },
            },
        };
    }
    static async buildOwnerSummary(filterUsername) {
        const usernames = filterUsername ? [filterUsername] : await user_repository_1.UserRepository.listUsernames();
        const [summaries, currents] = await Promise.all([
            Promise.all(usernames.map((u) => this.buildUserSummary(u))),
            jam_kerja_repository_1.JamKerjaRepository.findCurrentAll(),
        ]);
        const aktifSet = new Set();
        const jedaSet = new Set();
        for (const c of currents) {
            if (c.status === prisma_1.StatusKerja.AKTIF && c.jamSelesai === null)
                aktifSet.add(c.username);
            if (c.status === prisma_1.StatusKerja.JEDA && c.jamSelesai === null)
                jedaSet.add(c.username);
        }
        return {
            generatedAt: new Date(),
            counts: { users: summaries.length, aktif: aktifSet.size, jeda: jedaSet.size },
            users: summaries,
        };
    }
}
exports.JamKerjaService = JamKerjaService;
exports.default = JamKerjaService;
