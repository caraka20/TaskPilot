// server/src/app/gaji/gaji.repository.ts
import { Prisma } from '../../generated/prisma'
import { prismaClient } from '../../config/database'
import { CreateGajiRequest } from './gaji.model'

export class GajiRepository {
  /* =========================
   * Non-transactional methods
   * ========================= */

  static async create(data: CreateGajiRequest) {
    return prismaClient.salary.create({
      data: {
        username: data.username,
        jumlahBayar: data.jumlahBayar,
        catatan: data.catatan ?? null,
      },
    })
  }

  static async findAllPaginated(where: Prisma.SalaryWhereInput, skip: number, take: number) {
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
    return prismaClient.salary.update({ where: { id }, data })
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

  /** Sum pembayaran all-time per user (non-tx) */
  static async sumByUsername(username: string): Promise<number> {
    const agg = await prismaClient.salary.aggregate({
      where: { username },
      _sum: { jumlahBayar: true },
    })
    return agg._sum.jumlahBayar ?? 0
  }

  /* =========================
   * Transactional helpers
   * ========================= */

  /** Ambil user dalam TX (untuk cek totalGaji & keberadaan user) */
  static async findUserByUsername(tx: Prisma.TransactionClient, username: string) {
    return tx.user.findUnique({ where: { username } })
  }

  /** Sum pembayaran user dalam TX (semua baris) */
  static async sumPaidByUsernameTx(tx: Prisma.TransactionClient, username: string) {
    const agg = await tx.salary.aggregate({
      where: { username },
      _sum: { jumlahBayar: true },
    })
    return agg._sum.jumlahBayar ?? 0
  }

  /** Sum pembayaran user dalam TX, TIDAK menghitung baris `excludeId` */
  static async sumPaidByUsernameExcludingId(
    tx: Prisma.TransactionClient,
    username: string,
    excludeId: number,
  ) {
    const agg = await tx.salary.aggregate({
      where: { username, NOT: { id: excludeId } },
      _sum: { jumlahBayar: true },
    })
    return agg._sum.jumlahBayar ?? 0
  }

  /** Insert salary dalam TX */
  static async createTx(
    tx: Prisma.TransactionClient,
    payload: { username: string; jumlahBayar: number; catatan?: string | null },
  ) {
    return tx.salary.create({
      data: {
        username: payload.username,
        jumlahBayar: payload.jumlahBayar,
        catatan: payload.catatan ?? null,
      },
    })
  }

  /** Ambil salary by id dalam TX */
  static async findByIdTx(tx: Prisma.TransactionClient, id: number) {
    return tx.salary.findUnique({ where: { id } })
  }

  /** Update salary dalam TX */
  static async updateTx(tx: Prisma.TransactionClient, id: number, data: Prisma.SalaryUpdateInput) {
    return tx.salary.update({ where: { id }, data })
  }
}
