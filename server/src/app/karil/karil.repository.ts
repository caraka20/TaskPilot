// src/app/karil/karil.repository.ts
import { prismaClient } from "../../config/database"
import { KarilDetail, Prisma, JenisUT } from "../../generated/prisma"
import type { KarilListQuery, KarilListRow } from "./karil.model"

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
    return prismaClient.customer.findUnique({
      where: { id },
      include: { karil: true },
    })
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

  /** Detail lengkap satu customer (include relasi customer) */
  static async detailByCustomerId(customerId: number) {
    return prismaClient.karilDetail.findUnique({
      where: { customerId },
      include: {
        customer: { select: { id: true, namaCustomer: true, nim: true, jurusan: true, jenis: true } },
      },
    }) as Promise<KarilListRow | null>
  }

  /** List semua KARIL + filter/search/sort/paging */
  static async listAll(query: KarilListQuery) {
    const q = (query.q ?? "").trim();

    // progress filter
    const progressFilter: Prisma.KarilDetailWhereInput =
      query.progress === "complete"
        ? { AND: [{ tugas1: true }, { tugas2: true }, { tugas3: true }, { tugas4: true }] }
        : query.progress === "incomplete"
        ? { NOT: { AND: [{ tugas1: true }, { tugas2: true }, { tugas3: true }, { tugas4: true }] } }
        : {};

    // filter by related customer (KARIL + TK) + optional search
    const customerWhere: Prisma.CustomerWhereInput = {
      jenis: { in: [JenisUT.KARIL, JenisUT.TK] },
      ...(q
        ? {
            OR: [
              { namaCustomer: { contains: q } }, // hapus mode
              { nim: { contains: q } },
            ],
          }
        : {}),
    };

    // gabungkan ke where utama
    const where: Prisma.KarilDetailWhereInput = {
      customer: { is: customerWhere },
      ...progressFilter,
    };

    // orderBy: kalau sortBy field milik customer, taruh di bawah customer
    const orderBy: Prisma.KarilDetailOrderByWithRelationInput =
      query.sortBy === "namaCustomer" || query.sortBy === "nim"
        ? { customer: { [query.sortBy]: query.sortDir } as any }
        : ({ [query.sortBy]: query.sortDir } as any);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 10), 100);

    const [rows, total] = await Promise.all([
      prismaClient.karilDetail.findMany({
        where,
        include: {
          customer: {
            select: { id: true, namaCustomer: true, nim: true, jurusan: true, jenis: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }) as Promise<KarilListRow[]>,
      prismaClient.karilDetail.count({ where }),
    ]);

    return { rows, total };
  }


}
