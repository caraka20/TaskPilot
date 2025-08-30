import { prismaClient } from "../../config/database"
import { Customer, Prisma } from "../../generated/prisma"
import { CustomerDetailRow, CustomerListQuery, CustomerListRow, hitungSisaBayar } from "./customer.model"

export class CustomerRepository {
  /** Cek eksistensi by NIM (untuk validasi unik di service) */
  static async findByNim(nim: string) {
    return prismaClient.customer.findUnique({ where: { nim } })
  }

  /** Create customer (ASSUME password sudah di-hash di service) */
  static async create(data: {
    namaCustomer: string
    noWa: string
    nim: string
    password: string
    jurusan: string
    jenis: Customer["jenis"]
    totalBayar?: number
    sudahBayar?: number
  }) {
    const total = data.totalBayar ?? 0
    const sudah = data.sudahBayar ?? 0
    const sisa = hitungSisaBayar(total, sudah)

    return prismaClient.customer.create({
      data: {
        namaCustomer: data.namaCustomer,
        noWa: data.noWa,
        nim: data.nim,
        password: data.password, // sudah di-hash di service
        jurusan: data.jurusan,
        jenis: data.jenis,
        totalBayar: total,
        sudahBayar: sudah,
        sisaBayar: sisa,
      },
    })
  }

