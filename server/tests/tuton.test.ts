import supertest from "supertest"
import app from '../src/app'
import { CustomerTest, TutonTest, UserTest } from "./test-util"

describe("POST /api/customers/:id/tuton-courses", () => {
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

  it("should allow OWNER to add a course and auto-generate 19 items", async () => {
    const customer = await CustomerTest.create()

    const res = await supertest(app)
      .post(`/api/customers/${customer.id}/tuton-courses`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ matkul: "MAN101 - Manajemen" })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("customerId", customer.id)
    expect(data).toHaveProperty("matkul", "MAN101 - Manajemen")
    expect(data).toHaveProperty("totalItems", 19)
    expect(data).toHaveProperty("completedItems", 0)

    // optional verif langsung ke DB
    const itemCount = await TutonTest.countItems(data.id)
    expect(itemCount).toBe(19)
  })

  it("should allow USER to add a course (route allows USER)", async () => {
    const customer = await CustomerTest.create()
    const res = await supertest(app)
      .post(`/api/customers/${customer.id}/tuton-courses`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ matkul: "EKM201 - Ekonomi Manajerial" })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data.customerId).toBe(customer.id)
  })

  it("should support generateItems=false (no default items created)", async () => {
    const customer = await CustomerTest.create()
    const res = await supertest(app)
      .post(`/api/customers/${customer.id}/tuton-courses`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ matkul: "STAT101 - Statistika", generateItems: false })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data.totalItems).toBe(0)

    const itemCount = await TutonTest.countItems(res.body.data.id)
    expect(itemCount).toBe(0)
  })

  it("should return 400 when course with same matkul already exists for the customer", async () => {
    const customer = await CustomerTest.create()
    await TutonTest.createCourse(customer.id, "DUP-001")

    const res = await supertest(app)
      .post(`/api/customers/${customer.id}/tuton-courses`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ matkul: "DUP-001" })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 404 when customer not found", async () => {
    const res = await supertest(app)
      .post(`/api/customers/999999/tuton-courses`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ matkul: "NO-CUST" })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when body is invalid (missing matkul)", async () => {
    const customer = await CustomerTest.create()
    const res = await supertest(app)
      .post(`/api/customers/${customer.id}/tuton-courses`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token is provided", async () => {
    const customer = await CustomerTest.create()
    const res = await supertest(app)
      .post(`/api/customers/${customer.id}/tuton-courses`)
      .send({ matkul: "NO-AUTH" })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})

describe("DELETE /api/tuton-courses/:courseId", () => {
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

  it("should allow OWNER to delete a course and cascade delete its items", async () => {
    const customer = await CustomerTest.create()
    const course = await TutonTest.createCourse(customer.id, "MAN101 - Manajemen")
    await TutonTest.createItems(course.id)

    // pre-check
    const before = await TutonTest.countItems(course.id)
    expect(before).toBe(19)

    const res = await supertest(app)
      .delete(`/api/tuton-courses/${course.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data.deleted).toBe(true)

    // items must be gone
    const after = await TutonTest.countItems(course.id)
    expect(after).toBe(0)
  })

    it("should allow USER to delete a course (route allows USER)", async () => {
    const customer = await CustomerTest.create()
    const course = await TutonTest.createCourse(customer.id, "EKM201 - Ekonomi Manajerial")
    await TutonTest.createItems(course.id)

    const res = await supertest(app)
        .delete(`/api/tuton-courses/${course.id}`)
        .set("Authorization", `Bearer ${userToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")
    expect(res.body.data.deleted).toBe(true)

    // pastikan item juga terhapus
    const after = await TutonTest.countItems(course.id)
    expect(after).toBe(0)
    })

  it("should return 404 when course not found", async () => {
    const res = await supertest(app)
      .delete(`/api/tuton-courses/999999`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when courseId is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .delete(`/api/tuton-courses/abc`)
      .set("Authorization", `Bearer ${ownerToken}`)

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token is provided", async () => {
    const customer = await CustomerTest.create()
    const course = await TutonTest.createCourse(customer.id, "STAT101 - Statistika")

    const res = await supertest(app)
      .delete(`/api/tuton-courses/${course.id}`)

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })
})