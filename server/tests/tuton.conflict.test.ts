import supertest from "supertest"
import app from "../src/app"
import { CustomerTest, TutonTest, UserTest } from "./test-util"


describe("GET /api/tuton-courses/conflicts", () => {
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

  it("should return conflict groups when same matkul appears on multiple customers (OWNER)", async () => {
    const [c1, c2, c3] = await CustomerTest.createMany(3)
    const matkul = "MAN101 - Manajemen"

    await TutonTest.createCourseFor(c1.id, matkul)
    await TutonTest.createCourseFor(c2.id, matkul)
    await TutonTest.createCourseFor(c3.id, matkul)

    const res = await supertest(app)
      .get("/api/tuton-courses/conflicts")
      .set("Authorization", `Bearer ${ownerToken}`)
      
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    const groups = res.body.data as any[]
    expect(Array.isArray(groups)).toBe(true)

    // cari grup untuk matkul tsb
    const group = groups.find(g => g.matkul === matkul)
    expect(group).toBeTruthy()
    expect(group.total).toBe(3)
    expect(Array.isArray(group.customers)).toBe(true)
    expect(group.customers.length).toBe(3)

    // first non-duplicate, others duplicate
    expect(group.customers[0].isDuplicate).toBe(false)
    expect(group.customers[1].isDuplicate).toBe(true)
    expect(group.customers[2].isDuplicate).toBe(true)
  })

  it("should allow USER to access conflicts", async () => {
    const [a, b] = await CustomerTest.createMany(2)
    const matkul = "STAT101 - Statistika"

    await TutonTest.createCourseFor(a.id, matkul)
    await TutonTest.createCourseFor(b.id, matkul)

    const res = await supertest(app)
      .get("/api/tuton-courses/conflicts")
      .set("Authorization", `Bearer ${userToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it("should return empty array when no conflicts", async () => {
    const c = await CustomerTest.createWith()
    await TutonTest.createCourseFor(c.id, "FIS101 - Fisika")

    const res = await supertest(app)
      .get("/api/tuton-courses/conflicts")
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBe(0) // tidak ada matkul yg > 1
  })

  it("should return 401 when no token", async () => {
    const res = await supertest(app).get("/api/tuton-courses/conflicts")
    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})


