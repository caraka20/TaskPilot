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
      // practically tidak terjadi karena baris di atas
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

  /** PUT override */
  static async putOverride(
    username: string,
    payload: PutOverrideKonfigurasiRequest
  ): Promise<OverrideResponse> {
    if (!payload || Object.keys(payload).length === 0) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Minimal satu field harus diisi")
    }

    const exists = await KonfigurasiRepository.userExists(username)
    if (!exists) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "User tidak ditemukan")

    const row = await KonfigurasiRepository.upsertOverride(username, payload)

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
