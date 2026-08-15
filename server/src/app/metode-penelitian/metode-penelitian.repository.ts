import { prismaClient } from "../../config/database"
import type { MetodePenelitianDetail, Prisma } from "../../generated/prisma"
import type { MetodePenelitianListQuery, MetodePenelitianListRow } from "./metode-penelitian.model"

export type UpsertMetodePenelitianInput = {
  customerId: number
  judul: string
  tugas1?: boolean
  tugas2?: boolean
  tugas3?: boolean
  tugas4?: boolean
  keterangan?: string | null
}

export class MetodePenelitianRepository {
  static findCustomerById(id: number) {
    return prismaClient.customer.findUnique({ where: { id } })
  }

  static upsert(input: UpsertMetodePenelitianInput): Promise<MetodePenelitianDetail> {
    const { customerId, judul, keterangan, ...tasks } = input
    const taskData = Object.fromEntries(
      Object.entries(tasks).filter(([, value]) => typeof value === "boolean"),
    )
    return prismaClient.metodePenelitianDetail.upsert({
      where: { customerId },
      create: { customerId, judul, ...taskData, keterangan: keterangan ?? null },
      update: { judul, ...taskData, ...(keterangan !== undefined ? { keterangan } : {}) },
    })
  }

  static detail(customerId: number) {
    return prismaClient.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        namaCustomer: true,
        nim: true,
        jurusan: true,
        jenis: true,
        createdAt: true,
        updatedAt: true,
        metodePenelitian: true,
      },
    }) as Promise<MetodePenelitianListRow | null>
  }

  static async list(query: MetodePenelitianListQuery) {
    const complete = { AND: [{ tugas1: true }, { tugas2: true }, { tugas3: true }, { tugas4: true }] }
    const taskField = query.tugasBelum !== "all" ? `tugas${query.tugasBelum}` : null
    const where: Prisma.CustomerWhereInput = {
      layananMetodePenelitian: true,
      ...(query.q
        ? { OR: [{ namaCustomer: { contains: query.q } }, { nim: { contains: query.q } }] }
        : {}),
      AND: [
        query.progress === "complete"
          ? { metodePenelitian: { is: complete } }
          : query.progress === "incomplete"
            ? { OR: [{ metodePenelitian: { is: null } }, { metodePenelitian: { is: { NOT: complete } } }] }
            : {},
        taskField
          ? { OR: [{ metodePenelitian: { is: null } }, { metodePenelitian: { is: { [taskField]: false } } }] }
          : {},
      ],
    }
    const orderBy: Prisma.CustomerOrderByWithRelationInput =
      query.sortBy === "namaCustomer" || query.sortBy === "nim"
        ? ({ [query.sortBy]: query.sortDir } as Prisma.CustomerOrderByWithRelationInput)
        : ({ metodePenelitian: { [query.sortBy]: query.sortDir } } as Prisma.CustomerOrderByWithRelationInput)
    const [rows, total] = await Promise.all([
      prismaClient.customer.findMany({
        where,
        select: { id: true, namaCustomer: true, nim: true, jurusan: true, jenis: true, createdAt: true, updatedAt: true, metodePenelitian: true },
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }) as Promise<MetodePenelitianListRow[]>,
      prismaClient.customer.count({ where }),
    ])
    return { rows, total }
  }
}
