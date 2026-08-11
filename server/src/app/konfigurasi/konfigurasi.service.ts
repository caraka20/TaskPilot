import { KonfigurasiRepository } from "./konfigurasi.repository"
import {
  EffectiveKonfigurasiDTO,
  UpdateKonfigurasiRequest,
  toKonfigurasiResponse,
  mergeEffective,
  OverrideResponse,
  PutOverrideKonfigurasiRequest,
} from "./konfigurasi.model"
import { ERROR_CODE } from "../../utils/error-codes"
import { AppError } from "../../middleware/app-error"

export class KonfigurasiService {
  static async get() {
    await KonfigurasiRepository.initIfMissing()
    const cfg = await KonfigurasiRepository.getRaw()
    if (!cfg) {
      // practically tidak terjadi karena initIfMissing
      throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Konfigurasi global tidak ditemukan")
    }
    return toKonfigurasiResponse(cfg)
  }

  /** PATCH global */
  static async update(data: UpdateKonfigurasiRequest) {
    if (!data || Object.keys(data).length === 0) {
      throw AppError.fromCode(
        ERROR_CODE.BAD_REQUEST,
        "Tidak ada data yang dikirim untuk diperbarui"
      )
    }
    const updated = await KonfigurasiRepository.update(data)
    return toKonfigurasiResponse(updated)
  }

  /** GET effective (global ⊕ override) */
  static async getEffective(username: string): Promise<EffectiveKonfigurasiDTO> {
    const exists = await KonfigurasiRepository.userExists(username)
    if (!exists) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "User tidak ditemukan")

    await KonfigurasiRepository.initIfMissing()
    const globalCfg = await KonfigurasiRepository.getGlobal()
    const overrideCfg = await KonfigurasiRepository.getOverrideByUsername(username)
    return mergeEffective(globalCfg, overrideCfg, username)
  }

  /**
   * PUT override (MERGE STRATEGY)
   * - Field yang dikirim di payload akan dipakai.
   * - Field yang TIDAK dikirim akan diisi dari override lama (jika ada).
   * - Jika override belum ada, fallback ke nilai global (agar tidak NULL).
   */
  static async putOverride(
    username: string,
    payload: PutOverrideKonfigurasiRequest
  ): Promise<OverrideResponse> {
    if (!payload || Object.keys(payload).length === 0) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Minimal satu field harus diisi")
    }

    const exists = await KonfigurasiRepository.userExists(username)
    if (!exists) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "User tidak ditemukan")

    // Ambil sumber untuk merge
    await KonfigurasiRepository.initIfMissing()
    const [globalCfg, currentOv] = await Promise.all([
      KonfigurasiRepository.getGlobal(),
      KonfigurasiRepository.getOverrideByUsername(username),
    ])

    // Gabungkan supaya tidak ada kolom NULL
    const merged: PutOverrideKonfigurasiRequest = {
      gajiPerJam:
        payload.gajiPerJam ??
        currentOv?.gajiPerJam ??
        globalCfg?.gajiPerJam,
      batasJedaMenit:
        payload.batasJedaMenit ??
        currentOv?.batasJedaMenit ??
        globalCfg?.batasJedaMenit,
      jedaOtomatisAktif:
        payload.jedaOtomatisAktif ??
        currentOv?.jedaOtomatisAktif ??
        globalCfg?.jedaOtomatisAktif,
    }

    // Simpan hasil merge
    const row = await KonfigurasiRepository.upsertOverride(username, merged)

    // Bentuk response konsisten
    const overrides: OverrideResponse["overrides"] = {}
    if (row.gajiPerJam != null) overrides.gajiPerJam = row.gajiPerJam
    if (row.batasJedaMenit != null) overrides.batasJedaMenit = row.batasJedaMenit
    if (row.jedaOtomatisAktif != null) overrides.jedaOtomatisAktif = row.jedaOtomatisAktif

    return { username, overrides, updatedAt: row.updatedAt }
  }

  /** DELETE override */
  static async deleteOverride(username: string) {
    const exists = await KonfigurasiRepository.userExists(username)
    if (!exists) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "User tidak ditemukan")

    await KonfigurasiRepository.deleteOverride(username)
    return { message: `Override konfigurasi untuk ${username} telah dihapus` }
  }
}
