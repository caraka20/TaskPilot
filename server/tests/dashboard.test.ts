import supertest from 'supertest'
import app from '../src/app'
import { prismaClient } from '../src/config/database'
import { GajiTest, JamKerjaTest, UserTest } from './test-util'

describe('GET /api/dashboard/summary', () => {
  let ownerToken: string

  beforeEach(async () => {
    await UserTest.create()
    ownerToken = await UserTest.loginOwner()
    await JamKerjaTest.delete()
    await GajiTest.delete()
  })

  afterEach(async () => {
    await JamKerjaTest.delete()
    await GajiTest.delete()
    await UserTest.delete()
  })

  it('should return summary numbers for OWNER', async () => {
    // seed: aktif, jeda, selesai (hari ini), dan gaji bulan ini
    await JamKerjaTest.createAktif('raka20')
    await JamKerjaTest.createJeda('raka20')
    await JamKerjaTest.createMany('raka20') // 2 selesai @ totalJam=1 → total hari ini >= 2

    // gaji bulan berjalan
    await prismaClient.salary.createMany({
      data: [
        { username: 'raka20', jumlahBayar: 100000, catatan: 'bonus', tanggalBayar: new Date() },
        { username: 'raka20', jumlahBayar: 50000,  catatan: 'tambahan', tanggalBayar: new Date() },
      ]
    })

    const res = await supertest(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${ownerToken}`)
      
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')

    const d = res.body.data
    expect(typeof d.totalAktif).toBe('number')
    expect(typeof d.totalJeda).toBe('number')
    expect(typeof d.totalJamHariIni).toBe('number')
    expect(typeof d.payrollBulanBerjalan).toBe('number')

    expect(d.totalAktif).toBeGreaterThanOrEqual(1)
    expect(d.totalJeda).toBeGreaterThanOrEqual(1)
    expect(d.totalJamHariIni).toBeGreaterThanOrEqual(2)
    expect(d.payrollBulanBerjalan).toBeGreaterThanOrEqual(150000)
  })

  it('should return 401 without token', async () => {
    const res = await supertest(app).get('/api/dashboard/summary')
    expect(res.status).toBe(401)
    expect(res.body.status).toBe('error')
  })

  it('should return 403 for USER role', async () => {
    const token = await UserTest.login()
    const res = await supertest(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(res.body.status).toBe('error')
  })
})
