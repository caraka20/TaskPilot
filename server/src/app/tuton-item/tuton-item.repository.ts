import { prismaClient } from "../../config/database"
import { JenisTugas, Prisma, StatusTugas } from "../../generated/prisma"

export type ScanRow = {
  id: number
  courseId: number
  jenis: JenisTugas
  sesi: number
  status: StatusTugas
  course: {
    id: number
    matkul: string
    customer: { id: number; namaCustomer: string }
  }
}

export class TutonItemRepository {
  
  static getCourseById(courseId: number) {
    return prismaClient.tutonCourse.findUnique({ where: { id: courseId } })
  }

  static listByCourse(courseId: number) {
    return prismaClient.tutonItem.findMany({
      where: { courseId },
      orderBy: [{ jenis: "asc" }, { sesi: "asc" }],
    })
  }

  static getItemById(itemId: number) {
    return prismaClient.tutonItem.findUnique({ where: { id: itemId } })
  }

  static updateItem(itemId: number, data: Prisma.TutonItemUpdateInput) {
    return prismaClient.tutonItem.update({ where: { id: itemId }, data })
  }

  static countCompletedInCourse(courseId: number) {
    return prismaClient.tutonItem.count({ where: { courseId, status: StatusTugas.SELESAI } })
  }

  static updateCourseCompleted(courseId: number, completedItems: number) {
    return prismaClient.tutonCourse.update({ where: { id: courseId }, data: { completedItems } })
  }

  static async recalcCourseCompleted(courseId: number) {
    const done = await this.countCompletedInCourse(courseId)
    await this.updateCourseCompleted(courseId, done)
    return done
  }

  static async countByCourse(courseId: number) {
    return prismaClient.tutonItem.count({ where: { courseId } })
  }

  static async deleteByCourse(courseId: number) {
    await prismaClient.tutonItem.deleteMany({ where: { courseId } })
  }

  static buildDefaultItems(courseId: number) {
    const items: Prisma.TutonItemCreateManyInput[] = []
    for (let s = 1; s <= 8; s++) items.push({ courseId, jenis: JenisTugas.DISKUSI, sesi: s, status: StatusTugas.BELUM })
    for (let s = 1; s <= 8; s++) items.push({ courseId, jenis: JenisTugas.ABSEN,   sesi: s, status: StatusTugas.BELUM })
    for (const s of [3, 5, 7])  items.push({ courseId, jenis: JenisTugas.TUGAS,   sesi: s, status: StatusTugas.BELUM })
    return items
  }

  static async createDefaults(courseId: number) {
    const items = this.buildDefaultItems(courseId)
    await prismaClient.tutonItem.createMany({ data: items })
    return items.length
  }

  static async clearCompletionMarks(itemId: number) {
    await prismaClient.tutonItem.update({
      where: { id: itemId },
      data: { selesaiAt: null },
    })
  }

  static async clearCompletionMarksBulk(itemIds: number[]) {
    if (!itemIds.length) return
    await prismaClient.tutonItem.updateMany({
      where: { id: { in: itemIds } },
      data: { selesaiAt: null },
    })
  }

  static async bulkUpdateStatusTx(items: Array<{ itemId: number; status: StatusTugas }>) {
    if (!items.length) return []
    return prismaClient.$transaction(
      items.map(i =>
        prismaClient.tutonItem.update({
          where: { id: i.itemId },
          data: {
            status: i.status,
            selesaiAt: i.status === StatusTugas.SELESAI ? new Date() : null,
          },
        })
      )
    )
  }

  static async bulkUpdateNilaiTx(items: Array<{ itemId: number; nilai: number | null }>) {
    if (!items.length) return []
    return prismaClient.$transaction(
      items.map(i =>
        prismaClient.tutonItem.update({
          where: { id: i.itemId },
          data: { nilai: i.nilai },
        })
      )
    )
  }

  static async findByIdsForCourse(courseId: number, ids: number[]) {
    if (!ids.length) return []
    return prismaClient.tutonItem.findMany({
      where: { courseId, id: { in: ids } },
      select: { id: true },
    })
  }

  static async findByIdsForCourseWithJenis(courseId: number, ids: number[]) {
    if (!ids.length) return []
    return prismaClient.tutonItem.findMany({
      where: { courseId, id: { in: ids } },
      select: { id: true, jenis: true },
    })
  }

