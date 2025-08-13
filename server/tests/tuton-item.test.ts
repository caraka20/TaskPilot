import supertest from "supertest"
import app from "../src/app"
import { CustomerTest, TutonTest, UserTest } from "./test-util"
import { prismaClient } from "../src/config/database"
import { JenisTugas } from "../src/generated/prisma"

describe("GET /api/tuton-courses/:courseId/items", () => {
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

  it("should return 19 items for an existing course (OWNER)", async () => {
    const customer = await CustomerTest.create()
    const course = await TutonTest.createCourse(customer.id, "MAN101 - Manajemen")
    await TutonTest.createItems(course.id) // 8 diskusi + 8 absen + 3 tugas

    const res = await supertest(app)
      .get(`/api/tuton-courses/${course.id}/items`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBe(19)

    const items = res.body.data as any[]

    // struktur minimum
    const sample = items[0]
    expect(sample).toHaveProperty("id")
    expect(sample).toHaveProperty("courseId", course.id)
    expect(sample).toHaveProperty("jenis")
    expect(sample).toHaveProperty("sesi")
    expect(sample).toHaveProperty("status")
    expect(sample).toHaveProperty("nilai")

    // validasi komposisi
    const diskusi = items.filter(i => i.jenis === "DISKUSI").length
    const absen   = items.filter(i => i.jenis === "ABSEN").length
    const tugas   = items.filter(i => i.jenis === "TUGAS").length
    expect(diskusi).toBe(8)
    expect(absen).toBe(8)
    expect(tugas).toBe(3)
  })

  it("should allow USER to list items", async () => {
    const customer = await CustomerTest.create()
    const course = await TutonTest.createCourse(customer.id, "EKM201 - Ekonomi Manajerial")
    await TutonTest.createItems(course.id)

    const res = await supertest(app)
      .get(`/api/tuton-courses/${course.id}/items`)
      .set("Authorization", `Bearer ${userToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it("should return 404 when course not found", async () => {
    const res = await supertest(app)
      .get(`/api/tuton-courses/999999/items`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when courseId is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .get(`/api/tuton-courses/abc/items`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    // siapkan course valid
    const customer = await CustomerTest.create()
    const course = await TutonTest.createCourse(customer.id, "STAT101 - Statistika")
    await TutonTest.createItems(course.id)

    const res = await supertest(app)
      .get(`/api/tuton-courses/${course.id}/items`)

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("PATCH /api/tuton-items/:itemId", () => {
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

  it("should update status to SELESAI and set selesaiAt (OWNER)", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "MAN101 - Manajemen")
    await TutonTest.createItems(course.id)

    const item = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 7)
    expect(item).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${item!.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "SELESAI" })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("id", item!.id)
    expect(res.body.data).toHaveProperty("status", "SELESAI")
    expect(res.body.data.selesaiAt).toBeTruthy()
  })

  it("should allow USER to update nilai on DISKUSI", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "EKM201 - Ekonomi Manajerial")
    await TutonTest.createItems(course.id)

    const item = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 3)
    expect(item).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${item!.id}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ nilai: 88 })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("nilai", 88)
  })

  it("should reject setting nilai for ABSEN (400)", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "STAT101 - Statistika")
    await TutonTest.createItems(course.id)

    const absen = await TutonTest.findItem(course.id, JenisTugas.ABSEN, 2)
    expect(absen).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${absen!.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ nilai: 75 })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should update multiple fields at once (status + nilai + deskripsi)", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "PSI101 - Pengantar Psikologi")
    await TutonTest.createItems(course.id)

    const tugas = await TutonTest.findItem(course.id, JenisTugas.TUGAS, 5)
    expect(tugas).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${tugas!.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "SELESAI", nilai: 95, deskripsi: "ok" })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("status", "SELESAI")
    expect(res.body.data).toHaveProperty("nilai", 95)
    expect(res.body.data).toHaveProperty("deskripsi", "ok")
    expect(res.body.data.selesaiAt).toBeTruthy()
  })

  it("should return 404 when item not found", async () => {
    const res = await supertest(app)
      .patch(`/api/tuton-items/999999`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "SELESAI" })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when itemId is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .patch(`/api/tuton-items/abc`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "SELESAI" })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "BIO101 - Biologi Dasar")
    await TutonTest.createItems(course.id)

    const item = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 1)
    expect(item).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${item!.id}`)
      .send({ status: "SELESAI" })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})


describe("PATCH /api/tuton-items/:itemId/status", () => {
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

  it("should set status to SELESAI and update selesaiAt & course.completedItems (OWNER)", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "MAN101 - Manajemen")
    await TutonTest.createItems(course.id)

    // ambil item diskusi sesi 7
    const item = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 7)
    expect(item).toBeTruthy()

    // sebelum update, completedItems = 0
    let before = await prismaClient.tutonCourse.findUnique({ where: { id: course.id } })
    expect(before?.completedItems).toBe(0)

    const res = await supertest(app)
      .patch(`/api/tuton-items/${item!.id}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "SELESAI" })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("id", item!.id)
    expect(res.body.data).toHaveProperty("status", "SELESAI")
    expect(res.body.data.selesaiAt).toBeTruthy()

    // setelah update, completedItems = 1
    const after = await prismaClient.tutonCourse.findUnique({ where: { id: course.id } })
    expect(after?.completedItems).toBe(1)
  })

  it("should allow USER to set status back to BELUM and clear selesaiAt", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "EKM201 - Ekonomi Manajerial")
    await TutonTest.createItems(course.id)
    const item = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 3)
    expect(item).toBeTruthy()

    // set ke SELESAI dulu
    await supertest(app)
      .patch(`/api/tuton-items/${item!.id}/status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "SELESAI" })
      .expect(200)

    // lalu balikin ke BELUM
    const res = await supertest(app)
      .patch(`/api/tuton-items/${item!.id}/status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "BELUM" })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("status", "BELUM")
    expect(res.body.data.selesaiAt).toBeNull()
  })

  it("should return 400 when status is invalid", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "STAT101 - Statistika")
    await TutonTest.createItems(course.id)
    const item = await TutonTest.findItem(course.id, JenisTugas.ABSEN, 2)
    expect(item).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${item!.id}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "DONE" })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 404 when item not found", async () => {
    const res = await supertest(app)
      .patch(`/api/tuton-items/999999/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "SELESAI" })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when itemId is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .patch(`/api/tuton-items/abc/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "SELESAI" })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "BIO101 - Biologi Dasar")
    await TutonTest.createItems(course.id)
    const item = await TutonTest.findItem(course.id, JenisTugas.TUGAS, 5)
    expect(item).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${item!.id}/status`)
      .send({ status: "SELESAI" })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("PATCH /api/tuton-items/:itemId/nilai", () => {
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

  it("should allow OWNER to set nilai for DISKUSI", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "MAN101 - Manajemen")
    await TutonTest.createItems(course.id)

    const item = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 7)
    expect(item).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${item!.id}/nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ nilai: 88 })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("id", item!.id)
    expect(res.body.data).toHaveProperty("nilai", 88)
  })

  it("should allow USER to set nilai for TUGAS", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "EKM201 - Ekonomi Manajerial")
    await TutonTest.createItems(course.id)

    const tugas = await TutonTest.findItem(course.id, JenisTugas.TUGAS, 5)
    expect(tugas).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${tugas!.id}/nilai`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ nilai: 95 })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("nilai", 95)
  })

  it("should allow clearing nilai (set to null)", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "PSI101 - Pengantar Psikologi")
    await TutonTest.createItems(course.id)

    const diskusi = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 3)
    expect(diskusi).toBeTruthy()

    // set dulu
    await supertest(app)
      .patch(`/api/tuton-items/${diskusi!.id}/nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ nilai: 80 })
      .expect(200)

    // lalu clear
    const res = await supertest(app)
      .patch(`/api/tuton-items/${diskusi!.id}/nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ nilai: null })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("nilai", null)
  })

  it("should return 400 when setting nilai for ABSEN", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "STAT101 - Statistika")
    await TutonTest.createItems(course.id)

    const absen = await TutonTest.findItem(course.id, JenisTugas.ABSEN, 2)
    expect(absen).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${absen!.id}/nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ nilai: 70 })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when nilai is out of range", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "BIO101 - Biologi Dasar")
    await TutonTest.createItems(course.id)

    const diskusi = await TutonTest.findItem(course.id, JenisTugas.DISKUSI, 1)
    expect(diskusi).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${diskusi!.id}/nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ nilai: 120 }) // > 100

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 404 when item not found", async () => {
    const res = await supertest(app)
      .patch(`/api/tuton-items/999999/nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ nilai: 90 })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when itemId is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .patch(`/api/tuton-items/abc/nilai`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ nilai: 90 })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const c = await CustomerTest.create()
    const course = await TutonTest.createCourse(c.id, "HIS101 - Sejarah")
    await TutonTest.createItems(course.id)

    const tugas = await TutonTest.findItem(course.id, JenisTugas.TUGAS, 7)
    expect(tugas).toBeTruthy()

    const res = await supertest(app)
      .patch(`/api/tuton-items/${tugas!.id}/nilai`)
      .send({ nilai: 85 })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})