import { Prisma } from '../../generated/prisma/client'
import { prismaClient } from '../../config/database'
import { CreateGajiRequest } from './gaji.model'

export class GajiRepository {
  static async create(data:CreateGajiRequest ) {
    return prismaClient.salary.create({
      data: {
        username: data.username,
        jumlahBayar: data.jumlahBayar,
        catatan: data.catatan
      }
    })
  }

  static async findAllPaginated(
    where: Prisma.SalaryWhereInput,
    skip: number,
    take: number
  ) {
    return prismaClient.salary.findMany({
      where,
      skip,
      take,
      orderBy: { tanggalBayar: 'desc' },
      include: { user: true },
    })
  }

  static async countAll(where: Prisma.SalaryWhereInput) {
    return prismaClient.salary.count({ where })
  }

    static async findById(id: number) {
        return prismaClient.salary.findUnique({ where: { id } })
    }

    static async deleteById(id: number) {
        return prismaClient.salary.delete({ where: { id } })
    }

    static async updateById(id: number, data: Prisma.SalaryUpdateInput) {
        return prismaClient.salary.update({
            where: { id },
            data,
        })
    }

  static async findMany(
    where: Prisma.SalaryWhereInput,
    opts: { skip: number; take: number; order: 'asc' | 'desc' },
  ) {
    const [items, total] = await Promise.all([
      prismaClient.salary.findMany({
        where,
        orderBy: { tanggalBayar: opts.order },
        skip: opts.skip,
        take: opts.take,
        select: {
          id: true,
          username: true,
          jumlahBayar: true,
          catatan: true,
          tanggalBayar: true,
          user: { select: { namaLengkap: true } },
        },
      }),
      prismaClient.salary.count({ where }),
    ])

    return { items, total }
  }

}
