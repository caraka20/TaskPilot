import { prismaClient } from "../../config/database"
import { User } from "../../generated/prisma"
import { RegisterRequest } from "./user.model"

export class UserRepository {
  static async findByUsername(username: string) {
    return prismaClient.user.findUnique({ where: { username } })
  }

  static async create(data: RegisterRequest) {
    return prismaClient.user.create({ data })
  }

  static async findAllUsers() {
    return prismaClient.user.findMany()
  }

  static async login(username: string, token: string) {
    return prismaClient.user.update({
      where: { username },
      data: { token },
    })
  }

  static async logout(user: User) {
    return prismaClient.user.update({
      where: { username: user.username },
      data: { token: null },
    })
  }

  /**
   * DETAIL USER (schema baru)
   * - ikutkan relasi yang kamu perlukan
   */
  static async getUserDetail(username: string) {
    return prismaClient.user.findUnique({
      where: { username },
      include: {
        jamKerja: true,
        riwayatGaji: true,
        tutonItems: {
          select: {
            id: true,
            deskripsi: true,
            jenis: true,
            sesi: true,
            status: true,
            selesaiAt: true,
            course: {
              select: {
                customer: {
                  select: {
                    id: true,
                    namaCustomer: true,
                    nim: true,
                    jurusan: true,
                  },
                },
              },
            },
          },
          take: 50,
        },
      },
    })
  }

  static async getKonfigurasi() {
    return prismaClient.konfigurasi.findFirst();
  }

  /** Ambil override (jika ada) untuk username */
  static async getOverride(username: string) {
    return prismaClient.konfigurasiOverride.findUnique({
      where: { username },
      select: {
        username: true,
        gajiPerJam: true,
        batasJedaMenit: true,
        jedaOtomatisAktif: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Upsert override DENGAN MERGE:
   * - patch: nilai yang dikirim klien (parsial)
   * - sisa field diisi dari override saat ini kalau ada
   * - jika override belum ada, fallback ke konfigurasi global
   */
  static async upsertOverrideMerged(
    username: string,
    patch: Partial<{
      gajiPerJam: number;
      batasJedaMenit: number;
      jedaOtomatisAktif: boolean;
    }>
  ) {
    const [globalCfg, current] = await Promise.all([
      prismaClient.konfigurasi.findFirst(),
      prismaClient.konfigurasiOverride.findUnique({ where: { username } }),
    ]);

    const merged = {
      gajiPerJam:
        patch.gajiPerJam ??
        current?.gajiPerJam ??
        (globalCfg?.gajiPerJam ?? 0),
      batasJedaMenit:
        patch.batasJedaMenit ??
        current?.batasJedaMenit ??
        (globalCfg?.batasJedaMenit ?? 0),
      jedaOtomatisAktif:
        patch.jedaOtomatisAktif ??
        current?.jedaOtomatisAktif ??
        (globalCfg?.jedaOtomatisAktif ?? false),
      updatedAt: new Date(),
    };

    const row = await prismaClient.konfigurasiOverride.upsert({
      where: { username },
      update: merged,
      create: { username, ...merged },
      select: {
        username: true,
        gajiPerJam: true,
        batasJedaMenit: true,
        jedaOtomatisAktif: true,
        updatedAt: true,
      },
    });

    return row;
  }

  /** Khusus set jeda otomatis via UserService → tetap kembalikan bentuk yang FE harapkan */
  static async upsertOverrideJeda(username: string, aktif: boolean) {
    const row = await this.upsertOverrideMerged(username, {
      jedaOtomatisAktif: aktif,
    });
    return { username: row.username, jedaOtomatis: row.jedaOtomatisAktif };
  }

  static async deleteOverride(username: string) {
    await prismaClient.konfigurasiOverride.delete({ where: { username } });
    return { ok: true as const };
  }
}