  /** Detail customer (dengan ringkasan relasi) */
static async findDetailById(id: number) {
  return prismaClient.customer.findUnique({
    where: { id },
    select: {
      id: true,
      namaCustomer: true,
      noWa: true,
      nim: true,
      jurusan: true,
      jenis: true,
      password: true,                // ⬅️ tambahkan
      totalBayar: true,
      sudahBayar: true,
      sisaBayar: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { tutonCourses: true } },
      karil: { select: { id: true } },
    },
  }) as Promise<CustomerDetailRow | null>
}


  /** Ambil customer polos */
  static async findById(id: number) {
    return prismaClient.customer.findUnique({ where: { id } })
  }

  // ===========================
  // PEMBAYARAN CUSTOMER
  // ===========================

  /**
   * Insert transaksi pembayaran + recompute sudahBayar & sisaBayar
   * Kompatibel dgn data lama: gunakan "baseline" = current.sudahBayar - sum(transaksi_sebelum)
   * Sehingga setelah insert: sudahBaru = baseline + (sumSebelum + amountBaru) = current.sudahBayar + amountBaru
   */
  static async addPayment(params: {
    customerId: number
    amount: number
    catatan?: string
    tanggalBayar?: Date
  }) {
    const { customerId, amount, catatan, tanggalBayar } = params
    return prismaClient.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: customerId } })
      if (!customer) return null

      // SUM transaksi SEBELUM insert
      const aggBefore = await tx.customerPayment.aggregate({
        where: { customerId },
        _sum: { amount: true },
      })
      const sumBefore = aggBefore._sum.amount ?? 0

      // baseline (kompatibilitas dengan kolom sudahBayar yang sudah ada)
      const baseline = (customer.sudahBayar ?? 0) - sumBefore

      // insert transaksi baru
      await tx.customerPayment.create({
        data: {
          customerId,
          amount,
          catatan,
          tanggalBayar: tanggalBayar ?? new Date(),
        },
      })

      // sum sesudah insert
      const sumAfter = sumBefore + amount

      // sudahBaru = baseline + sumAfter  == current.sudahBayar + amount
      const sudahBaru = baseline + sumAfter
      const sisaBaru = Math.max((customer.totalBayar ?? 0) - sudahBaru, 0)

      const updated = await tx.customer.update({
        where: { id: customerId },
        data: {
          sudahBayar: sudahBaru,
          sisaBayar: sisaBaru,
        },
        select: {
          id: true, namaCustomer: true, nim: true,
          totalBayar: true, sudahBayar: true, sisaBayar: true,
          updatedAt: true,
        },
      })

      return updated
    })
  }

  /**
   * Update total tagihan (invoice) + recompute sisaBayar berdasarkan nilai "sudah" yang konsisten
   * (baseline + sumSaatIni). TIDAK menimpa nilai kolom sudahBayar.
   */
  static async updateInvoiceTotal(id: number, totalBayar: number) {
    return prismaClient.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id } })
      if (!customer) return null

      // SUM transaksi saat ini
      const agg = await tx.customerPayment.aggregate({
        where: { customerId: id },
        _sum: { amount: true },
      })
      const sumNow = agg._sum.amount ?? 0

      // baseline konsisten
      const baseline = (customer.sudahBayar ?? 0) - sumNow
      const sudah = baseline + sumNow // == customer.sudahBayar

      if (totalBayar < sudah) {
        // tidak boleh lebih kecil dari jumlah yang sudah dibayar (konsisten)
        throw new Error('TOTAL_LESS_THAN_PAID')
      }

      const sisa = totalBayar - sudah

      return tx.customer.update({
        where: { id },
        data: { totalBayar, sisaBayar: sisa }, // TIDAK mengubah sudahBayar
        select: {
          id: true, namaCustomer: true, nim: true,
          totalBayar: true, sudahBayar: true, sisaBayar: true,
          updatedAt: true,
        },
      })
    })
  }

  // List histori pembayaran per customer
  static async listPayments(customerId: number, query: {
    page: number
    limit: number
    sortDir: 'asc' | 'desc'
    start?: Date
    end?: Date
  }) {
    const { page, limit, sortDir, start, end } = query
    const where: any = { customerId }
    if (start || end) {
      where.tanggalBayar = {}
      if (start) where.tanggalBayar.gte = start
      if (end) where.tanggalBayar.lte = end
    }

    const [items, total] = await Promise.all([
      prismaClient.customerPayment.findMany({
        where,
        orderBy: { tanggalBayar: sortDir },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          amount: true,
          tanggalBayar: true,
          catatan: true,
          createdAt: true,
        },
      }),
      prismaClient.customerPayment.count({ where }),
    ])

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  // ===========================
  // LAIN-LAIN (dibiarkan sama; hanya ditambah hapus payments saat remove)
  // ===========================

  static async remove(id: number) {
    return prismaClient.$transaction(async (tx) => {
      // Hapus histori pembayaran lebih dulu (tambahan terkait fitur payments)
      await tx.customerPayment.deleteMany({ where: { customerId: id } })

      // Hapus KarilDetail jika ada
      await tx.karilDetail.deleteMany({ where: { customerId: id } })
      // Hapus semua matkul (TutonCourse) -> akan cascade ke TutonItem
      await tx.tutonCourse.deleteMany({ where: { customerId: id } })
      // Terakhir hapus customer
      await tx.customer.delete({ where: { id } })
      return true
    })
  }

  static async getByIdBasic(id: number) {
    return prismaClient.customer.findUnique({
      where: { id },
      select: { id: true, namaCustomer: true },
    })
  }

  // semua course milik customer
  static async listTutonCoursesByCustomer(customerId: number) {
    return prismaClient.tutonCourse.findMany({
      where: { customerId },
      select: {
        id: true,
        matkul: true,
        totalItems: true,
        completedItems: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ createdAt: "asc" }],
    })
  }

  // ambil semua item untuk daftar course
  static async listItemsForCourses(courseIds: number[]) {
    if (courseIds.length === 0) return []
    return prismaClient.tutonItem.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        courseId: true,
        jenis: true,
        status: true,
        nilai: true,
      },
    })
  }

  static buildWhereForList(
    q?: string,
    jenis?: Customer["jenis"] | Customer["jenis"][]
  ): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = {};

    if (q) {
      where.OR = [
        { nim: { contains: q } },          // tanpa mode: 'insensitive'
        { namaCustomer: { contains: q } }, // collation MySQL umumnya CI
      ];
    }

    if (jenis) {
      where.jenis = Array.isArray(jenis) ? { in: jenis } : jenis;
    }

    return where;
  }

  /** ⬅️ UPDATE: teruskan jenis ke buildWhereForList */
  static async list(query: CustomerListQuery) {
    const where = this.buildWhereForList(query.q, query.jenis);

    const [rows, total] = await Promise.all([
      prismaClient.customer.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortDir },
        select: {
          id: true,
          namaCustomer: true,
          noWa: true,
          nim: true,
          jurusan: true,
          jenis: true,
          totalBayar: true,
          sudahBayar: true,
          sisaBayar: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { tutonCourses: true } },
        },
      }) as Promise<CustomerListRow[]>,
      prismaClient.customer.count({ where }),
    ]);

    return { rows, total };
  }
}
