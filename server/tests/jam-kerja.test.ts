import supertest from 'supertest'
import app from '../src/app'
import { JamKerjaTest, UserTest } from './test-util' 
import { prismaClient } from '../src/config/database'
import { ERROR_DEFINITIONS } from '../src/utils/error-codes'
import { SUCCESS_MESSAGES } from '../src/utils/success-messages'

describe('POST /api/jam-kerja/start', () => {
  beforeEach(async () => {
    await UserTest.create()
  })

  afterEach(async () => {
    await prismaClient.jamKerja.deleteMany()
    await UserTest.delete()
    await JamKerjaTest.delete()
  })

  it('should start new jam kerja if no active session exists', async () => {
    const token = await UserTest.login()

    const response = await supertest(app)
      .post('/api/jam-kerja/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'raka20',
    })

    // console.log(response.body)
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.message).toBe('Jam kerja dimulai')
    expect(response.body.data).toHaveProperty('id')
    expect(response.body.data).toHaveProperty('username', 'raka20')
    expect(response.body.data).toHaveProperty('jamMulai')
    expect(response.body.data.status).toBe('AKTIF')
  })

  it('should not allow starting jam kerja if already active', async () => {
    const token = await UserTest.login()

    await JamKerjaTest.createAktif()

    const response = await supertest(app)
      .post('/api/jam-kerja/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'raka20',
      })

    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
  })

  it('should reject request if no token is provided', async () => {
    const response = await supertest(app)
      .post('/api/jam-kerja/start')
      .send({
        username: 'user-test',
      })

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
  })

  it('should reject request if role is not USER', async () => {
    const token = await UserTest.loginOwner()

    const response = await supertest(app)
      .post('/api/jam-kerja/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'owner-test',
      })

    expect(response.status).toBe(403)
    expect(response.body.status).toBe('error')
  })
})

describe('PATCH /api/jam-kerja/:id/end', () => {
        let token: string
        let jamKerjaId: number

        beforeEach(async () => {
            await UserTest.create()
            token = await UserTest.login()

            const jamKerja = await JamKerjaTest.createAktif() // jam kerja aktif
            jamKerjaId = jamKerja.id
        })

        afterEach(async () => {
            await prismaClient.jamKerja.deleteMany()
            await UserTest.delete()
            await JamKerjaTest.delete()
        })

        it('should end an active jam kerja session', async () => {
            const response = await supertest(app)
            .patch(`/api/jam-kerja/${jamKerjaId}/end`)
            .set('Authorization', `Bearer ${token}`)

            console.log(response.body);
            
            expect(response.status).toBe(200)
            expect(response.body.status).toBe('success')
            expect(response.body.message).toBe(SUCCESS_MESSAGES.JAM_KERJA.END)
            expect(response.body.data).toHaveProperty('totalJam')
            expect(response.body.data).toHaveProperty('jamSelesai')
        })

        it('should return 404 if jam kerja not found', async () => {
            const response = await supertest(app)
            .patch('/api/jam-kerja/999999/end')
            .set('Authorization', `Bearer ${token}`)
            console.log(response.body);
            
            expect(response.status).toBe(404)
            expect(response.body.status).toBe('error')
            expect(response.body.message).toBe(ERROR_DEFINITIONS.NOT_FOUND.message)
        })

        it('should return error if jam kerja already ended', async () => {
            await JamKerjaTest.end(jamKerjaId)
            const response = await supertest(app)
            .patch(`/api/jam-kerja/${jamKerjaId}/end`)
            .set('Authorization', `Bearer ${token}`)

            expect(response.status).toBe(400)
            expect(response.body.status).toBe('error')
            expect(response.body.message).toBe(ERROR_DEFINITIONS.BAD_REQUEST.message)
        })

        it('should return unauthorized if no token is provided', async () => {
            const response = await supertest(app)
            .patch(`/api/jam-kerja/${jamKerjaId}/end`)

            expect(response.status).toBe(401)
            expect(response.body.status).toBe('error')
        })

        it('should reject request if role is not USER', async () => {
            const ownerToken = await UserTest.loginOwner()

            const response = await supertest(app)
            .patch(`/api/jam-kerja/${jamKerjaId}/end`)
            .set('Authorization', `Bearer ${ownerToken}`)

            expect(response.status).toBe(403)
            expect(response.body.status).toBe('error')
        })
})

