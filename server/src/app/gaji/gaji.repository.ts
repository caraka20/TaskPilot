import { prismaClient } from '../../config/database'
import { CreateGajiRequest } from './gaji.model'

export class GajiRepository {
  static async create(data:CreateGajiRequest ) {
    return prismaClient.gaji.create({
      data: {
        username: data.username,
        jumlahBayar: data.jumlahBayar,
        catatan: data.catatan
      }
    })
  }

  // ✅ Ambil semua data gaji (semua user)
  static async findAll() {
    return prismaClient.gaji.findMany({
      orderBy: {
        tanggalBayar: 'desc'
      }
    })
  }
}
