import supertest from "supertest"
import app from "../src/app"
import { prismaClient } from "../src/config/database"
import { UserTest, CustomerTest, TutonTest } from "./test-util"
import { JenisTugas, StatusTugas } from "../src/generated/prisma"

describe("POST /api/tuton-courses/:courseId/items/init", () => {
  let ownerToken: string
  let userToken: string
  let customerId: number
  let courseId: number

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()

    await TutonTest.delete()
    await CustomerTest.delete()

    const cust = await CustomerTest.create()
    customerId = cust.id
    const course = await TutonTest.createCourse(customerId, "Manajemen")
    courseId = course.id
  })

  afterEach(async () => {
    await TutonTest.delete()
    await CustomerTest.delete()
    await UserTest.delete()
  })

  it("should init 19 default items for course (OWNER)", async () => {
    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/init`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({}) // overwrite default false

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    expect(data).toHaveProperty("courseId", courseId)
    expect(data).toHaveProperty("created", true)
    expect(data).toHaveProperty("totalItems", 19)
    expect(data).toHaveProperty("completedItems", 0)

    const count = await TutonTest.countItems(courseId)
    expect(count).toBe(19)

    const course = await prismaClient.tutonCourse.findUnique({ where: { id: courseId } })
    expect(course?.totalItems).toBe(19)
    expect(course?.completedItems).toBe(0)
  })

  it("should be idempotent (no overwrite): second call does not recreate", async () => {
    // init pertama
    await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/init`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({})

    // init kedua tanpa overwrite
    const res2 = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/init`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({})

    expect(res2.status).toBe(200)
    expect(res2.body.status).toBe("success")
    expect(res2.body.data).toHaveProperty("created", false)

    const count = await TutonTest.countItems(courseId)
    expect(count).toBe(19)

    const course = await prismaClient.tutonCourse.findUnique({ where: { id: courseId } })
    expect(course?.totalItems).toBe(19)
  })

  it("should recreate when overwrite=true", async () => {
    // seed manual biar ada items dulu (atau panggil init pertama)
    await TutonTest.createItems(courseId)

    const beforeCount = await TutonTest.countItems(courseId)
    expect(beforeCount).toBe(19)

    // overwrite
    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/init`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ overwrite: true })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("created", true)
    expect(res.body.data).toHaveProperty("totalItems", 19)

    const afterCount = await TutonTest.countItems(courseId)
    expect(afterCount).toBe(19)

    const course = await prismaClient.tutonCourse.findUnique({ where: { id: courseId } })
    expect(course?.totalItems).toBe(19)
    expect(course?.completedItems).toBe(0)
  })

  it("should allow USER as well", async () => {
    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/init`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("courseId", courseId)

    const count = await TutonTest.countItems(courseId)
    expect(count).toBe(19)
  })

  it("should return 404 when course not found", async () => {
    const res = await supertest(app)
      .post(`/api/tuton-courses/999999/items/init`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({})

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when courseId is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .post(`/api/tuton-courses/abc/items/init`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/init`)
      .send({})

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("POST /api/tuton-courses/:courseId/items/bulk-status", () => {
  let ownerToken: string
  let userToken: string
  let customerId: number
  let courseId: number

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()

    await TutonTest.delete()
    await CustomerTest.delete()

    const cust = await CustomerTest.create()
    customerId = cust.id
    const course = await TutonTest.createCourse(customerId, "Manajemen Operasional")
    courseId = course.id
    await TutonTest.createItems(courseId) // 19 items
  })

  afterEach(async () => {
    await TutonTest.delete()
    await CustomerTest.delete()
    await UserTest.delete()
  })

  it("should update multiple items to SELESAI (OWNER) and refresh completedItems", async () => {
    const i1 = await TutonTest.findItem(courseId, JenisTugas.DISKUSI, 1)
    const i2 = await TutonTest.findItem(courseId, JenisTugas.ABSEN, 2)
    const i3 = await TutonTest.findItem(courseId, JenisTugas.TUGAS, 3)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        items: [
          { itemId: i1.id, status: "SELESAI" },
          { itemId: i2.id, status: "SELESAI" },
          { itemId: i3.id, status: "SELESAI" },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("updated", 3)

    // verify items updated
    const [r1, r2, r3] = await Promise.all([
      prismaClient.tutonItem.findUnique({ where: { id: i1.id } }),
      prismaClient.tutonItem.findUnique({ where: { id: i2.id } }),
      prismaClient.tutonItem.findUnique({ where: { id: i3.id } }),
    ])
    expect(r1?.status).toBe(StatusTugas.SELESAI)
    expect(r2?.status).toBe(StatusTugas.SELESAI)
    expect(r3?.status).toBe(StatusTugas.SELESAI)

    // completedItems should be 3
    const course = await prismaClient.tutonCourse.findUnique({ where: { id: courseId } })
    expect(course?.completedItems).toBe(3)
  })

  it("should allow USER to bulk update", async () => {
    const i1 = await TutonTest.findItem(courseId, JenisTugas.DISKUSI, 4)
    const i2 = await TutonTest.findItem(courseId, JenisTugas.DISKUSI, 5)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items: [
          { itemId: i1.id, status: "SELESAI" },
          { itemId: i2.id, status: "SELESAI" },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data.updated).toBe(2)
  })

  it("should be fine updating mix BELUM/SELESAI (idempotent behavior)", async () => {
    const i1 = await TutonTest.findItem(courseId, JenisTugas.DISKUSI, 6)
    const i2 = await TutonTest.findItem(courseId, JenisTugas.DISKUSI, 7)

    // first set SELESAI
    await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ items: [{ itemId: i1.id, status: "SELESAI" }] })

    // then set BELUM for i1, SELESAI for i2
    const res2 = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        items: [
          { itemId: i1.id, status: "BELUM" },
          { itemId: i2.id, status: "SELESAI" },
        ],
      })

    expect(res2.status).toBe(200)
    expect(res2.body.status).toBe("success")
    expect(res2.body.data.updated).toBe(2)

    const [r1, r2] = await Promise.all([
      prismaClient.tutonItem.findUnique({ where: { id: i1.id } }),
      prismaClient.tutonItem.findUnique({ where: { id: i2.id } }),
    ])
    expect(r1?.status).toBe(StatusTugas.BELUM)
    expect(r2?.status).toBe(StatusTugas.SELESAI)
  })

  it("should return 404 when course not found", async () => {
    const anyItem = await TutonTest.findItem(courseId, JenisTugas.ABSEN, 1)

    const res = await supertest(app)
      .post(`/api/tuton-courses/999999/items/bulk-status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ items: [{ itemId: anyItem.id, status: "SELESAI" }] })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when body is invalid (empty items)", async () => {
    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ items: [] })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when status value is invalid", async () => {
    const i1 = await TutonTest.findItem(courseId, JenisTugas.DISKUSI, 2)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        items: [
          { itemId: i1.id, status: "DONE" },
        ],
      })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when courseId is invalid (non-numeric)", async () => {
    const i1 = await TutonTest.findItem(courseId, JenisTugas.DISKUSI, 8)

    const res = await supertest(app)
      .post(`/api/tuton-courses/abc/items/bulk-status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ items: [{ itemId: i1.id, status: "SELESAI" }] })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const i1 = await TutonTest.findItem(courseId, JenisTugas.TUGAS, 5)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
      .send({ items: [{ itemId: i1.id, status: "SELESAI" }] })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("POST /api/tuton-courses/:courseId/items/bulk-nilai", () => {
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

  it("should update nilai for multiple items (OWNER)", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Manajemen")
    await TutonTest.createItems(course.id)

    const disk7 = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 7)
    const tug7  = await TutonTest.findItem(course.id, JenisTugas.TUGAS, 7)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        items: [
          { itemId: disk7.id, nilai: 88 },
          { itemId: tug7.id,  nilai: 95 },
        ],
      })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("updated", 2)

    const d = await prismaClient.tutonItem.findUnique({ where: { id: disk7.id } })
    const t = await prismaClient.tutonItem.findUnique({ where: { id: tug7.id } })
    expect(d?.nilai).toBe(88)
    expect(t?.nilai).toBe(95)
  })

  it("should allow USER to update nilai", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Hukum")
    await TutonTest.createItems(course.id)

    const d1 = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 1)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ items: [{ itemId: d1.id, nilai: 77 }] })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const row = await prismaClient.tutonItem.findUnique({ where: { id: d1.id } })
    expect(row?.nilai).toBe(77)
  })

  it("should reject when nilai is out of range (e.g., >100)", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Akuntansi")
    await TutonTest.createItems(course.id)
    const d2 = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 2)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ items: [{ itemId: d2.id, nilai: 120 }] }) // invalid

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should reject empty payload (items required)", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Sosiologi")
    await TutonTest.createItems(course.id)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ items: [] })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 404 when course not found", async () => {
    const res = await supertest(app)
      .post(`/api/tuton-courses/999999/items/bulk-nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ items: [{ itemId: 1, nilai: 80 }] })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 if any item does not belong to the course", async () => {
    const cust = await CustomerTest.create()
    const c1 = await TutonTest.createCourse(cust.id, "Biologi")
    const c2 = await TutonTest.createCourse(cust.id, "Fisika")
    await TutonTest.createItems(c1.id)
    await TutonTest.createItems(c2.id)

    const i1 = await TutonTest.findItem(c1.id, JenisTugas.DISKUSI, 3)
    const iWrong = await TutonTest.findItem(c2.id, JenisTugas.DISKUSI, 4) // beda course

    const res = await supertest(app)
      .post(`/api/tuton-courses/${c1.id}/items/bulk-nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ items: [{ itemId: i1.id, nilai: 70 }, { itemId: iWrong.id, nilai: 80 }] })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Psikologi")
    await TutonTest.createItems(course.id)
    const d3 = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 3)

    const res = await supertest(app)
      .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
      .send({ items: [{ itemId: d3.id, nilai: 65 }] })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("GET /api/tuton-courses/:courseId/summary", () => {
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

  it("should return correct summary for OWNER", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Manajemen")
    await TutonTest.createItems(course.id) // 19 items (8 diskusi, 8 absen, 3 tugas)

    // Tandai 3 diskusi + 2 absen + 1 tugas = 6 selesai
    const d1 = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 1)
    const d2 = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 2)
    const d3 = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 3)
    const a1 = await TutonTest.findItem(course.id, JenisTugas.ABSEN, 1)
    const a2 = await TutonTest.findItem(course.id, JenisTugas.ABSEN, 2)
    const t3 = await TutonTest.findItem(course.id, JenisTugas.TUGAS, 3)

    await prismaClient.$transaction([
      prismaClient.tutonItem.update({ where: { id: d1.id }, data: { status: StatusTugas.SELESAI } }),
      prismaClient.tutonItem.update({ where: { id: d2.id }, data: { status: StatusTugas.SELESAI } }),
      prismaClient.tutonItem.update({ where: { id: d3.id }, data: { status: StatusTugas.SELESAI } }),
      prismaClient.tutonItem.update({ where: { id: a1.id }, data: { status: StatusTugas.SELESAI } }),
      prismaClient.tutonItem.update({ where: { id: a2.id }, data: { status: StatusTugas.SELESAI } }),
      prismaClient.tutonItem.update({ where: { id: t3.id }, data: { status: StatusTugas.SELESAI } }),
    ])

    const res = await supertest(app)
      .get(`/api/tuton-courses/${course.id}/summary`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    // Bentuk response boleh sedikit beda, tapi pastikan ada info kunci:
    expect(data).toHaveProperty("courseId", course.id)
    // total items & completed (harus 19 & 6)
    const totals = data.totals || data.total || data.summary || data
    expect(totals.totalItems ?? data.totalItems).toBe(19)
    const completed = totals.completedItems ?? data.completedItems
    expect(completed).toBe(6)

    // persen progres antara 0..100 (≈ 6/19*100)
    const percent = totals.completionPercent ?? totals.percent ?? data.completionPercent
    expect(typeof percent).toBe("number")
    expect(percent).toBeGreaterThanOrEqual(0)
    expect(percent).toBeLessThanOrEqual(100)

    // breakdown per jenis (kalau disediakan)
    if (data.jenis) {
      expect(data.jenis.DISKUSI.total).toBe(8)
      expect(data.jenis.ABSEN.total).toBe(8)
      expect(data.jenis.TUGAS.total).toBe(3)
      expect(typeof data.jenis.DISKUSI.selesai).toBe("number")
      expect(typeof data.jenis.ABSEN.selesai).toBe("number")
      expect(typeof data.jenis.TUGAS.selesai).toBe("number")
    }
  })

  it("should allow USER to get summary", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Hukum")
    await TutonTest.createItems(course.id)

    const res = await supertest(app)
      .get(`/api/tuton-courses/${course.id}/summary`)
      .set("Authorization", `Bearer ${userToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("courseId", course.id)
  })

  it("should handle course with no items (not initialized): totals=0", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Sosiologi")
    // tidak createItems

    const res = await supertest(app)
      .get(`/api/tuton-courses/${course.id}/summary`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    const tot = res.body.data.totals ?? res.body.data
    expect(tot.totalItems ?? res.body.data.totalItems).toBe(0)
    expect((tot.completedItems ?? res.body.data.completedItems) ?? 0).toBe(0)
  })

  it("should return 404 when course not found", async () => {
    const res = await supertest(app)
      .get(`/api/tuton-courses/999999/summary`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when courseId is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .get(`/api/tuton-courses/abc/summary`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const cust = await CustomerTest.create()
    const course = await TutonTest.createCourse(cust.id, "Biologi")
    await TutonTest.createItems(course.id)

    const res = await supertest(app)
      .get(`/api/tuton-courses/${course.id}/summary`)

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})