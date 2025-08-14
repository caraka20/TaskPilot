import supertest from "supertest"
import { CustomerTest, KarilTest, UserTest } from "./test-util"
import app from '../src/app'
import { JenisUT } from "../src/generated/prisma"

// NEW: helper agar tahan terhadap variasi payload error
function getErrorMessage(body: any): string {
  return String(
    body?.errors ??        // bentuk yang kamu pakai sekarang
    body?.error?.message ??// bentuk alternatif umum
    body?.message ??       // fallback
    ''
  )
}

function getErrorCode(body: any): string | undefined {
  return body?.error?.code ?? body?.code
}

describe("PUT /api/customers/:id/karil", () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await KarilTest.delete()
    await CustomerTest.delete()
  })

  afterEach(async () => {
    await KarilTest.delete()
    await CustomerTest.delete()
    await UserTest.delete()
  })

  it("should create new KarilDetail when not exists (OWNER)", async () => {
    const c = await CustomerTest.create({ jenis: JenisUT.KARIL })

    const res = await supertest(app)
      .put(`/api/customers/${c.id}/karil`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        judul: "Analisis Sistem Informasi",
        tugas1: true,
        tugas2: false,
        tugas3: false,
        tugas4: false,
        keterangan: "Siap dikerjakan",
      })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    expect(data).toHaveProperty("id")
    expect(data).toHaveProperty("customerId", c.id)
    expect(data).toHaveProperty("judul", "Analisis Sistem Informasi")
    expect(data).toHaveProperty("tugas1", true)
    expect(data).toHaveProperty("tugas2", false)
    expect(data).toHaveProperty("tugas3", false)
    expect(data).toHaveProperty("tugas4", false)
    expect(data).toHaveProperty("keterangan", "Siap dikerjakan")
  })

  it("should update existing KarilDetail for the customer (OWNER)", async () => {
    const c = await CustomerTest.create({ jenis: JenisUT.KARIL })
    await KarilTest.create(c.id, { judul: "Lama", tugas1: false })

    const res = await supertest(app)
      .put(`/api/customers/${c.id}/karil`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        judul: "Judul Baru",
        tugas1: true,
        tugas2: true,
        tugas3: false,
        tugas4: false,
        keterangan: "Update revisi",
      })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe("success")

    const data = res.body.data
    expect(data).toHaveProperty("customerId", c.id)
    expect(data).toHaveProperty("judul", "Judul Baru")
    expect(data).toHaveProperty("tugas1", true)
    expect(data).toHaveProperty("tugas2", true)
    expect(data).toHaveProperty("keterangan", "Update revisi")
  })

  it("should return 404 when customer not found", async () => {
    const res = await supertest(app)
      .put(`/api/customers/999999/karil`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ judul: "Xxxxxx" })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when id is invalid (non-numeric)", async () => {
    const res = await supertest(app)
      .put(`/api/customers/abc/karil`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ judul: "X" })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 400 when body is invalid (missing judul)", async () => {
    const c = await CustomerTest.create({ jenis: JenisUT.KARIL })
    const res = await supertest(app)
      .put(`/api/customers/${c.id}/karil`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        tugas1: true,
      })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
  })

  it("should return 401 when no token provided", async () => {
    const c = await CustomerTest.create({ jenis: JenisUT.KARIL })
    const res = await supertest(app)
      .put(`/api/customers/${c.id}/karil`)
      .send({ judul: "NoAuth" })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe("error")
  })

  it("should return 403 for USER (OWNER only route)", async () => {
    const c = await CustomerTest.create({ jenis: JenisUT.KARIL })
    const res = await supertest(app)
      .put(`/api/customers/${c.id}/karil`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ judul: "User mencoba" })

    expect(res.status).toBe(403)
    expect(res.body.status).toBe("error")
  })

  // ✅ Perbaikan: pakai helper getErrorMessage & getErrorCode
  it("should return 400 when customer jenis is not KARIL", async () => {
    const c = await CustomerTest.create({ jenis: JenisUT.TUTON }) // bukan KARIL

    const res = await supertest(app)
      .put(`/api/customers/${c.id}/karil`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ judul: "Harusnya gagal" })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe("error")
    expect(getErrorCode(res.body)).toBe("BAD_REQUEST")

    const msg = getErrorMessage(res.body)
    expect(msg).toMatch(/bukan peserta KARIL/i)
  })
})
