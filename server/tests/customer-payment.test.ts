import supertest from 'supertest'
import { CustomerTest, UserTest } from './test-util'
import app from '../src/app'

describe('POST /api/customers/:id/payments', () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await CustomerTest.delete()
    await CustomerTest.delete('NIM-')
  })

  afterEach(async () => {
    await CustomerTest.delete()
    await CustomerTest.delete('NIM-')
    await UserTest.delete()
  })

  it('should allow OWNER to add payment & recompute totals', async () => {
    const c = await CustomerTest.create({
      totalBayar: 100000,
      sudahBayar: 20000,
      sisaBayar: 80000,
    })

    const res = await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 30000, catatan: 'Cicilan 1' })

      console.log(res.body);
      
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')

    const data = res.body.data
    expect(data.totalBayar).toBe(100000) // tidak berubah
    expect(data.sudahBayar).toBe(50000)  // 20k + 30k
    expect(data.sisaBayar).toBe(50000)   // 100k - 50k
  })

  it('should accept custom tanggalBayar (ISO string)', async () => {
    const c = await CustomerTest.create({ totalBayar: 50000, sudahBayar: 0, sisaBayar: 50000 })

    const res = await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 10000, tanggalBayar: '2024-01-01T00:00:00.000Z', catatan: 'awal' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.data.sudahBayar).toBe(10000)
    expect(res.body.data.sisaBayar).toBe(40000)
  })

  it('should return 404 when customer not found', async () => {
    const res = await supertest(app)
      .post('/api/customers/999999/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 10000 })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe('error')
  })

  it('should return 400 when amount missing/invalid', async () => {
    const c = await CustomerTest.create()

    const res = await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({}) // no amount

    expect(res.status).toBe(400)
    expect(res.body.status).toBe('error')
  })

  it('should forbid USER (403)', async () => {
    const c = await CustomerTest.create()

    const res = await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 10000 })

    expect(res.status).toBe(403)
    expect(res.body.status).toBe('error')
  })

  it('should return 401 when no token provided', async () => {
    const c = await CustomerTest.create()

    const res = await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .send({ amount: 10000 })

    expect(res.status).toBe(401)
    expect(res.body.status).toBe('error')
  })
})

describe('PATCH /api/customers/:id/invoice', () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await CustomerTest.delete()
    await CustomerTest.delete('NIM-')
  })

  afterEach(async () => {
    await CustomerTest.delete()
    await CustomerTest.delete('NIM-')
    await UserTest.delete()
  })

  it('should allow OWNER to update totalBayar & recompute sisaBayar from payments', async () => {
    const c = await CustomerTest.create({ totalBayar: 100000, sudahBayar: 0, sisaBayar: 100000 })

    // buat 2 transaksi via endpoint
    await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 20000 })
    await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 30000 })

    const res = await supertest(app)
      .patch(`/api/customers/${c.id}/invoice`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ totalBayar: 120000 }) // sudahBayar 50k → sisa 70k

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    const d = res.body.data
    expect(d.totalBayar).toBe(120000)
    expect(d.sudahBayar).toBe(50000)
    expect(d.sisaBayar).toBe(70000)
  })

  it('should return 400 when totalBayar < sudahBayar', async () => {
    const c = await CustomerTest.create({ totalBayar: 100000, sudahBayar: 0, sisaBayar: 100000 })

    await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 60000 }) // sudahBayar = 60k

    const res = await supertest(app)
      .patch(`/api/customers/${c.id}/invoice`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ totalBayar: 50000 }) // < 60k

    expect(res.status).toBe(400)
    expect(res.body.status).toBe('error')
  })

  it('should return 404 when customer not found', async () => {
    const res = await supertest(app)
      .patch('/api/customers/999999/invoice')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ totalBayar: 100000 })

    expect(res.status).toBe(404)
    expect(res.body.status).toBe('error')
  })

  it('should return 401 when no token', async () => {
    const c = await CustomerTest.create()
    const res = await supertest(app)
      .patch(`/api/customers/${c.id}/invoice`)
      .send({ totalBayar: 100000 })
    expect(res.status).toBe(401)
    expect(res.body.status).toBe('error')
  })

  it('should forbid USER (403)', async () => {
    const c = await CustomerTest.create()
    const res = await supertest(app)
      .patch(`/api/customers/${c.id}/invoice`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ totalBayar: 123456 })
    expect(res.status).toBe(403)
    expect(res.body.status).toBe('error')
  })
})

describe('GET /api/customers/:id/payments', () => {
  let ownerToken: string
  let userToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    userToken = await UserTest.login()
    await CustomerTest.delete()
    await CustomerTest.delete('NIM-')
  })

  afterEach(async () => {
    await CustomerTest.delete()
    await CustomerTest.delete('NIM-')
    await UserTest.delete()
  })

  it('should return paginated list sorted by tanggalBayar desc by default', async () => {
    const c = await CustomerTest.create({ totalBayar: 999999, sudahBayar: 0, sisaBayar: 999999 })

    // 3 transaksi lama → baru
    await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 10000, tanggalBayar: '2024-01-01T00:00:00.000Z', catatan: 'A' })
    await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 20000, tanggalBayar: '2024-06-01T00:00:00.000Z', catatan: 'B' })
    await supertest(app)
      .post(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 30000, tanggalBayar: '2025-01-01T00:00:00.000Z', catatan: 'C' })

    const res = await supertest(app)
      .get(`/api/customers/${c.id}/payments`)
      .query({ page: 1, limit: 2 }) // 2 terbaru
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    const { items, pagination } = res.body.data
    expect(items.length).toBe(2)
    expect(items.map((x: any) => x.catatan)).toEqual(['C', 'B']) // default desc
    expect(pagination).toEqual(expect.objectContaining({ page: 1, limit: 2, total: 3, totalPages: 2 }))
  })

  it('should filter by date range (start & end)', async () => {
    const c = await CustomerTest.create({ totalBayar: 100000 })
    await supertest(app).post(`/api/customers/${c.id}/payments`).set('Authorization', `Bearer ${ownerToken}`).send({ amount: 10000, tanggalBayar: '2025-01-10', catatan: 'JAN' })
    await supertest(app).post(`/api/customers/${c.id}/payments`).set('Authorization', `Bearer ${ownerToken}`).send({ amount: 20000, tanggalBayar: '2025-03-10', catatan: 'MAR' })
    await supertest(app).post(`/api/customers/${c.id}/payments`).set('Authorization', `Bearer ${ownerToken}`).send({ amount: 30000, tanggalBayar: '2025-07-10', catatan: 'JUL' })

    const res = await supertest(app)
      .get(`/api/customers/${c.id}/payments`)
      .query({ start: '2025-03-01', end: '2025-06-30', limit: 10 })
      .set('Authorization', `Bearer ${ownerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.items.map((x: any) => x.catatan)).toEqual(['MAR'])
  })

  it('should return 404 when customer not found', async () => {
    const res = await supertest(app)
      .get('/api/customers/999999/payments')
      .set('Authorization', `Bearer ${ownerToken}`)
    expect(res.status).toBe(404)
    expect(res.body.status).toBe('error')
  })

  it('should return 401 when no token provided', async () => {
    const c = await CustomerTest.create()
    const res = await supertest(app).get(`/api/customers/${c.id}/payments`)
    expect(res.status).toBe(401)
    expect(res.body.status).toBe('error')
  })

  it('should forbid USER if route is OWNER-only', async () => {
    const c = await CustomerTest.create()
    const res = await supertest(app)
      .get(`/api/customers/${c.id}/payments`)
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
    expect(res.body.status).toBe('error')
  })
})
