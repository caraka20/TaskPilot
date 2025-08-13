import { prismaClient } from "../../config/database"
import { KarilDetail } from "../../generated/prisma"

export type UpsertKarilDetailInput = {
  customerId: number
  judul: string
  tugas1?: boolean
  tugas2?: boolean
  tugas3?: boolean
  tugas4?: boolean
  keterangan?: string | null
}

export class KarilRepository {
  static findCustomerById(id: number) {
    return prismaClient.customer.findUnique({ where: { id } })
  }

  static findByCustomerId(customerId: number) {
    return prismaClient.karilDetail.findUnique({ where: { customerId } })
  }

  static async upsertByCustomerId(input: UpsertKarilDetailInput): Promise<KarilDetail> {
    const { customerId, judul, tugas1, tugas2, tugas3, tugas4, keterangan } = input

    return prismaClient.karilDetail.upsert({
      where: { customerId },
      create: {
        customerId,
        judul,
        // default false di schema; kalau ada di payload, pakai nilainya
        ...(typeof tugas1 === "boolean" ? { tugas1 } : {}),
        ...(typeof tugas2 === "boolean" ? { tugas2 } : {}),
        ...(typeof tugas3 === "boolean" ? { tugas3 } : {}),
        ...(typeof tugas4 === "boolean" ? { tugas4 } : {}),
        keterangan: keterangan ?? null,
      },
      update: {
        judul,
        ...(typeof tugas1 === "boolean" ? { tugas1 } : {}),
        ...(typeof tugas2 === "boolean" ? { tugas2 } : {}),
        ...(typeof tugas3 === "boolean" ? { tugas3 } : {}),
        ...(typeof tugas4 === "boolean" ? { tugas4 } : {}),
        ...(keterangan !== undefined ? { keterangan } : {}),
      },
    })
  }
}
