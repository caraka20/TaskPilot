import { prismaClient } from "../../config/database"; 
import { User } from "../../generated/prisma";
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

  static async login(username : string, token : string) {
    return prismaClient.user.update({
      where: { username },
      data : {token}
    })
  }

  static async logout(user : User) {
    return prismaClient.user.update({
      where: { username : user.username },
      data : {token : null}
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