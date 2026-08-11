import { prismaClient } from "../../config/database"
import { JenisTugas, Prisma, StatusTugas } from "../../generated/prisma"

export class TutonRepository {
  // --- Customer / Course basic ops ---
  static findCustomerById(id: number) {
    return prismaClient.customer.findUnique({ where: { id } })
  }

  static findCourseByCustomerAndMatkul(customerId: number, matkul: string) {
    // @@unique([customerId, matkul]) ⇒ key: customerId_matkul
    return prismaClient.tutonCourse.findUnique({
      where: { customerId_matkul: { customerId, matkul } },
    })
  }

  static createCourse(customerId: number, matkul: string) {
    return prismaClient.tutonCourse.create({
      data: { customerId, matkul },
    })
  }

  static findCourseById(courseId: number) {
    return prismaClient.tutonCourse.findUnique({ where: { id: courseId } })
  }

  static deleteCourse(courseId: number) {
    // TutonItem onDelete: Cascade → otomatis ikut terhapus
    return prismaClient.tutonCourse.delete({ where: { id: courseId } })
  }

// TutonRepository.createItemsForCourse
  static async createItemsForCourse(courseId: number) {
    const items: Prisma.TutonItemCreateManyInput[] = []

    // DISKUSI — boleh punya copasSoal (default false, boleh di-skip)
    for (let s = 1; s <= 8; s++) {
      items.push({
        courseId,
        jenis: JenisTugas.DISKUSI,
        sesi: s,
        status: StatusTugas.BELUM,
        copasSoal: false, // opsional (default false di schema), boleh dihapus
      })
    }

    // ABSEN — TIDAK punya copas/copasSoal
    for (let s = 1; s <= 8; s++) {
      items.push({
        courseId,
        jenis: JenisTugas.ABSEN,
        sesi: s,
        status: StatusTugas.BELUM,
        // jangan kirim copas/copasSoal di ABSEN
      } as Prisma.TutonItemCreateManyInput)
    }

    // TUGAS — boleh punya copasSoal (default false)
    for (const s of [3, 5, 7]) {
      items.push({
        courseId,
        jenis: JenisTugas.TUGAS,
        sesi: s,
        status: StatusTugas.BELUM,
        copasSoal: false, // opsional
      })
    }

    await prismaClient.tutonItem.createMany({ data: items })
    return items.length
  }


  static updateCourseTotals(courseId: number, totalItems: number, completedItems = 0) {
    return prismaClient.tutonCourse.update({
      where: { id: courseId },
      data: { totalItems, completedItems },
    })
  }

  // --- Lists / Conflicts ---
  static async listAllCoursesWithCustomerMinimal() {
    return prismaClient.tutonCourse.findMany({
      select: {
        id: true,
        matkul: true,
        createdAt: true,
        customer: { select: { id: true, namaCustomer: true } },
      },
      orderBy: [{ matkul: "asc" }, { createdAt: "asc" }],
    })
  }

  static async listCoursesByMatkul(matkul: string) {
    return prismaClient.tutonCourse.findMany({
      where: { matkul },
      select: {
        id: true,
        createdAt: true,
        customer: { select: { id: true, namaCustomer: true } },
      },
      orderBy: { createdAt: "asc" },
    })
  }

  // Konflik per matkul tanpa groupBy: kumpulkan lalu reduce di JS
  static async groupCoursesByMatkul() {
    const rows = await prismaClient.tutonCourse.findMany({
      select: { matkul: true },
    });

    const map = new Map<string, number>();
    for (const r of rows) map.set(r.matkul, (map.get(r.matkul) ?? 0) + 1);

    return Array.from(map.entries())
      .map(([matkul, total]) => ({ matkul, total }))
      .sort((a, b) => b.total - a.total || a.matkul.localeCompare(b.matkul));
  }


  // --- Exist / Summary / Refresh ---
  static async exists(courseId: number): Promise<boolean> {
    const row = await prismaClient.tutonCourse.findUnique({
      where: { id: courseId },
      select: { id: true },
    })
    return !!row
  }

