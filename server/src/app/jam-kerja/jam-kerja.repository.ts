// src/api/jam-kerja/jam-kerja.repository.ts
import { prismaClient } from "../../config/database";
import { StatusKerja } from "../../generated/prisma";
import { JamKerjaAktifQuery } from "./jam-kerja.model";

/** Start-of-day sesuai locale server (dipakai untuk kolom `tanggal`) */
function startOfDayLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

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
        isOpen: true, // eksplisit: segmen baru sedang berjalan
      },
    });
  }

  static async findById(id: number) {
    return prismaClient.jamKerja.findUnique({ where: { id } });
  }

  /** Tutup segmen sebagai status tertentu (JEDA/SELESAI) */
  static async closeAs(id: number, jamSelesai: Date, totalJam: number, status: StatusKerja) {
    return prismaClient.jamKerja.update({
      where: { id },
      data: {
        jamSelesai,
        totalJam,
        status,
        isOpen: false, // pastikan tertutup saat sudah punya jamSelesai
      },
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

  /** Update status + sinkronkan isOpen sesuai jamSelesai */
  static async updateStatus(id: number, status: StatusKerja) {
    const row = await prismaClient.jamKerja.findUnique({ where: { id } });
    const open = status === StatusKerja.AKTIF && row?.jamSelesai == null;
    return prismaClient.jamKerja.update({
      where: { id },
      data: { status, isOpen: open },
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

  /** Hitung total jam (desimal) dari dua waktu */
  static calcTotalJam(jamMulai: Date, jamSelesai: Date | null): number {
    if (!jamSelesai) return 0;
    const ms = jamSelesai.getTime() - jamMulai.getTime();
    return Math.max(0, Math.round((ms / 3600000) * 100) / 100);
  }

  /** Patch sebagian kolom (untuk mode single-row pause/resume) */
  static async updatePartial(
    id: number,
    patch: Partial<{
      jamMulai: Date;
      jamSelesai: Date | null;
      status: StatusKerja;
      totalJam: number;
      isOpen: boolean;
      tanggal: Date;
    }>
  ) {
    return prismaClient.jamKerja.update({ where: { id }, data: patch });
  }

  static startOfDayLocal = startOfDayLocal;
}

export default JamKerjaRepository;
