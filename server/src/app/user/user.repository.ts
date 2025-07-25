import { prismaClient } from "../../config/database"; 
import { RegisterRequest } from "./user.model";

export class UserRepository {
  static async findByUsername(username: string) {
    return prismaClient.user.findUnique({
      where: { username }
    })
  }

  static async create(data: RegisterRequest) {
    return prismaClient.user.create({ data })
  }

  static async findAllUsers() {
    return prismaClient.user.findMany()
  }

  // static async update(username: string, data: Partial<{ password: string; namaLengkap: string; role: string }>) {
  //   return prismaClient.user.update({
  //     where: { username },
  //     data
  //   })
  // }

  static async delete(username: string) {
    return prismaClient.user.delete({
      where: { username }
    })
  }

  static async getUserDetail(username: string) {
    return prismaClient.user.findUnique({
      where: { username },
      include: {
        jamKerja: true,
        tugas: {
          include: {
            customer: true
          }
        },
        riwayatGaji: true
      }
    })
  }
}