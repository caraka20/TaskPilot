import supertest from 'supertest'
import app from '../src/app'
import { prismaClient } from '../src/config/database'
import { GajiTest, UserTest } from './test-util' 
import { SUCCESS_MESSAGES } from '../src/utils/success-messages'
import { ERROR_CODE, ERROR_DEFINITIONS } from '../src/utils/error-codes'

    describe('POST /api/gaji', () => {
    let ownerToken: string

    beforeEach(async () => {
        await UserTest.create()           // buat user 'raka20' (USER)
        ownerToken = await UserTest.loginOwner()
    })

    afterEach(async () => {
        await GajiTest.delete()
        await UserTest.delete()
    })

    it('should be able to create gaji', async () => {
        const response = await supertest(app)
        .post('/api/gaji')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            username: 'raka20',
            jumlahBayar: 100000,
            catatan: 'shift pagi',
        })

        expect(response.status).toBe(200) // atau 201 kalau controller-mu pakai Created
        expect(response.body.status).toBe('success')
        expect(response.body.data.id).toBeDefined()
    })

    it('should error to create gaji when username not found', async () => {
        const response = await supertest(app)
        .post('/api/gaji')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            username: 'tidakadauser',
            jumlahBayar: 50000,
            catatan: 'tidak valid',
        })

        expect(response.status).toBe(404)
        expect(response.body.status).toBe('error')
        // sesuaikan jika error handler mengembalikan code/message berbeda
        expect(response.body.message).toBe('User not found')
    })

    it('should error to create gaji when username is invalid', async () => {
        const response = await supertest(app)
        .post('/api/gaji')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            username: '', // invalid oleh Zod
            jumlahBayar: 50000,
            catatan: 'kosong username',
        })

        expect(response.status).toBe(400)
        expect(response.body.status).toBe('error')
        expect(response.body.message).toBe('Validation failed')
    })
    })

    describe('DELETE /api/gaji/:id', () => {
    let gajiId: number

    beforeEach(async () => {
        await UserTest.create()
        const gaji = await GajiTest.create()
        gajiId = gaji.id
    })

    afterEach(async () => {
        await GajiTest.delete()
        await UserTest.delete()
    })

    it('should be able to delete gaji by id as OWNER', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .delete(`/api/gaji/${gajiId}`)
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')
        expect(response.body.message).toBe(SUCCESS_MESSAGES.DELETED.GAJI)
    })

    it('should return an error if the gaji with the given id does not exist', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .delete('/api/gaji/999999') // asumsi ID ini tidak ada
        .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(404)
        expect(response.body.status).toBe('error')
        expect(response.body.message).toBe(ERROR_DEFINITIONS.NOT_FOUND.message)
    })

    it('should prevent USER role from deleting gaji', async () => {
        const tokenUser = await UserTest.login()
        const response = await supertest(app)
        .delete(`/api/gaji/${gajiId}`)
        .set('Authorization', `Bearer ${tokenUser}`)

        expect(response.status).toBe(403)
        expect(response.body.status).toBe('error')
    })

    it('should reject the request if no token is provided', async () => {
        const response = await supertest(app)
        .delete(`/api/gaji/${gajiId}`)

        expect(response.status).toBe(401)
        expect(response.body.status).toBe('error')
    })
    })

    describe('PATCH /api/gaji/:id', () => {
    let gajiId: number

    beforeEach(async () => {
        await UserTest.create()
        const gaji = await GajiTest.create()
        gajiId = gaji.id
    })

    afterEach(async () => {
        await GajiTest.delete()
        await UserTest.delete()
    })

    it('should allow OWNER to update jumlahBayar', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .patch(`/api/gaji/${gajiId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            jumlahBayar: 300000
        })

        expect(response.status).toBe(200)
        expect(response.body.status).toBe('success')
        expect(response.body.data.jumlahBayar).toBe(300000)
    })

    it('should allow OWNER to update catatan only', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .patch(`/api/gaji/${gajiId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            catatan: 'Update catatan revisi'
        })

        expect(response.status).toBe(200)
        expect(response.body.data.catatan).toBe('Update catatan revisi')
    })

    it('should return error if no field is provided (empty body)', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .patch(`/api/gaji/${gajiId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        // console.log(response.body);
        
        expect(response.status).toBe(400)
        expect(response.body.status).toBe('error')
        expect(response.body.message).toMatch("Validation failed")
    })

    it('should return validation error if jumlahBayar is invalid', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .patch(`/api/gaji/${gajiId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            jumlahBayar: 0
        })

        expect(response.status).toBe(400)
        expect(response.body.status).toBe('error')
        expect(response.body.message).toMatch("Validation failed")
    })

    it('should return not found if gaji does not exist', async () => {
        const token = await UserTest.loginOwner()
        const response = await supertest(app)
        .patch(`/api/gaji/999999`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            jumlahBayar: 100000
        })

        expect(response.status).toBe(404)
        expect(response.body.status).toBe('error')
        expect(response.body.message).toMatch(ERROR_DEFINITIONS.NOT_FOUND.message)
    })

    it('should prevent USER from updating gaji', async () => {
        const token = await UserTest.login()
        const response = await supertest(app)
        .patch(`/api/gaji/${gajiId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            jumlahBayar: 100000
        })

        expect(response.status).toBe(403)
        expect(response.body.status).toBe('error')
    })

    it('should return unauthorized if no token is provided', async () => {
        const response = await supertest(app)
        .patch(`/api/gaji/${gajiId}`)
        .send({
            jumlahBayar: 200000
        })

        expect(response.status).toBe(401)
        expect(response.body.status).toBe('error')
    })
    })

    describe('GET /api/gaji/me', () => {
        const username = 'raka20'
        const otherUsername = 'otheruser'

        let userToken: string
        let ownerToken: string
        let todayStr = ''
        let yestStr = ''

        beforeEach(async () => {
            // siapkan user default + owner
            await UserTest.create()              // buat user 'raka20' (USER)
            userToken = await UserTest.login()        // USER token
            ownerToken = await UserTest.loginOwner()  // OWNER token

            // pastikan otheruser ada sebelum seed salary (hindari FK violation)
            await GajiTest.ensureUser(otherUsername)

            // seed salary utk user aktif
            const { yesterday, today } = await GajiTest.seedYesterdayToday(username)

            // simpan YYYY-MM-DD utk filter asserts
            const yY = yesterday.getUTCFullYear()
            const yM = String(yesterday.getUTCMonth() + 1).padStart(2, '0')
            const yD = String(yesterday.getUTCDate()).padStart(2, '0')
            yestStr = `${yY}-${yM}-${yD}`

            const tY = today.getUTCFullYear()
            const tM = String(today.getUTCMonth() + 1).padStart(2, '0')
            const tD = String(today.getUTCDate()).padStart(2, '0')
            todayStr = `${tY}-${tM}-${tD}`

            // seed salary untuk user lain (verifikasi isolasi data)
            await GajiTest.createManyForUser(otherUsername, [
            { jumlahBayar: 9999, catatan: 'X' },
            ])
        })

        afterEach(async () => {
            // hapus salary dulu baru user agar tidak terkunci FK
            await GajiTest.deleteByUsers([username, otherUsername])
            await GajiTest.deleteUser(otherUsername)
            await UserTest.delete() // hapus user 'raka20'
        })

        it('should allow USER to view own salary history', async () => {
            const res = await supertest(app)
            .get('/api/gaji/me')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)

            expect(res.body.status).toBe('success')
            const items = res.body.data.items as Array<any>
            expect(Array.isArray(items)).toBe(true)
            expect(items.some(x => x.username !== username)).toBe(false)
            expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2)
        })

        it('should support pagination', async () => {
            const res = await supertest(app)
            .get('/api/gaji/me?limit=1&page=1&sort=desc')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)

            expect(res.body.status).toBe('success')
            expect(res.body.data.items.length).toBe(1)
            expect(res.body.data.pagination.page).toBe(1)
            expect(res.body.data.pagination.limit).toBe(1)
        })

        it('should filter by date range (tanggalBayar.gte)', async () => {
            const res = await supertest(app)
            .get(`/api/gaji/me?tanggalBayar.gte=${todayStr}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)

            expect(res.body.status).toBe('success')
            const items: Array<any> = res.body.data.items
            expect(items.length).toBeGreaterThanOrEqual(1)
            for (const it of items) {
            expect(new Date(it.tanggalBayar).toISOString().slice(0, 10) >= todayStr).toBe(true)
            expect(it.username).toBe(username)
            }
        })

        it('should filter by date range (tanggalBayar.lte)', async () => {
            const res = await supertest(app)
            .get(`/api/gaji/me?tanggalBayar.lte=${yestStr}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200)

            expect(res.body.status).toBe('success')
            const items: Array<any> = res.body.data.items
            expect(items.length).toBeGreaterThanOrEqual(1)
            for (const it of items) {
            expect(new Date(it.tanggalBayar).toISOString().slice(0, 10) <= yestStr).toBe(true)
            expect(it.username).toBe(username)
            }
        })

        it('should return 403 when OWNER tries to access', async () => {
            const res = await supertest(app)
            .get('/api/gaji/me')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(403)

            expect(res.body.status).toBe('error')
        })

        it('should return 401 when no token is provided', async () => {
            const res = await supertest(app)
            .get('/api/gaji/me')
            .expect(401)

            expect(res.body.status).toBe('error')
        })
    })