describe('GET /api/jam-kerja', () => {
  beforeEach(async () => {
    await UserTest.create()
    await JamKerjaTest.createMany() // buat 2–3 jam kerja selesai untuk raka20
  })

  afterEach(async () => {
    await prismaClient.jamKerja.deleteMany()
    await UserTest.delete()
  })

  it('should return jam kerja history for OWNER', async () => {
    const token = await UserTest.loginOwner()
    const response = await supertest(app)
      .get('/api/jam-kerja?username=raka20')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')

    const data = response.body.data
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)

    data.forEach((item: any) => {
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('username', 'raka20')
      expect(item).toHaveProperty('jamMulai')
      expect(item).toHaveProperty('jamSelesai')
      expect(item).toHaveProperty('totalJam')
      expect(item).toHaveProperty('status')
      expect(item).toHaveProperty('tanggal')
    })
  })

  it('should allow USER to view their own jam kerja', async () => {
    const token = await UserTest.login()
    const response = await supertest(app)
      .get('/api/jam-kerja?username=raka20')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.every((j: any) => j.username === 'raka20')).toBe(true)
  })

  it('should forbid USER from accessing other user\'s jam kerja', async () => {
    const token = await UserTest.login()
    const response = await supertest(app)
      .get('/api/jam-kerja?username=owner-test')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body.status).toBe('error')
  })

  it('should return 400 if username is missing', async () => {
    const token = await UserTest.loginOwner()
    const response = await supertest(app)
      .get('/api/jam-kerja')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
    expect(response.body.message).toMatch(/validation/i)
  })

  it('should return 401 if no token provided', async () => {
    const response = await supertest(app)
      .get('/api/jam-kerja?username=raka20')

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
  })

  it('should return empty array if user has no jam kerja', async () => {
    await prismaClient.jamKerja.deleteMany()
    const token = await UserTest.loginOwner()

    const response = await supertest(app)
      .get('/api/jam-kerja?username=raka20')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBe(0)
  })
})

describe('GET /api/jam-kerja/rekap', () => {
    beforeEach(async () => {
        await UserTest.create()
        await JamKerjaTest.createMany() // 2–3 jam kerja selesai untuk raka20
    })

    afterEach(async () => {
        await prismaClient.jamKerja.deleteMany()
        await UserTest.delete()
    })

    it('should return weekly rekap for OWNER', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .get('/api/jam-kerja/rekap?username=raka20&period=minggu')
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')

        const data = response.body.data
        console.log(response.body);
        
        expect(data).toHaveProperty('username', 'raka20')
        expect(data).toHaveProperty('totalJam')
        expect(typeof data.totalJam).toBe('number')
        expect(data).toHaveProperty('periode', 'minggu')
    })

    it('should return monthly rekap for OWNER', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .get('/api/jam-kerja/rekap?username=raka20&period=bulan')
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')
        expect(response.body.data.periode).toBe('bulan')
    })

    it('should return rekap for USER if accessing self', async () => {
        const token = await UserTest.login()
        const response = await supertest(app)
        .get('/api/jam-kerja/rekap?username=raka20&period=minggu')
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')
        expect(response.body.data.username).toBe('raka20')
    })

    it('should forbid USER from accessing other user\'s rekap', async () => {
        const token = await UserTest.login()
        const response = await supertest(app)
        .get('/api/jam-kerja/rekap?username=owner-test&period=minggu')
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(403)
        expect(response.body.status).toBe('error')
    })

    it('should return 400 if period is invalid', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .get('/api/jam-kerja/rekap?username=raka20&period=salah')
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(400)
        expect(response.body.status).toBe('error')
        expect(response.body.message).toMatch(/validation/i)
    })

    it('should return 400 if username missing', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .get('/api/jam-kerja/rekap?period=minggu')
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(400)
        expect(response.body.status).toBe('error')
    })

    it('should return 401 if no token provided', async () => {
        const response = await supertest(app)
        .get('/api/jam-kerja/rekap?username=raka20&period=minggu')

        expect(response.status).toBe(401)
        expect(response.body.status).toBe('error')
    })

    it('should return 0 if user has no jam kerja in that period', async () => {
        await prismaClient.jamKerja.deleteMany()
        const token = await UserTest.loginOwner()

        const response = await supertest(app)
        .get('/api/jam-kerja/rekap?username=raka20&period=minggu')
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')
        expect(response.body.data.totalJam).toBe(0)
    })
})

