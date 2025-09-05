"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KonfigurasiService = void 0;
const konfigurasi_repository_1 = require("./konfigurasi.repository");
const konfigurasi_model_1 = require("./konfigurasi.model");
const error_codes_1 = require("../../utils/error-codes");
const app_error_1 = require("../../middleware/app-error");
class KonfigurasiService {
    static async get() {
        await konfigurasi_repository_1.KonfigurasiRepository.initIfMissing();
        const cfg = await konfigurasi_repository_1.KonfigurasiRepository.getRaw();
        if (!cfg) {
            // practically tidak terjadi karena initIfMissing
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "Konfigurasi global tidak ditemukan");
        }
        return (0, konfigurasi_model_1.toKonfigurasiResponse)(cfg);
    }
    /** PATCH global */
    static async update(data) {
        if (!data || Object.keys(data).length === 0) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Tidak ada data yang dikirim untuk diperbarui");
        }
        const updated = await konfigurasi_repository_1.KonfigurasiRepository.update(data);
        return (0, konfigurasi_model_1.toKonfigurasiResponse)(updated);
    }
    /** GET effective (global ⊕ override) */
    static async getEffective(username) {
        const exists = await konfigurasi_repository_1.KonfigurasiRepository.userExists(username);
        if (!exists)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "User tidak ditemukan");
        await konfigurasi_repository_1.KonfigurasiRepository.initIfMissing();
        const globalCfg = await konfigurasi_repository_1.KonfigurasiRepository.getGlobal();
        const overrideCfg = await konfigurasi_repository_1.KonfigurasiRepository.getOverrideByUsername(username);
        return (0, konfigurasi_model_1.mergeEffective)(globalCfg, overrideCfg, username);
    }
    /**
     * PUT override (MERGE STRATEGY)
     * - Field yang dikirim di payload akan dipakai.
     * - Field yang TIDAK dikirim akan diisi dari override lama (jika ada).
     * - Jika override belum ada, fallback ke nilai global (agar tidak NULL).
     */
    static async putOverride(username, payload) {
        if (!payload || Object.keys(payload).length === 0) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.BAD_REQUEST, "Minimal satu field harus diisi");
        }
        const exists = await konfigurasi_repository_1.KonfigurasiRepository.userExists(username);
        if (!exists)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "User tidak ditemukan");
        // Ambil sumber untuk merge
        await konfigurasi_repository_1.KonfigurasiRepository.initIfMissing();
        const [globalCfg, currentOv] = await Promise.all([
            konfigurasi_repository_1.KonfigurasiRepository.getGlobal(),
            konfigurasi_repository_1.KonfigurasiRepository.getOverrideByUsername(username),
        ]);
        // Gabungkan supaya tidak ada kolom NULL
        const merged = {
            gajiPerJam: payload.gajiPerJam ??
                currentOv?.gajiPerJam ??
                globalCfg?.gajiPerJam,
            batasJedaMenit: payload.batasJedaMenit ??
                currentOv?.batasJedaMenit ??
                globalCfg?.batasJedaMenit,
            jedaOtomatisAktif: payload.jedaOtomatisAktif ??
                currentOv?.jedaOtomatisAktif ??
                globalCfg?.jedaOtomatisAktif,
        };
        // Simpan hasil merge
        const row = await konfigurasi_repository_1.KonfigurasiRepository.upsertOverride(username, merged);
        // Bentuk response konsisten
        const overrides = {};
        if (row.gajiPerJam != null)
            overrides.gajiPerJam = row.gajiPerJam;
        if (row.batasJedaMenit != null)
            overrides.batasJedaMenit = row.batasJedaMenit;
        if (row.jedaOtomatisAktif != null)
            overrides.jedaOtomatisAktif = row.jedaOtomatisAktif;
        return { username, overrides, updatedAt: row.updatedAt };
    }
    /** DELETE override */
    static async deleteOverride(username) {
        const exists = await konfigurasi_repository_1.KonfigurasiRepository.userExists(username);
        if (!exists)
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.NOT_FOUND, "User tidak ditemukan");
        await konfigurasi_repository_1.KonfigurasiRepository.deleteOverride(username);
        return { message: `Override konfigurasi untuk ${username} telah dihapus` };
    }
}
exports.KonfigurasiService = KonfigurasiService;
