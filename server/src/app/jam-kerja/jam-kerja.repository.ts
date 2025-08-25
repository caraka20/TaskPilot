import { prismaClient } from "../../config/database";
import { StatusKerja } from "../../generated/prisma";
import { JamKerjaAktifQuery } from "./jam-kerja.model";

export class JamKerjaRepository {
  // segmen yang benar-benar AKTIF (jamSelesai null)
  static async findOpenByUsername(username: string) {
    return prismaClient.jamKerja.findMany({
      where: { username, status: StatusKerja.AKTIF, jamSelesai: null },
      orderBy: { jamMulai: "desc" },
    });
  }

  static async createStart(username: string, jamMulai: Date) {
    return prismaClient.jamKerja.create({
      data: { username, jamMulai, status: StatusKerja.AKTIF },
    });
  }

  static async findById(id: number) {
    return prismaClient.jamKerja.findUnique({ where: { id } });
  }

  static async closeAs(
    id: number,
    jamSelesai: Date,
    totalJam: number,
    status: StatusKerja // JEDA atau SELESAI
  ) {
    return prismaClient.jamKerja.update({
      where: { id },
      data: { jamSelesai, totalJam, status },
    });
  }

  static async endJamKerja(id: number, jamSelesai: Date, totalJam: number) {
    return this.closeAs(id, jamSelesai, totalJam, StatusKerja.SELESAI);
  }

  static async findByUsername(username: string) {
    return prismaClient.jamKerja.findMany({
      where: { username },
      orderBy: { jamMulai: "desc" },
    });
  }

  static async rekap(username: string, start: Date, end: Date) {
    return prismaClient.jamKerja.aggregate({
      where: {
        username,
        jamMulai: { gte: start, lte: end },
        status: StatusKerja.SELESAI,
      },
      _sum: { totalJam: true },
    });
  }

  static async findAktif(query: JamKerjaAktifQuery) {
    return prismaClient.jamKerja.findMany({
      where: { username: query.username, status: { in: [StatusKerja.AKTIF, StatusKerja.JEDA] } },
      orderBy: { jamMulai: "desc" },
    });
  }

  static async updateStatus(id: number, status: StatusKerja) {
    return prismaClient.jamKerja.update({
      where: { id },
      data: { status },
    });
  }

  static async sumTotalJamAll(username: string): Promise<number> {
    const agg = await prismaClient.jamKerja.aggregate({
      where: { username, status: StatusKerja.SELESAI },
      _sum: { totalJam: true },
    });
    return agg._sum.totalJam ?? 0;
  }

  // tambahan utilitas
  static async findLatestByUsername(username: string) {
    return prismaClient.jamKerja.findFirst({
      where: { username },
      orderBy: { jamMulai: "desc" },
    });
  }

  static async findCurrentAll() {
    return prismaClient.jamKerja.findMany({
      where: { status: { in: [StatusKerja.AKTIF, StatusKerja.JEDA] } },
      orderBy: { jamMulai: "desc" },
    });
  }

// Sum totalJam untuk status AKTIF/JEDA dalam rentang waktu
static async rekapAktif(username: string, start: Date, end: Date) {
  return prismaClient.jamKerja.aggregate({
    where: {
      username,
      jamMulai: { gte: start, lte: end },
      status: { in: [StatusKerja.AKTIF, StatusKerja.JEDA] },
    },
    _sum: { totalJam: true },
  });
}


}
