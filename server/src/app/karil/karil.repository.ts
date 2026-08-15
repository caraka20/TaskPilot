// src/app/karil/karil.repository.ts
import { prismaClient } from "../../config/database"
import { KarilDetail, Prisma } from "../../generated/prisma"
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
        karil: true,
      },
    }) as Promise<KarilListRow | null>
  }

  /**
   * List berbasis Customer, bukan KarilDetail. Dengan demikian customer yang
   * layanan Karya Ilmiahnya aktif tetap terlihat walau detail belum dibuat.
   */
  static async listAll(query: KarilListQuery) {
    const q = (query.q ?? "").trim();
    const complete = { AND: [{ tugas1: true }, { tugas2: true }, { tugas3: true }, { tugas4: true }] };
    const taskField = query.tugasBelum && query.tugasBelum !== "all"
      ? `tugas${query.tugasBelum}`
      : null;
    const where: Prisma.CustomerWhereInput = {
      layananKaril: true,
      ...(q
        ? {
            OR: [
              { namaCustomer: { contains: q } },
              { nim: { contains: q } },
            ],
          }
        : {}),
      AND: [
        query.progress === "complete"
          ? { karil: { is: complete } }
          : query.progress === "incomplete"
            ? { OR: [{ karil: { is: null } }, { karil: { is: { NOT: complete } } }] }
            : {},
        taskField
          ? { OR: [{ karil: { is: null } }, { karil: { is: { [taskField]: false } } }] }
          : {},
      ],
    };
    const orderBy: Prisma.CustomerOrderByWithRelationInput =
      query.sortBy === "namaCustomer" || query.sortBy === "nim"
        ? ({ [query.sortBy]: query.sortDir } as Prisma.CustomerOrderByWithRelationInput)
        : ({ karil: { [query.sortBy]: query.sortDir } } as Prisma.CustomerOrderByWithRelationInput);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 10), 100);

    const [rows, total] = await Promise.all([
      prismaClient.customer.findMany({
        where,
        select: { id: true, namaCustomer: true, nim: true, jurusan: true, jenis: true, createdAt: true, updatedAt: true, karil: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }) as Promise<KarilListRow[]>,
      prismaClient.customer.count({ where }),
    ]);

    return { rows, total };
  }


}
