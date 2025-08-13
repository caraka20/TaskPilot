import { prismaClient } from "../../config/database" 
import { StatusKerja } from "../../generated/prisma"
import { JamKerjaAktifQuery } from "./jam-kerja.model"

export class JamKerjaRepository {
  static async findAktifByUsername(username: string) {
    return prismaClient.jamKerja.findMany({
      where: { username, status: 'AKTIF' },
      orderBy: { jamMulai: 'desc' },
    })
  }

  static async createStart(username: string, jamMulai: Date) {
    return prismaClient.jamKerja.create({
      data: { username, jamMulai, status: 'AKTIF' }
    })
  }

  static async findById(id: number) {
    return prismaClient.jamKerja.findUnique({ where: { id } })
  }

  static async endJamKerja(id: number, jamSelesai: Date, totalJam: number) {
    return prismaClient.jamKerja.update({
      where: { id },
      data: { jamSelesai, totalJam, status: 'SELESAI' },
    })
  }

  static async findByUsername(username: string) {
    return prismaClient.jamKerja.findMany({
      where: { username },
      orderBy: { jamMulai: 'desc' },
    })
  }

  static async rekap(username: string, start: Date, end: Date) {
    return prismaClient.jamKerja.aggregate({
      where: {
        username,
        jamMulai: { gte: start, lte: end },
        status: 'SELESAI'
      },
      _sum: { totalJam: true }
    })
  }

  static async findAktif(query: JamKerjaAktifQuery) {
    return prismaClient.jamKerja.findMany({
      where: { username: query.username, status: 'AKTIF' },
      orderBy: { jamMulai: 'desc' },
    })
  }

  // NEW: untuk OWNER melihat semua jam kerja aktif
  static async findAktifAll() {
    return prismaClient.jamKerja.findMany({
      where: { status: 'AKTIF' },
      orderBy: { jamMulai: 'desc' },
    })
  }

  static async rekapAktif(username: string, start: Date, end: Date) {
    return prismaClient.jamKerja.aggregate({
      where: {
        username,
        jamMulai: { gte: start, lte: end },
        status: { in: [StatusKerja.AKTIF, StatusKerja.JEDA] },
      },
      _sum: { totalJam: true },
    })
  }

  static async updateStatus(id: number, status: StatusKerja) {
    return prismaClient.jamKerja.update({
      where: { id },
      data: { status },
    })
  }
}
