import { prismaClient } from "../../config/database"
import { StatusKerja } from "../../generated/prisma"

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
}
function endOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
}
function startOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

export class DashboardRepository {
  static async countAktif() {
    return prismaClient.jamKerja.count({
      where: { status: StatusKerja.AKTIF, jamSelesai: null },
    })
  }

  static async countJeda() {
    return prismaClient.jamKerja.count({
      where: { status: StatusKerja.JEDA, jamSelesai: null },
    })
  }

  static async sumTotalJamHariIni() {
    const s = startOfToday()
    const e = endOfToday()
    const agg = await prismaClient.jamKerja.aggregate({
      where: { jamMulai: { gte: s, lte: e }, status: StatusKerja.SELESAI },
      _sum: { totalJam: true },
    })
    return agg._sum.totalJam ?? 0
  }

  static async sumPayrollBulanBerjalan() {
    const s = startOfMonth()
    const agg = await prismaClient.salary.aggregate({
      where: { tanggalBayar: { gte: s } },
      _sum: { jumlahBayar: true },
    })
    return agg._sum.jumlahBayar ?? 0
  }
}
