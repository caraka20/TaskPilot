import supertest from "supertest"
import app from "../src/app"
import { JenisTugas, StatusTugas } from "../src/generated/prisma"
import { CustomerTest, TutonTest, UserTest } from "./test-util"

describe("GET /api/customers/:id/tuton-summary", () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await TutonTest.delete()
    await CustomerTest.delete()
  })

  afterEach(async () => {
    await TutonTest.delete()
    await CustomerTest.delete()
    await UserTest.delete()
  })

  it("should return aggregated summary for a customer with courses (OWNER)", async () => {
    const customer = await CustomerTest.create()

    // Course 1 + items
    const c1 = await TutonTest.createCourse(customer.id, "MAN101 - Manajemen")
    await TutonTest.createItems(c1.id)

    // tandai beberapa selesai + nilai
    await TutonTest.setItemStatus(c1.id, JenisTugas.DISKUSI, 1, StatusTugas.SELESAI, 80)
    await TutonTest.setItemStatus(c1.id, JenisTugas.DISKUSI, 2, StatusTugas.SELESAI, 90)
    await TutonTest.setItemStatus(c1.id, JenisTugas.ABSEN,   1, StatusTugas.SELESAI)
    await TutonTest.setItemStatus(c1.id, JenisTugas.TUGAS,   5, StatusTugas.SELESAI, 95)
    await TutonTest.recalcCompleted(c1.id) // completedItems sinkron

    // Course 2 + items (biarkan kosong)
    const c2 = await TutonTest.createCourse(customer.id, "STAT101 - Statistika")
    await TutonTest.createItems(c2.id)
    await TutonTest.recalcCompleted(c2.id)

    const res = await supertest(app)
      .get(`/api/customers/${customer.id}/tuton-summary`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    expect(data).toHaveProperty("customerId", customer.id)
    expect(data).toHaveProperty("namaCustomer", customer.namaCustomer)
    expect(data).toHaveProperty("totalCourses", 2)
    expect(data).toHaveProperty("totalItems", 38)
    expect(data).toHaveProperty("totalCompleted", 4) // 2 diskusi + 1 absen + 1 tugas
    expect(typeof data.overallProgress).toBe("number")

    // cek per-course
    const courses = data.courses as any[]
    expect(Array.isArray(courses)).toBe(true)
    expect(courses.length).toBe(2)

    const course1 = courses.find((c: any) => c.courseId === c1.id)
    const course2 = courses.find((c: any) => c.courseId === c2.id)
    expect(course1).toBeTruthy()
    expect(course2).toBeTruthy()

    // Course 1 breakdown
    expect(course1.totalItems).toBe(19)
    expect(course1.completedItems).toBe(4)
    expect(course1.breakdown.DISKUSI.total).toBe(8)
    expect(course1.breakdown.DISKUSI.selesai).toBe(2)
    expect(course1.breakdown.DISKUSI.nilaiAvg).toBe(85) // (80+90)/2
    expect(course1.breakdown.ABSEN.total).toBe(8)
    expect(course1.breakdown.ABSEN.selesai).toBe(1)
    expect(course1.breakdown.TUGAS.total).toBe(3)
    expect(course1.breakdown.TUGAS.selesai).toBe(1)
    expect(course1.breakdown.TUGAS.nilaiAvg).toBe(95)

    // Course 2 breakdown
    expect(course2.totalItems).toBe(19)
    expect(course2.completedItems).toBe(0)
    expect(course2.breakdown.DISKUSI.selesai).toBe(0)
    expect(course2.breakdown.DISKUSI.nilaiAvg).toBeNull()
    expect(course2.breakdown.ABSEN.selesai).toBe(0)
    expect(course2.breakdown.TUGAS.selesai).toBe(0)
    expect(course2.breakdown.TUGAS.nilaiAvg).toBeNull()
  })

  it("should allow USER to access tuton summary", async () => {
    const customer = await CustomerTest.create()

    const res = await supertest(app)
      .get(`/api/customers/${customer.id}/tuton-summary`)
      .set("Authorization", `Bearer ${userToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
  })

  it("should return zero summary when customer has no courses", async () => {
    const customer = await CustomerTest.create()

    const res = await supertest(app)
      .get(`/api/customers/${customer.id}/tuton-summary`)
      .set("Authorization", `Bearer ${ownerToken}`)

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

  it("should return 404 when customer not found", async () => {
    const res = await supertest(app)
      .get(`/api/customers/999999/tuton-summary`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when id is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .get(`/api/customers/abc/tuton-summary`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const customer = await CustomerTest.create()

    const res = await supertest(app)
      .get(`/api/customers/${customer.id}/tuton-summary`)

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