  // Summary berbasis TutonItem (bukan field di course)
  static async getSummary(courseId: number) {
    const course = await prismaClient.tutonCourse.findUnique({
      where: { id: courseId },
      select: { id: true, matkul: true },
    });
    if (!course) return null;

    const [
      totalItems,
      completedItems,

      diskusiTotal,
      diskusiDone,
      diskusiAvg,

      absenTotal,
      absenDone,

      tugasTotal,
      tugasDone,
      tugasAvg,
    ] = await prismaClient.$transaction([
      prismaClient.tutonItem.count({ where: { courseId } }),
      prismaClient.tutonItem.count({ where: { courseId, status: StatusTugas.SELESAI } }),

      prismaClient.tutonItem.count({ where: { courseId, jenis: JenisTugas.DISKUSI } }),
      prismaClient.tutonItem.count({ where: { courseId, jenis: JenisTugas.DISKUSI, status: StatusTugas.SELESAI } }),
      prismaClient.tutonItem.aggregate({
        where: { courseId, jenis: JenisTugas.DISKUSI, nilai: { not: null } },
        _avg: { nilai: true },
      }),

      prismaClient.tutonItem.count({ where: { courseId, jenis: JenisTugas.ABSEN } }),
      prismaClient.tutonItem.count({ where: { courseId, jenis: JenisTugas.ABSEN, status: StatusTugas.SELESAI } }),

      prismaClient.tutonItem.count({ where: { courseId, jenis: JenisTugas.TUGAS } }),
      prismaClient.tutonItem.count({ where: { courseId, jenis: JenisTugas.TUGAS, status: StatusTugas.SELESAI } }),
      prismaClient.tutonItem.aggregate({
        where: { courseId, jenis: JenisTugas.TUGAS, nilai: { not: null } },
        _avg: { nilai: true },
      }),
    ]);

    const progress = totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

    return {
      courseId,
      matkul: course.matkul,
      totalItems,
      completedItems,
      progress,
      byJenis: {
        DISKUSI: {
          total: diskusiTotal,
          done: diskusiDone,
          avgNilai: diskusiAvg._avg.nilai ?? null,
        },
        ABSEN: {
          total: absenTotal,
          done: absenDone,
        },
        TUGAS: {
          total: tugasTotal,
          done: tugasDone,
          avgNilai: tugasAvg._avg.nilai ?? null,
        },
      },
      updatedAt: new Date().toISOString(),
    };
  }



  /** Sinkronkan kembali kolom ringkasan di tabel course (opsional dipakai endpoint bulk) */
  static async refreshCompletedItems(courseId: number) {
    const [total, completed] = await prismaClient.$transaction([
      prismaClient.tutonItem.count({ where: { courseId } }),
      prismaClient.tutonItem.count({ where: { courseId, status: StatusTugas.SELESAI } }),
    ])
    return prismaClient.tutonCourse.update({
      where: { id: courseId },
      data: { totalItems: total, completedItems: completed },
      select: { id: true, totalItems: true, completedItems: true },
    })
  }

  // Ambil course termasuk customerId untuk validasi unik saat rename
  static async findCourseWithCustomerId(courseId: number) {
    return prismaClient.tutonCourse.findUnique({
      where: { id: courseId },
      select: { id: true, matkul: true, customerId: true },
    });
  }

  // Cek duplikasi (customerId + matkul) selain courseId yg sedang diedit
  static async existsMatkulForCustomerExcept(
    customerId: number,
    matkul: string,
    exceptCourseId: number,
  ) {
    const dup = await prismaClient.tutonCourse.findUnique({
      where: { customerId_matkul: { customerId, matkul } },
      select: { id: true },
    });
    return !!dup && dup.id !== exceptCourseId;
  }

  static async updateCourseMatkul(courseId: number, matkul: string) {
    return prismaClient.tutonCourse.update({
      where: { id: courseId },
      data: { matkul },
    });
  }

  static async deleteItemsByCourse(courseId: number) {
    await prismaClient.tutonItem.deleteMany({ where: { courseId } });
  }
  
}
