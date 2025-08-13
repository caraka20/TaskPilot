import { prismaClient } from "../../config/database"
import { Prisma } from "../../generated/prisma"
import {
  KonfigurasiGlobalDTO,
  KonfigurasiOverrideDTO,
  PutOverrideKonfigurasiRequest,
} from "./konfigurasi.model"

const GLOBAL_ID = 1

type UpdateGlobal = Partial<{
  gajiPerJam: number
  batasJedaMenit: number
  jedaOtomatisAktif: boolean
}>

export class KonfigurasiRepository {
  /** Ambil raw row (boleh null). */
  static async getRaw() {
    return prismaClient.konfigurasi.findUnique({ where: { id: GLOBAL_ID } })
  }

  /** Ambil sebagai DTO; lempar 404 kalau tidak ada. */
  static async getGlobal(): Promise<KonfigurasiGlobalDTO> {
    const row = await prismaClient.konfigurasi.findUnique({ where: { id: GLOBAL_ID } })
    if (!row) {
      throw new Error("Konfigurasi global tidak ditemukan")
    }
    return {
      id: row.id,
      gajiPerJam: row.gajiPerJam,
      batasJedaMenit: row.batasJedaMenit,
      jedaOtomatisAktif: row.jedaOtomatisAktif,
      updatedAt: row.updatedAt,
    }
  }

  /** Upsert global config (buat jika belum ada). */
  static async upsertGlobal(data: UpdateGlobal) {
    return prismaClient.konfigurasi.upsert({
      where: { id: GLOBAL_ID },
      update: { ...data },
      create: {
        id: GLOBAL_ID,
        gajiPerJam: data.gajiPerJam ?? 0,
        batasJedaMenit: data.batasJedaMenit ?? 15,
        jedaOtomatisAktif: data.jedaOtomatisAktif ?? false,
      },
    })
  }

  /** Update; bila belum ada maka dibuat (hindari P2025). */
  static async update(data: UpdateGlobal) {
    try {
      return await prismaClient.konfigurasi.update({
        where: { id: GLOBAL_ID },
        data,
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        return this.upsertGlobal(data)
      }
      throw e
    }
  }

  /** Pastikan ada; kalau tidak, buat dengan default (boleh override default via argumen). */
  static async initIfMissing(defaults: UpdateGlobal = {}) {
    return prismaClient.konfigurasi.upsert({
      where: { id: GLOBAL_ID },
      update: {},
      create: {
        id: GLOBAL_ID,
        gajiPerJam: defaults.gajiPerJam ?? 0,
        batasJedaMenit: defaults.batasJedaMenit ?? 15,
        jedaOtomatisAktif: defaults.jedaOtomatisAktif ?? false,
      },
    })
  }

  /** Override per user */
  static async getOverrideByUsername(username: string): Promise<KonfigurasiOverrideDTO> {
    const ov = await prismaClient.konfigurasiOverride.findUnique({ where: { username } })
    if (!ov) return null
    return {
      username: ov.username,
      gajiPerJam: ov.gajiPerJam,
      batasJedaMenit: ov.batasJedaMenit,
      jedaOtomatisAktif: ov.jedaOtomatisAktif,
      updatedAt: ov.updatedAt,
    }
  }

  static async upsertOverride(username: string, data: PutOverrideKonfigurasiRequest) {
    return prismaClient.konfigurasiOverride.upsert({
      where: { username },
      update: data,
      create: { username, ...data },
    })
  }

  static async deleteOverride(username: string) {
    await prismaClient.konfigurasiOverride.deleteMany({ where: { username } })
  }

  /** Cek user ada/tidak */
  static async userExists(username: string): Promise<boolean> {
    const u = await prismaClient.user.findUnique({
      where: { username },
      select: { username: true },
    })
    return !!u
  }
}