  // ===== NEW: scan untuk dashboard pengecekan sesi =====
  static async scanByFilters(params: {
    matkul?: string
    jenis?: JenisTugas
    sesi?: number
    status: StatusTugas
    skip: number
    take: number
  }): Promise<ScanRow[]> {
    const { matkul, jenis, sesi, status, skip, take } = params

    return prismaClient.tutonItem.findMany({
      where: {
        status,
        ...(typeof jenis !== "undefined" ? { jenis } : {}),
        ...(typeof sesi  !== "undefined" ? { sesi }  : {}),
        ...(matkul
          // ⬇️ tidak pakai `is:`; langsung WhereInput di field relasi
          ? { course: { matkul: { contains: matkul } } }
          : {}),
      },
      select: {
        id: true,
        courseId: true,
        jenis: true,
        sesi: true,
        status: true,
        course: {
          select: {
            id: true,
            matkul: true,
            customer: { select: { id: true, namaCustomer: true } },
          },
        },
      },
      orderBy: [
        { course: { matkul: "asc" } },
        { sesi: "asc" },
        { jenis: "asc" },
        { id: "asc" },
      ],
      skip,
      take,
    })
  }

  /** Counter untuk scan; bentuk where harus sama */
  static async countScanByFilters(params: {
    matkul?: string
    jenis?: JenisTugas
    sesi?: number
    status: StatusTugas
  }): Promise<number> {
    const { matkul, jenis, sesi, status } = params

    return prismaClient.tutonItem.count({
      where: {
        status,
        ...(typeof jenis !== "undefined" ? { jenis } : {}),
        ...(typeof sesi  !== "undefined" ? { sesi }  : {}),
        ...(matkul
          ? { course: { matkul: { contains: matkul } } }
          : {}),
      },
    })
  }

}

export class TutonCourseRepository {
  static async ensureExists(courseId: number) {
    return prismaClient.tutonCourse.findUnique({ where: { id: courseId } })
  }

  static async recalcCompletedItems(courseId: number) {
    const completed = await prismaClient.tutonItem.count({
      where: { courseId, status: StatusTugas.SELESAI },
    })
    await prismaClient.tutonCourse.update({ where: { id: courseId }, data: { completedItems: completed } })
    return completed
  }

  static async touchTotals(courseId: number, totalItems: number) {
    return prismaClient.tutonCourse.update({ where: { id: courseId }, data: { totalItems } })
  }

  static async summary(courseId: number) {
    const course = await prismaClient.tutonCourse.findUnique({
      where: { id: courseId },
      select: { id: true, matkul: true, totalItems: true, completedItems: true, updatedAt: true },
    })
    if (!course) return null

    const [countDiskusi, countAbsen, countTugas, doneDiskusi, doneAbsen, doneTugas, avgDiskusi, avgTugas] =
      await Promise.all([
        prismaClient.tutonItem.count({ where: { courseId, jenis: "DISKUSI" } }),
        prismaClient.tutonItem.count({ where: { courseId, jenis: "ABSEN" } }),
        prismaClient.tutonItem.count({ where: { courseId, jenis: "TUGAS" } }),
        prismaClient.tutonItem.count({ where: { courseId, jenis: "DISKUSI", status: "SELESAI" } }),
        prismaClient.tutonItem.count({ where: { courseId, jenis: "ABSEN", status: "SELESAI" } }),
        prismaClient.tutonItem.count({ where: { courseId, jenis: "TUGAS", status: "SELESAI" } }),
        prismaClient.tutonItem.aggregate({ where: { courseId, jenis: "DISKUSI", nilai: { not: null } }, _avg: { nilai: true } }),
        prismaClient.tutonItem.aggregate({ where: { courseId, jenis: "TUGAS", nilai: { not: null } }, _avg: { nilai: true } }),
      ])

    return {
      course,
      byJenis: {
        DISKUSI: { total: countDiskusi, done: doneDiskusi, avgNilai: avgDiskusi._avg.nilai ?? null },
        ABSEN:   { total: countAbsen,   done: doneAbsen },
        TUGAS:   { total: countTugas,   done: doneTugas, avgNilai: avgTugas._avg.nilai ?? null },
      },
    }
  }
}
