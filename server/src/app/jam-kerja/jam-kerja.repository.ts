import { prismaClient } from "../../config/database";
import { StatusKerja } from "../../generated/prisma";
import { JamKerjaAktifQuery } from "./jam-kerja.model";

export class JamKerjaRepository {
  /** Segmen terbuka: AKTIF atau JEDA yang belum ditutup (jamSelesai = null) */
  static async findOpenByUsername(username: string) {
    return prismaClient.jamKerja.findMany({
      where: {
        username,
        OR: [
          { status: StatusKerja.AKTIF, jamSelesai: null },
          { status: StatusKerja.JEDA,  jamSelesai: null },
        ],
      },
      orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
    });
  }

  /** Buat segmen baru AKTIF; isi kolom wajib */
  static async createStart(username: string, jamMulai: Date) {
    const tanggal = new Date(
      jamMulai.getFullYear(),
      jamMulai.getMonth(),
      jamMulai.getDate(), 0, 0, 0, 0
    );
    return prismaClient.jamKerja.create({
      data: {
        username,
        tanggal,
        jamMulai,
        jamSelesai: null,
        totalJam: 0,
        status: StatusKerja.AKTIF,
      },
    });
  }

  static async findById(id: number) {
    return prismaClient.jamKerja.findUnique({ where: { id } });
  }

  static async closeAs(id: number, jamSelesai: Date, totalJam: number, status: StatusKerja) {
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
      orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
      take: 200,
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
      where: {
        username: query.username,
        status: { in: [StatusKerja.AKTIF, StatusKerja.JEDA] },
      },
      orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
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
    return Number(agg._sum.totalJam ?? 0);
  }

  static async findLatestByUsername(username: string) {
    return prismaClient.jamKerja.findFirst({
      where: { username },
      orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
    });
  }

  static async findCurrentAll() {
    return prismaClient.jamKerja.findMany({
      where: { jamSelesai: null },
      select: { username: true, status: true, jamSelesai: true, jamMulai: true, id: true },
      orderBy: [{ jamMulai: "desc" }, { id: "desc" }],
    });
  }

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

export default JamKerjaRepository;
