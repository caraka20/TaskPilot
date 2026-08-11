import supertest from "supertest"
import app from '../src/app'
import { CustomerTest, TutonTest, UserTest } from "./test-util"

describe("POST /api/customers", () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await CustomerTest.delete()
  })

  afterEach(async () => {
    await CustomerTest.delete()
    await UserTest.delete()
  })

  it("should allow OWNER to create customer", async () => {
    const payload = {
      namaCustomer: "Budi",
      noWa: "0812000111",
      nim: `TEST-${Date.now()}`,
      password: "plain-pass",
      jurusan: "Manajemen",
      jenis: "TUTON",
      totalBayar: 500000,
      sudahBayar: 200000,
    }

    const res = await supertest(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send(payload)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("id")
    expect(res.body.data).toHaveProperty("nim", payload.nim)
    expect(res.body.data.sisaBayar).toBe(300000)
  })

  it("should allow USER to create customer (route allows USER too)", async () => {
    const payload = {
      namaCustomer: "Siti",
      noWa: "0812333444",
      nim: `TEST-${Date.now() + 1}`,
      password: "elearning-pass",
      jurusan: "Akuntansi",
      jenis: "TUTON",
      totalBayar: 100000,
      sudahBayar: 100000,
    }

    const res = await supertest(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${userToken}`)
      .send(payload)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("nim", payload.nim)
    expect(res.body.data.sisaBayar).toBe(0)
  })

  it("should return 400 on duplicate NIM", async () => {
    const nim = `TEST-${Date.now() + 2}`
    await CustomerTest.create({ nim })

    const res = await supertest(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        namaCustomer: "Dupe",
        noWa: "0812",
        nim,
        password: "pwd",
        jurusan: "Test",
        jenis: "TUTON",
      })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when sudahBayar > totalBayar (validation)", async () => {
    const res = await supertest(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        namaCustomer: "InvalidPay",
        noWa: "0812",
        nim: `TEST-${Date.now() + 3}`,
        password: "pwd",
        jurusan: "Test",
        jenis: "TUTON",
        totalBayar: 100000,
        sudahBayar: 150000,
      })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 without token", async () => {
    const res = await supertest(app)
      .post("/api/customers")
      .send({
        namaCustomer: "NoAuth",
        noWa: "0812",
        nim: `TEST-${Date.now() + 4}`,
        password: "pwd",
        jurusan: "Test",
        jenis: "TUTON",
      })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("GET /api/customers/id", () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await CustomerTest.delete()
  })

  afterEach(async () => {
    await CustomerTest.delete()
    await UserTest.delete()
  })

  it("should allow OWNER to get customer detail", async () => {
    const created = await CustomerTest.create()

    const res = await supertest(app)
      .get(`/api/customers/${created.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
    
    // console.log(res.body);
    
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    expect(data).toHaveProperty("id", created.id)
    expect(data).toHaveProperty("nim", created.nim)
    expect(data).toHaveProperty("tutonCourseCount")
    expect(data).toHaveProperty("hasKaril")
  })

  it("should allow USER to get customer detail (route allows USER)", async () => {
    const created = await CustomerTest.create()

    const res = await supertest(app)
      .get(`/api/customers/${created.id}`)
      .set("Authorization", `Bearer ${userToken}`)

    // console.log(res.body);
    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data).toHaveProperty("id", created.id)
  })

  it("should return 404 when customer not found", async () => {
    const res = await supertest(app)
      .get(`/api/customers/999999`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when id is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .get(`/api/customers/abc`) // invalid id
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const created = await CustomerTest.create()

    const res = await supertest(app)
      .get(`/api/customers/${created.id}`)

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("DELETE /api/customers/:id", () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await CustomerTest.delete()
  })

  afterEach(async () => {
    await CustomerTest.delete()
    await UserTest.delete()
  })

  it("should allow OWNER to delete customer", async () => {
    const c = await CustomerTest.create()

    const del = await supertest(app)
      .delete(`/api/customers/${c.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(del.status).toBe(200)
    expect(del.body.status).toBe("success")
    expect(del.body.data.deleted).toBe(true)

    // verify gone
    const getAfter = await supertest(app)
      .get(`/api/customers/${c.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
    expect(getAfter.status).toBe(404)
  })

  it("should allow USER to delete customer (route allows USER too)", async () => {
    const c = await CustomerTest.create()

    const del = await supertest(app)
      .delete(`/api/customers/${c.id}`)
      .set("Authorization", `Bearer ${userToken}`)

    expect(del.status).toBe(200)
    expect(del.body.status).toBe("success")
    expect(del.body.data.deleted).toBe(true)
  })

  it("should return 404 when customer not found", async () => {
    const res = await supertest(app)
      .delete(`/api/customers/999999`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when id is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .delete(`/api/customers/abc`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const c = await CustomerTest.create()

    const res = await supertest(app)
      .delete(`/api/customers/${c.id}`)

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("GET /api/customers", () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await CustomerTest.delete()
  })

  afterEach(async () => {
    await CustomerTest.delete()
    await UserTest.delete()
  })

it("should return paginated list (default sort by createdAt desc)", async () => {
  // prefix unik per test (hindari bentrok paralel)
  const scope = `PageTest-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
  await CustomerTest.createMany(12, scope)

  const res = await supertest(app)
    .get("/api/customers")
    .query({ q: scope, page: 2, limit: 5 }) // ← filter hanya dataset ini
    .set("Authorization", `Bearer ${ownerToken}`)

  expect(res.status).toBe(200)
  const { items, pagination } = res.body.data
  expect(Array.isArray(items)).toBe(true)
  expect(items.length).toBe(5)
  expect(pagination).toEqual(
    expect.objectContaining({ page: 2, limit: 5, total: 12, totalPages: 3 })
  )
})

  it("should filter by q (namaCustomer / nim)", async () => {
    const keep = await CustomerTest.create({ namaCustomer: "Budi UT Pro" })
    await CustomerTest.create({ namaCustomer: "Ani Lain" })

    const res = await supertest(app)
      .get("/api/customers")
      .query({ q: "budi" })
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    const { items, pagination } = res.body.data
    expect(pagination.total).toBeGreaterThanOrEqual(1)
    expect(items.find((c: any) => c.id === keep.id)).toBeTruthy()
    expect(items.every((c: any) => /budi/i.test(c.namaCustomer) || /budi/i.test(c.nim))).toBe(true)
  })

  it("should support sorting by nim asc/desc", async () => {
  const prefix = `SortScope-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
  await CustomerTest.create({ nim: `${prefix}-A0001`, namaCustomer: "Sort A" })
  await CustomerTest.create({ nim: `${prefix}-B0001`, namaCustomer: "Sort B" })
  await CustomerTest.create({ nim: `${prefix}-C0001`, namaCustomer: "Sort C" })

  const asc = await supertest(app)
    .get("/api/customers")
    .query({ q: prefix, sortBy: "nim", sortDir: "asc", limit: 10 })
    .set("Authorization", `Bearer ${ownerToken}`)

  expect(asc.status).toBe(200)
  const ascNims = asc.body.data.items.map((x: any) => x.nim)
  expect(ascNims).toEqual([...ascNims].sort())

  const desc = await supertest(app)
    .get("/api/customers")
    .query({ q: prefix, sortBy: "nim", sortDir: "desc", limit: 10 })
    .set("Authorization", `Bearer ${ownerToken}`)

  expect(desc.status).toBe(200)
  const descNims = desc.body.data.items.map((x: any) => x.nim)
  expect(descNims).toEqual([...descNims].sort().reverse())
})


  it("should include tutonCourseCount per customer", async () => {
    const cust = await CustomerTest.create({ namaCustomer: "Has Courses" })
    const course1 = await TutonTest.createCourse(cust.id, "Manajemen")
    await TutonTest.createItems(course1.id)
    const course2 = await TutonTest.createCourse(cust.id, "Statistika")
    await TutonTest.createItems(course2.id)

    const res = await supertest(app)
      .get("/api/customers")
      .query({ q: "Has Courses", limit: 5 })
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    const row = res.body.data.items.find((x: any) => x.id === cust.id)
    expect(row).toBeTruthy()
    expect(row.tutonCourseCount).toBe(2)
  })

  it("should allow USER to access list", async () => {
    await CustomerTest.createMany(3, "UserView")

    const res = await supertest(app)
      .get("/api/customers")
      .query({ limit: 3 })
      .set("Authorization", `Bearer ${userToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data.items.length).toBeGreaterThan(0)
  })

  it("should return 400 for invalid params (page=0 or sortBy invalid)", async () => {
    const res1 = await supertest(app)
      .get("/api/customers")
      .query({ page: 0 }) // must be positive
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res1.status).toBe(400)
    expect(res1.body.status).toBe("error")

    const res2 = await supertest(app)
      .get("/api/customers")
      .query({ sortBy: "unknown" })
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res2.status).toBe(400)
    expect(res2.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const res = await supertest(app)
      .get("/api/customers")
      .query({ limit: 5 })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})
