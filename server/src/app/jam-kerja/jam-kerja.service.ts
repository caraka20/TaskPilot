// src/app/jam-kerja/jam-kerja.service.ts
import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { UserRepository } from "../user/user.repository"
import {
  JamKerjaAktifQuery,
  JamKerjaAktifResponse,
  JamKerjaResponse,
  RekapJamKerjaResponse,
  StartJamKerjaRequest,
  toJamKerjaAktifResponse,
  toRekapJamKerjaResponse,
} from "./jam-kerja.model"
import { JamKerjaRepository } from "./jam-kerja.repository"
import { io } from "../../server"
import { Role, StatusKerja } from "../../generated/prisma"

export class JamKerjaService {
  static async startJamKerja(payload: StartJamKerjaRequest) {
    const aktif = await JamKerjaRepository.findAktifByUsername(payload.username)
    if (aktif.length > 0) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST)

    const now = new Date()
    const jamKerja = await JamKerjaRepository.createStart(payload.username, now)

    // Realtime event
    io.emit("jamKerja:started", {
      id: jamKerja.id,
      username: jamKerja.username,
      jamMulai: jamKerja.jamMulai,
      status: jamKerja.status,
    })

    return jamKerja
  }

  static async endJamKerja(id: number) {
    const jamKerja = await JamKerjaRepository.findById(id)
    if (!jamKerja) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)
    if (jamKerja.status !== "AKTIF") throw AppError.fromCode(ERROR_CODE.BAD_REQUEST)

    const jamSelesai = new Date()
    const selisihMs = jamSelesai.getTime() - new Date(jamKerja.jamMulai).getTime()
    const totalJam = Math.round((selisihMs / 1000 / 60 / 60) * 100) / 100

    const konfigurasi = await UserRepository.getKonfigurasi()
    const gajiPerJam = konfigurasi?.gajiPerJam ?? 0

    // Update jam kerja
    await JamKerjaRepository.endJamKerja(id, jamSelesai, totalJam)

    // Tambahkan ke user
    await UserRepository.tambahJamKerjaDanGaji(jamKerja.username, totalJam, gajiPerJam)

    // Realtime event
    io.emit("jamKerja:ended", {
      id: jamKerja.id,
      username: jamKerja.username,
      jamSelesai,
      totalJam,
      status: "SELESAI",
    })

    return { totalJam, jamSelesai }
  }

  static async getHistory(username: string): Promise<JamKerjaResponse[]> {
    const list = await JamKerjaRepository.findByUsername(username)
    return list.map((j) => ({
      id: j.id,
      username: j.username,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
      totalJam: j.totalJam,
      status: j.status,
      tanggal: j.tanggal,
    }))
  }

  static async rekap(username: string, period: "minggu" | "bulan"): Promise<RekapJamKerjaResponse> {
    const now = new Date()
    let start: Date

    if (period === "minggu") {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      start = new Date(now.setDate(diff))
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const result = await JamKerjaRepository.rekap(username, start, new Date())
    const totalJam = result._sum.totalJam || 0

    return toRekapJamKerjaResponse(username, totalJam, period)
  }

  /**
   * BARU: dipakai untuk route GET /api/jam-kerja/aktif
   * OWNER → lihat semua (atau filter username kalau dikirim)
   * USER  → abaikan query.username, hanya username miliknya
   */
  static async getActive(
    current: { username: string; role: Role },
    query: { username: string; period: 'minggu' | 'bulan' }
  ): Promise<RekapJamKerjaResponse> {
    // Guard role USER tidak boleh akses user lain
    if (current.role === Role.USER && query.username !== current.username) {
      throw AppError.fromCode(ERROR_CODE.FORBIDDEN, 'USER hanya boleh akses datanya sendiri')
    }

    // Hitung awal periode
    const now = new Date()
    let start: Date
    if (query.period === 'minggu') {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      start = new Date(now.getFullYear(), now.getMonth(), diff) // awal hari lokal
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Agregasi totalJam untuk status aktif (AKTIF/JEDA)
    const agg = await JamKerjaRepository.rekapAktif(query.username, start, now)
    const totalJam = agg._sum.totalJam || 0

    return toRekapJamKerjaResponse(query.username, totalJam, query.period)
  }

  /**
   * LEGACY: tetap dipertahankan bila masih dipakai di tempat lain.
   * Mengembalikan bentuk JamKerjaResponse[] (bukan JamKerjaAktifResponse[]).
   */
  static async getAktif(query: JamKerjaAktifQuery): Promise<JamKerjaResponse[]> {
    const list = await JamKerjaRepository.findAktif(query)
    return list.map((j) => ({
      id: j.id,
      username: j.username,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
      totalJam: j.totalJam,
      status: j.status,
      tanggal: j.tanggal,
    }))
  }

  static async pause(current: { username: string; role: Role }, id: number) {
    const row = await JamKerjaRepository.findById(id)
    if (!row) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)
    if (row.username !== current.username) throw AppError.fromCode(ERROR_CODE.FORBIDDEN)
    if (row.status !== 'AKTIF' || row.jamSelesai) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, 'Sesi tidak bisa dijeda')

    const updated = await JamKerjaRepository.updateStatus(id, StatusKerja.JEDA)

    io.emit('jamKerja:paused', {
      id: updated.id,
      username: updated.username,
      status: updated.status,
      jamMulai: updated.jamMulai,
    })

    return updated
  }

  static async resume(current: { username: string; role: Role }, id: number) {
    const row = await JamKerjaRepository.findById(id)
    if (!row) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)
    if (row.username !== current.username) throw AppError.fromCode(ERROR_CODE.FORBIDDEN)
    if (row.status !== 'JEDA' || row.jamSelesai) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, 'Sesi tidak bisa diresume')

    const updated = await JamKerjaRepository.updateStatus(id, StatusKerja.AKTIF)

    io.emit('jamKerja:resumed', {
      id: updated.id,
      username: updated.username,
      status: updated.status,
      jamMulai: updated.jamMulai,
    })

    return updated
  }

}

export default JamKerjaService
