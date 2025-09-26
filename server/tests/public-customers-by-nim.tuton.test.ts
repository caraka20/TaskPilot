import supertest from "supertest"
import app from "../src/app"
import { prismaClient } from "../src/config/database"
import { JenisTugas, StatusTugas } from "../src/generated/prisma"
import { CustomerTest, TutonTest, UserTest } from "./test-util"

// --- Hard cleanup biar nggak ada sisa data antar test (hindari NIM duplicate)
async function hardReset() {
  // urutan aman terhadap foreign keys
  await prismaClient.tutonItem.deleteMany({})
  await prismaClient.tutonCourse.deleteMany({})
  await prismaClient.customerPayment.deleteMany({})
  await prismaClient.karilDetail.deleteMany({})
  await prismaClient.customer.deleteMany({})
}

describe("GET /api/public/customers/:nim/tuton", () => {
  beforeEach(async () => {
    await hardReset()
    // Tidak wajib untuk endpoint publik, tapi beberapa helper kadang butuh user ada
    await UserTest.create()
  })

  afterEach(async () => {
    await hardReset()
    await UserTest.delete()
  })

  it("should return self-view by NIM with filtered items (DISKUSI 1-8, TUGAS 3/5/7, ABSEN 1-7) and include copasSoal field", async () => {
    // NIM unik per test
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const customer = await CustomerTest.create({
      nim: `PUB-${uniq}`,
      namaCustomer: "Tester UT",
    })

    // Course 1 + default items (19 = 8 diskusi + 8 absen + 3 tugas)
    const c1 = await TutonTest.createCourse(customer.id, "MAN101 - Manajemen")
    await TutonTest.createItems(c1.id)

    // Course 2 + default items
    const c2 = await TutonTest.createCourse(customer.id, "STAT101 - Statistika")
    await TutonTest.createItems(c2.id)

    // Tandai beberapa selesai + nilai (pakai signature lama helper: 4-5 argumen)
    await TutonTest.setItemStatus(c1.id, JenisTugas.DISKUSI, 1, StatusTugas.SELESAI, 80)
    await TutonTest.setItemStatus(c1.id, JenisTugas.DISKUSI, 2, StatusTugas.SELESAI, 90)
    await TutonTest.setItemStatus(c1.id, JenisTugas.ABSEN,   1, StatusTugas.SELESAI)
    await TutonTest.setItemStatus(c1.id, JenisTugas.TUGAS,   5, StatusTugas.SELESAI, 95)

    // Set copasSoal=true untuk Diskusi sesi 1 secara langsung via prisma
    await prismaClient.tutonItem.update({
      where: { courseId_jenis_sesi: { courseId: c1.id, jenis: JenisTugas.DISKUSI, sesi: 1 } },
      data: { copasSoal: true },
    })

    // (opsional) buat item out-of-range untuk uji filter publik
    if (typeof (TutonTest as any).createItem === "function") {
      await (TutonTest as any).createItem(c1.id, JenisTugas.DISKUSI, 9) // harus ter-filter
      await (TutonTest as any).createItem(c1.id, JenisTugas.ABSEN, 8)   // harus ter-filter
      await (TutonTest as any).createItem(c1.id, JenisTugas.TUGAS, 1)   // harus ter-filter
    }

    // Sinkron completedItems
    await TutonTest.recalcCompleted(c1.id)
    await TutonTest.recalcCompleted(c2.id)

    // HIT endpoint publik (tanpa Authorization)
    const res = await supertest(app).get(`/api/public/customers/${customer.nim}/tuton`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    // Header & agregasi global
    expect(data).toHaveProperty("nim", customer.nim)
    expect(data).toHaveProperty("namaCustomer", customer.namaCustomer)
    expect(data).toHaveProperty("jurusan")
    expect(data).toHaveProperty("jenis")
    expect(data).toHaveProperty("totalCourses", 2)
    expect(typeof data.totalItems).toBe("number")
    expect(typeof data.totalCompleted).toBe("number")
    expect(typeof data.overallProgress).toBe("number")

    // Tidak bocorkan field sensitif
    expect(data).not.toHaveProperty("password")
    expect(data).not.toHaveProperty("totalBayar")
    expect(data).not.toHaveProperty("sudahBayar")
    expect(data).not.toHaveProperty("sisaBayar")

    // Courses
    expect(Array.isArray(data.courses)).toBe(true)
    expect(data.courses.length).toBe(2)

    const course1 = data.courses.find((c: any) => c.courseId === c1.id)
    const course2 = data.courses.find((c: any) => c.courseId === c2.id)
    expect(course1).toBeTruthy()
    expect(course2).toBeTruthy()

    // Bentuk per course + aturan filter
    for (const c of [course1, course2]) {
      expect(c).toHaveProperty("matkul")
      expect(c).toHaveProperty("items")
      expect(c.items).toHaveProperty("DISKUSI")
      expect(c.items).toHaveProperty("TUGAS")
      expect(c.items).toHaveProperty("ABSEN")
      expect(typeof c.totalItems).toBe("number")
      expect(typeof c.completedItems).toBe("number")
      expect(typeof c.progress).toBe("number")

      // DISKUSI: sesi 1..8
      for (const it of c.items.DISKUSI) {
        expect(it.jenis).toBe("DISKUSI")
        expect(it.sesi).toBeGreaterThanOrEqual(1)
        expect(it.sesi).toBeLessThanOrEqual(8)
        expect(it).toHaveProperty("status")
        expect(it).toHaveProperty("nilai")
        expect(it).toHaveProperty("selesaiAt")
        expect(it).toHaveProperty("deskripsi")
        expect(it).toHaveProperty("copasSoal")
      }

      // TUGAS: 3,5,7
      for (const it of c.items.TUGAS) {
        expect(it.jenis).toBe("TUGAS")
        expect([3, 5, 7]).toContain(it.sesi)
        expect(it).toHaveProperty("copasSoal")
      }

      // ABSEN: 1..7
      for (const it of c.items.ABSEN) {
        expect(it.jenis).toBe("ABSEN")
        expect(it.sesi).toBeGreaterThanOrEqual(1)
        expect(it.sesi).toBeLessThanOrEqual(7)
        expect(it).toHaveProperty("copasSoal")
      }
    }

    // Spot-check perubahan course1
    const d1 = course1.items.DISKUSI.find((x: any) => x.sesi === 1)
    const d2 = course1.items.DISKUSI.find((x: any) => x.sesi === 2)
    const a1 = course1.items.ABSEN.find((x: any) => x.sesi === 1)
    const t5 = course1.items.TUGAS.find((x: any) => x.sesi === 5)

    expect(d1?.status).toBe(StatusTugas.SELESAI)
    expect(d1?.nilai).toBe(80)
    expect(d1?.copasSoal).toBe(true)

    expect(d2?.status).toBe(StatusTugas.SELESAI)
    expect(d2?.nilai).toBe(90)

    expect(a1?.status).toBe(StatusTugas.SELESAI)

    expect(t5?.status).toBe(StatusTugas.SELESAI)
    expect(t5?.nilai).toBe(95)

    // Out-of-range tidak ikut
    const hasDiskusi9 = course1.items.DISKUSI.some((x: any) => x.sesi === 9)
    const hasAbsen8   = course1.items.ABSEN.some((x: any) => x.sesi === 8)
    const hasTugas1   = course1.items.TUGAS.some((x: any) => x.sesi === 1)
    expect(hasDiskusi9).toBe(false)
    expect(hasAbsen8).toBe(false)
    expect(hasTugas1).toBe(false)
  })

  it("should return zero/empty aggregation when customer has no courses", async () => {
    const uniq = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const customer = await CustomerTest.create({ nim: `EMPTY-${uniq}` })

    const res = await supertest(app).get(`/api/public/customers/${customer.nim}/tuton`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    expect(data.totalCourses).toBe(0)
    expect(data.totalItems).toBe(0)
    expect(data.totalCompleted).toBe(0)
    expect(data.overallProgress).toBe(0)
    expect(Array.isArray(data.courses)).toBe(true)
    expect(data.courses.length).toBe(0)
  })

  it("should return 404 when NIM not found", async () => {
    const res = await supertest(app).get(`/api/public/customers/NIM-TIDAK-ADA/tuton`)
    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error") // dari ResponseHandler/error handler-mu
  })
})
