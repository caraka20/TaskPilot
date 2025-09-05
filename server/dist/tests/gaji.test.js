"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests/gaji.test.ts
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const test_util_1 = require("./test-util");
const success_messages_1 = require("../src/utils/success-messages");
const error_codes_1 = require("../src/utils/error-codes");
const prisma_1 = require("../src/generated/prisma");
/* util kecil untuk set / restore konfigurasi global gajiPerJam */
async function setGlobalRate(rate) {
    await database_1.prismaClient.konfigurasi.upsert({
        where: { id: 1 },
        update: { gajiPerJam: rate },
        create: { id: 1, gajiPerJam: rate },
    });
}
describe('POST /api/gaji', () => {
    let ownerToken;
    const USERNAME = 'raka20';
    const RATE = 10000; // Rp10.000 per jam
    beforeEach(async () => {
        await test_util_1.UserTest.create(); // buat user 'raka20' (USER)
        ownerToken = await test_util_1.UserTest.loginOwner();
        // bersih-bersih salary & jam
        await database_1.prismaClient.salary.deleteMany({ where: { username: USERNAME } });
        await database_1.prismaClient.jamKerja.deleteMany({ where: { username: USERNAME } });
        // set rate global deterministik
        await setGlobalRate(RATE);
    });
    afterEach(async () => {
        await database_1.prismaClient.salary.deleteMany({ where: { username: USERNAME } });
        await database_1.prismaClient.jamKerja.deleteMany({ where: { username: USERNAME } });
        await test_util_1.UserTest.delete();
    });
    it('should reject create gaji when role is USER (forbidden)', async () => {
        const userToken = await test_util_1.UserTest.login();
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/gaji')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ username: USERNAME, jumlahBayar: 100000, catatan: 'siang' });
        expect(res.status).toBe(403);
        expect(res.body.status).toBe('error');
    });
    it('should return 401 if no token provided', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/gaji')
            .send({ username: USERNAME, jumlahBayar: 100000, catatan: 'tanpa token' });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe('error');
    });
    it('should error when jumlahBayar <= 0', async () => {
        const res1 = await (0, supertest_1.default)(app_1.default)
            .post('/api/gaji')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ username: USERNAME, jumlahBayar: 0, catatan: 'nol' });
        expect(res1.status).toBe(400);
        expect(res1.body.status).toBe('error');
        const res2 = await (0, supertest_1.default)(app_1.default)
            .post('/api/gaji')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ username: USERNAME, jumlahBayar: -5000, catatan: 'negatif' });
        expect(res2.status).toBe(400);
        expect(res2.body.status).toBe('error');
    });
    it('should error when jumlahBayar exceeds remaining salary', async () => {
        // upahKeseluruhan = totalJam (SELESAI) × RATE
        // Seed: totalJam = 3 jam → upah = 30.000
        await database_1.prismaClient.jamKerja.create({
            data: {
                username: USERNAME,
                jamMulai: new Date(Date.now() - 3.5 * 3600000),
                jamSelesai: new Date(Date.now() - 0.5 * 3600000),
                totalJam: 3,
                status: prisma_1.StatusKerja.SELESAI,
                tanggal: new Date(),
            },
        });
        // Sudah dibayar = 15.000 → sisa = 15.000
        await database_1.prismaClient.salary.create({
            data: { username: USERNAME, jumlahBayar: 15000, catatan: 'awal', tanggalBayar: new Date() },
        });
        // Coba bayar 16.000 (melebihi sisa 15.000) → 400
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/gaji')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ username: USERNAME, jumlahBayar: 16000, catatan: 'melebihi' });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe('error');
        expect(String(res.body.message || '')).toMatch(/melebihi sisa/i);
    });
    it('should succeed when jumlahBayar equals remaining salary', async () => {
        // totalJam = 3 jam → upah = 30.000
        await database_1.prismaClient.jamKerja.create({
            data: {
                username: USERNAME,
                jamMulai: new Date(Date.now() - 3 * 3600000),
                jamSelesai: new Date(),
                totalJam: 3,
                status: prisma_1.StatusKerja.SELESAI,
                tanggal: new Date(),
            },
        });
        // sudah dibayar 15.000 → sisa 15.000
        await database_1.prismaClient.salary.create({
            data: { username: USERNAME, jumlahBayar: 15000, catatan: 'awal', tanggalBayar: new Date() },
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/gaji')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ username: USERNAME, jumlahBayar: 15000, catatan: 'pas sisa' });
        expect(res.status).toBe(200); // 201 jika controller pakai Created
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('id');
        expect(Number(res.body.data.jumlahBayar)).toBe(15000);
    });
    it('should create gaji without catatan (optional field)', async () => {
        // Pastikan sisa cukup besar: totalJam = 3 jam → upah 30.000, belum ada pembayaran
        await database_1.prismaClient.jamKerja.create({
            data: {
                username: USERNAME,
                jamMulai: new Date(Date.now() - 3 * 3600000),
                jamSelesai: new Date(),
                totalJam: 3,
                status: prisma_1.StatusKerja.SELESAI,
                tanggal: new Date(),
            },
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/gaji')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ username: USERNAME, jumlahBayar: 12345 }); // tanpa catatan
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('id');
    });
});
describe('DELETE /api/gaji/:id', () => {
    let gajiId;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        const gaji = await test_util_1.GajiTest.create();
        gajiId = gaji.id;
    });
    afterEach(async () => {
        await test_util_1.GajiTest.delete();
        await test_util_1.UserTest.delete();
    });
    it('should be able to delete gaji by id as OWNER', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.message).toBe(success_messages_1.SUCCESS_MESSAGES.DELETED.GAJI);
    });
    it('should return an error if the gaji with the given id does not exist', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .delete('/api/gaji/999999')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe(error_codes_1.ERROR_DEFINITIONS.NOT_FOUND.message);
    });
    it('should prevent USER role from deleting gaji', async () => {
        const tokenUser = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${tokenUser}`);
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
    it('should reject the request if no token is provided', async () => {
        const response = await (0, supertest_1.default)(app_1.default).delete(`/api/gaji/${gajiId}`);
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
});
describe('PATCH /api/gaji/:id', () => {
    let gajiId;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        const gaji = await test_util_1.GajiTest.create(); // default: username 'raka20'
        gajiId = gaji.id;
    });
    afterEach(async () => {
        await test_util_1.GajiTest.delete();
        await test_util_1.UserTest.delete();
    });
    it('should allow OWNER to update jumlahBayar', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        // Ambil baris target utk tahu username
        const target = await database_1.prismaClient.salary.findUnique({ where: { id: gajiId } });
        const username = target?.username ?? 'raka20';
        // Pastikan sisa mencukupi:
        // - totalGaji besar
        // - tidak ada salary lain selain baris target
        await database_1.prismaClient.user.update({
            where: { username },
            data: { totalGaji: 1000000 },
        });
        await database_1.prismaClient.salary.deleteMany({
            where: { username, NOT: { id: gajiId } },
        });
        // Sekarang update ke 300_000 -> harus OK
        const response = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ jumlahBayar: 300000 });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.jumlahBayar).toBe(300000);
    });
    it('should allow OWNER to update catatan only', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ catatan: 'Update catatan revisi' });
        expect(response.status).toBe(200);
        expect(response.body.data.catatan).toBe('Update catatan revisi');
    });
    it('should return error if no field is provided (empty body)', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toMatch('Validation failed');
    });
    it('should return validation error if jumlahBayar is invalid', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ jumlahBayar: 0 });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toMatch('Validation failed');
    });
    it('should return not found if gaji does not exist', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/999999`)
            .set('Authorization', `Bearer ${token}`)
            .send({ jumlahBayar: 100000 });
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toMatch(error_codes_1.ERROR_DEFINITIONS.NOT_FOUND.message);
    });
    it('should prevent USER from updating gaji', async () => {
        const token = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ jumlahBayar: 100000 });
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
    it('should return unauthorized if no token is provided', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/${gajiId}`)
            .send({ jumlahBayar: 200000 });
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
    // 🔴 BARU: validasi "tidak boleh melebihi sisa" saat UPDATE
    it('should error when updated jumlahBayar exceeds remaining salary (exclude current row)', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        // Ambil baris target & user-nya
        const target = await database_1.prismaClient.salary.findUnique({ where: { id: gajiId } });
        const username = target?.username ?? 'raka20';
        // Skema sisa (tanpa menghitung baris target):
        //   totalGaji(user) = 180_000
        //   ada salary lain (s2) = 150_000
        //   => remaining = 180_000 - 150_000 = 30_000
        await database_1.prismaClient.user.update({
            where: { username },
            data: { totalGaji: 180000 },
        });
        await database_1.prismaClient.salary.create({
            data: { username, jumlahBayar: 150000, catatan: 'seed-s2' },
        });
        // pastikan nilai awal target ada (bebas)
        await database_1.prismaClient.salary.update({
            where: { id: gajiId },
            data: { jumlahBayar: 40000, catatan: 'seed-s1 (target)' },
        });
        // Coba set ke 35_000 → harus 400 karena remaining cuma 30_000
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ jumlahBayar: 35000 });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe('error');
        // service mengirim message / errors; cek salah satu mengandung "melebihi sisa"
        const msg = String(res.body.errors ?? res.body.message ?? '');
        expect(msg).toMatch(/melebihi sisa/i);
    });
    // 🟢 BARU: boleh kalau tepat sama dengan sisa
    it('should succeed when updated jumlahBayar equals remaining salary', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const target = await database_1.prismaClient.salary.findUnique({ where: { id: gajiId } });
        const username = target?.username ?? 'raka20';
        // Setup sama: remaining = 30_000
        await database_1.prismaClient.user.update({
            where: { username },
            data: { totalGaji: 180000 },
        });
        await database_1.prismaClient.salary.deleteMany({ where: { username } }); // biar bersih & deterministik
        const s2 = await database_1.prismaClient.salary.create({
            data: { username, jumlahBayar: 150000, catatan: 'seed-s2' },
        });
        const s1 = await database_1.prismaClient.salary.create({
            data: { username, jumlahBayar: 40000, catatan: 'seed-s1 (target)' },
        });
        // gunakan id baru yang barusan dibuat supaya pasti konsisten
        gajiId = s1.id;
        // Update tepat ke 30_000 → OK
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/gaji/${gajiId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ jumlahBayar: 30000 });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(Number(res.body.data.jumlahBayar)).toBe(30000);
    });
});
describe('GET /api/gaji/me', () => {
    const username = 'raka20';
    const otherUsername = 'otheruser';
    let userToken;
    let ownerToken;
    let todayStr = '';
    let yestStr = '';
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        userToken = await test_util_1.UserTest.login();
        ownerToken = await test_util_1.UserTest.loginOwner();
        await test_util_1.GajiTest.ensureUser(otherUsername);
        const { yesterday, today } = await test_util_1.GajiTest.seedYesterdayToday(username);
        const yY = yesterday.getUTCFullYear();
        const yM = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
        const yD = String(yesterday.getUTCDate()).padStart(2, '0');
        yestStr = `${yY}-${yM}-${yD}`;
        const tY = today.getUTCFullYear();
        const tM = String(today.getUTCMonth() + 1).padStart(2, '0');
        const tD = String(today.getUTCDate()).padStart(2, '0');
        todayStr = `${tY}-${tM}-${tD}`;
        await test_util_1.GajiTest.createManyForUser(otherUsername, [{ jumlahBayar: 9999, catatan: 'X' }]);
    });
    afterEach(async () => {
        await test_util_1.GajiTest.deleteByUsers([username, otherUsername]);
        await test_util_1.GajiTest.deleteUser(otherUsername);
        await test_util_1.UserTest.delete();
    });
    it('should allow USER to view own salary history', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/me')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        const items = res.body.data.items;
        expect(Array.isArray(items)).toBe(true);
        expect(items.some(x => x.username !== username)).toBe(false);
        expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
    });
    it('should support pagination', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/me?limit=1&page=1&sort=desc')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.items.length).toBe(1);
        expect(res.body.data.pagination.page).toBe(1);
        expect(res.body.data.pagination.limit).toBe(1);
    });
    it('should filter by date range (tanggalBayar.gte)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/gaji/me?tanggalBayar.gte=${todayStr}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        const items = res.body.data.items;
        expect(items.length).toBeGreaterThanOrEqual(1);
        for (const it of items) {
            expect(new Date(it.tanggalBayar).toISOString().slice(0, 10) >= todayStr).toBe(true);
            expect(it.username).toBe(username);
        }
    });
    it('should filter by date range (tanggalBayar.lte)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/gaji/me?tanggalBayar.lte=${yestStr}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        const items = res.body.data.items;
        expect(items.length).toBeGreaterThanOrEqual(1);
        for (const it of items) {
            expect(new Date(it.tanggalBayar).toISOString().slice(0, 10) <= yestStr).toBe(true);
            expect(it.username).toBe(username);
        }
    });
    it('should return 403 when OWNER tries to access', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/me')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(403);
        expect(res.body.status).toBe('error');
    });
    it('should return 401 when no token is provided', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/gaji/me').expect(401);
        expect(res.body.status).toBe('error');
    });
});
describe('GET /api/gaji/summary', () => {
    let ownerToken;
    let userToken;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        ownerToken = await test_util_1.UserTest.loginOwner();
        userToken = await test_util_1.UserTest.login();
        await test_util_1.JamKerjaTest.createMany(); // seed selesai
        await test_util_1.GajiTest.createManyForUser('raka20', [
            { jumlahBayar: 10000, catatan: 'seed-1' },
            { jumlahBayar: 20000, catatan: 'seed-2' },
        ]);
    });
    afterEach(async () => {
        await database_1.prismaClient.salary.deleteMany();
        await database_1.prismaClient.jamKerja.deleteMany();
        await test_util_1.UserTest.delete();
    });
    it('should return TOTAL (all-time) summary for OWNER', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/summary?period=total')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        const data = res.body.data;
        expect(data).toHaveProperty('period', 'total');
        expect(typeof data.totalGaji).toBe('number');
        expect(typeof data.totalDibayar).toBe('number');
        expect(typeof data.belumDibayar).toBe('number');
        expect(data.belumDibayar).toBeCloseTo(Math.max(0, data.totalGaji - data.totalDibayar), 6);
    });
    it('should support period=minggu (this week)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/summary?period=minggu')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        const d = res.body.data;
        expect(d.period).toBe('minggu');
    });
    it('should support period=bulan (this month)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/summary?period=bulan')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        const d = res.body.data;
        expect(d.period).toBe('bulan');
    });
    it('should accept legacy scope=all and map to period=total', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/summary?scope=all')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.period).toBe('total');
    });
    it('should return 403 when USER tries to access', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/summary?period=total')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(403);
        expect(res.body.status).toBe('error');
    });
    it('should return 401 when no token provided', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/gaji/summary?period=total').expect(401);
        expect(res.body.status).toBe('error');
    });
});
describe('GET /api/gaji/me/summary', () => {
    const username = 'raka20';
    const otherUsername = 'otheruser';
    let userToken = '';
    let ownerToken = '';
    // snapshot konfigurasi sebelum test agar bisa di-restore
    let cfgBefore = null;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        userToken = await test_util_1.UserTest.login();
        ownerToken = await test_util_1.UserTest.loginOwner();
        await test_util_1.GajiTest.ensureUser(otherUsername);
        // snapshot & kunci rate global
        const cfg = await database_1.prismaClient.konfigurasi.findUnique({ where: { id: 1 } });
        cfgBefore = cfg
            ? {
                gajiPerJam: cfg.gajiPerJam,
                batasJedaMenit: cfg.batasJedaMenit,
                jedaOtomatisAktif: cfg.jedaOtomatisAktif,
            }
            : null;
        await setGlobalRate(10000);
        // Seed jamKerja SELESAI utk user utama: 1.25 + 2.5 = 3.75 jam
        await database_1.prismaClient.jamKerja.createMany({
            data: [
                {
                    username,
                    jamMulai: new Date(Date.now() - 4 * 3600000),
                    jamSelesai: new Date(Date.now() - 2.75 * 3600000),
                    totalJam: 1.25,
                    status: prisma_1.StatusKerja.SELESAI,
                    tanggal: new Date(),
                },
                {
                    username,
                    jamMulai: new Date(Date.now() - 2.5 * 3600000),
                    jamSelesai: new Date(),
                    totalJam: 2.5,
                    status: prisma_1.StatusKerja.SELESAI,
                    tanggal: new Date(),
                },
            ],
        });
        // Seed salary user utama: total 15.000
        await database_1.prismaClient.salary.createMany({
            data: [
                { username, jumlahBayar: 10000, catatan: 'A', tanggalBayar: new Date() },
                { username, jumlahBayar: 5000, catatan: 'B', tanggalBayar: new Date() },
            ],
        });
        // Data user lain (isolasi)
        await database_1.prismaClient.jamKerja.create({
            data: {
                username: otherUsername,
                jamMulai: new Date(Date.now() - 3600000),
                jamSelesai: new Date(),
                totalJam: 3,
                status: prisma_1.StatusKerja.SELESAI,
                tanggal: new Date(),
            },
        });
        await database_1.prismaClient.salary.create({
            data: { username: otherUsername, jumlahBayar: 99999, catatan: 'X', tanggalBayar: new Date() },
        });
    });
    afterEach(async () => {
        await database_1.prismaClient.salary.deleteMany({ where: { username: { in: [username, otherUsername] } } });
        await database_1.prismaClient.jamKerja.deleteMany({ where: { username: { in: [username, otherUsername] } } });
        await test_util_1.GajiTest.deleteUser(otherUsername);
        await test_util_1.UserTest.delete();
        if (cfgBefore) {
            await database_1.prismaClient.konfigurasi.upsert({
                where: { id: 1 },
                update: {
                    gajiPerJam: cfgBefore.gajiPerJam,
                    batasJedaMenit: cfgBefore.batasJedaMenit,
                    jedaOtomatisAktif: cfgBefore.jedaOtomatisAktif,
                },
                create: {
                    id: 1,
                    gajiPerJam: cfgBefore.gajiPerJam,
                    batasJedaMenit: cfgBefore.batasJedaMenit,
                    jedaOtomatisAktif: cfgBefore.jedaOtomatisAktif,
                },
            });
        }
    });
    it('should return correct summary for the logged-in USER', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/me/summary')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        expect(res.body.status).toBe('success');
        const s = res.body.data;
        // totalJam = 3.75, gajiPerJam = 10_000 → upahKeseluruhan = 37_500
        // totalDiterima = 15_000 → belumDibayar = 22_500
        expect(s.username).toBe(username);
        expect(Number(s.totalJam)).toBeCloseTo(3.75, 2);
        expect(s.gajiPerJam).toBe(10000);
        expect(Number(s.upahKeseluruhan)).toBeCloseTo(37500, 2);
        expect(Number(s.totalDiterima)).toBeCloseTo(15000, 2);
        expect(Number(s.belumDibayar)).toBeCloseTo(22500, 2);
    });
    it('should not include other user data in the summary', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/me/summary')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        const s = res.body.data;
        expect(Number(s.totalJam)).not.toBeCloseTo(3, 2);
        expect(Number(s.totalDiterima)).not.toBeCloseTo(99999, 2);
    });
    it('should return 403 when OWNER calls the endpoint', async () => {
        await (0, supertest_1.default)(app_1.default)
            .get('/api/gaji/me/summary')
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(403);
    });
    it('should return 401 when no token provided', async () => {
        await (0, supertest_1.default)(app_1.default).get('/api/gaji/me/summary').expect(401);
    });
});