describe('GET /api/jam-kerja/aktif', () => {
  beforeEach(async () => {
    await UserTest.create()
    await JamKerjaTest.delete()
  })

  afterEach(async () => {
    await JamKerjaTest.delete()
    await UserTest.delete()
  })

  it('should return rekap AKTIF jam kerja for OWNER', async () => {
    await JamKerjaTest.createAktif() // default 'raka20'

    const token = await UserTest.loginOwner()
    const response = await supertest(app)
      .get('/api/jam-kerja/aktif')
      .query({ username: 'raka20', period: 'minggu' })
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')

    const data = response.body.data
    expect(data).toHaveProperty('username', 'raka20')
    expect(typeof data.totalJam).toBe('number')
    expect(data).toHaveProperty('periode', 'minggu')
  })

  it('should return 400 if username is missing', async () => {
    const token = await UserTest.loginOwner()
    const response = await supertest(app)
      .get('/api/jam-kerja/aktif')
      .query({ period: 'minggu' }) // username tidak dikirim
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
  })

  it('should return 403 if USER tries to access other user data', async () => {
    const token = await UserTest.login()
    const response = await supertest(app)
      .get('/api/jam-kerja/aktif')
      .query({ username: 'otheruser', period: 'minggu' })
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body.status).toBe('error')
  })

  it('should allow USER to access their own data', async () => {
    await JamKerjaTest.createAktif()

    const token = await UserTest.login()
    const response = await supertest(app)
      .get('/api/jam-kerja/aktif')
      .query({ username: 'raka20', period: 'minggu' })
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('success')
    expect(response.body.data.username).toBe('raka20')
  })

  it('should return 400 if period is invalid', async () => {
    const token = await UserTest.loginOwner()
    const response = await supertest(app)
      .get('/api/jam-kerja/aktif')
      .query({ username: 'raka20', period: 'tahun' }) // ❌ invalid
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(400)
    expect(response.body.status).toBe('error')
  })

  it('should return 401 if no token provided', async () => {
    const response = await supertest(app)
      .get('/api/jam-kerja/aktif')
      .query({ username: 'raka20', period: 'minggu' })

    expect(response.status).toBe(401)
    expect(response.body.status).toBe('error')
  })
})

describe('POST Pause/Resume', () => {
  let tokenUser: string
  let tokenOwner: string

  beforeEach(async () => {
    await UserTest.create()
    tokenUser = await UserTest.login()
    tokenOwner = await UserTest.loginOwner?.()
    await JamKerjaTest.delete()
  })

  afterEach(async () => {
    await JamKerjaTest.delete()
    await UserTest.delete()
  })

  it('USER can pause active session', async () => {
    const sesi = await JamKerjaTest.createAktif() // default 'raka20'
    const res = await supertest(app)
      .post(`/api/jam-kerja/${sesi.id}/pause`)
      .set('Authorization', `Bearer ${tokenUser}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.data.status).toBe('JEDA')
  })

  it('USER can resume paused session', async () => {
    const sesi = await JamKerjaTest.createJeda()
    const res = await supertest(app)
      .post(`/api/jam-kerja/${sesi.id}/resume`)
      .set('Authorization', `Bearer ${tokenUser}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.data.status).toBe('AKTIF')
  })

  it('should return 403 if user tries to pause other user session', async () => {
    // buat sesi milik orang lain
    await JamKerjaTest.createAktif('otheruser')
    const token = await UserTest.login() // login sebagai 'raka20'
    // cari id sesi otheruser (opsional: bisa store ID dari createAktif di atas)
    // demi ringkas, buat lagi milik 'raka20' agar pasti 200 vs 403 dipisah
    const foreign = await JamKerjaTest.createAktif('otheruser')
    const res = await supertest(app)
      .post(`/api/jam-kerja/${foreign.id}/pause`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(res.body.status).toBe('error')
  })

  it('should return 401 without token', async () => {
    const sesi = await JamKerjaTest.createAktif()
    const res = await supertest(app).post(`/api/jam-kerja/${sesi.id}/pause`)
    expect(res.status).toBe(401)
    expect(res.body.status).toBe('error')
  })
})


