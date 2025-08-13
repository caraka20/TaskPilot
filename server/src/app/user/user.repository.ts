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
   * - tutonItems lengkap agar cocok dengan toUserDetailResponse
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
    return prismaClient.konfigurasi.findFirst()
  }

  static async updateJedaOtomatis(username: string, aktif: boolean) {
    return prismaClient.user.update({
      where: { username },
      data: { jedaOtomatis: aktif },
    })
  }

  static async tambahJamKerjaDanGaji(username: string, totalJam: number, gajiPerJam: number) {
    const totalGaji = parseFloat((totalJam * gajiPerJam).toFixed(2))
    return prismaClient.user.update({
      where: { username },
      data: {
        totalJamKerja: { increment: totalJam },
        totalGaji: { increment: totalGaji },
      },
    })
  }
}
