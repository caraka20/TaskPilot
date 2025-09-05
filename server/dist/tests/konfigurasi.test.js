"use strict";
// tests/konfigurasi.test.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const test_util_1 = require("./test-util");
describe('GET /api/konfigurasi', () => {
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        await test_util_1.KonfigurasiTest.create();
    });
    afterEach(async () => {
        await test_util_1.KonfigurasiTest.delete();
        await test_util_1.UserTest.delete();
    });
    it('should return konfigurasi for OWNER', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi')
            .set('Authorization', `Bearer ${token}`);
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data).toHaveProperty('batasJedaMenit');
        expect(response.body.data).toHaveProperty('jedaOtomatisAktif');
        expect(response.body.data).toHaveProperty('gajiPerJam');
    });
    it('should reject request without token', async () => {
        const response = await (0, supertest_1.default)(app_1.default).get('/api/konfigurasi');
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
    it('should forbid USER from accessing konfigurasi', async () => {
        const token = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
});
describe('PUT /api/konfigurasi', () => {
    beforeEach(async () => {
        await test_util_1.KonfigurasiTest.create();
        await test_util_1.UserTest.create();
    });
    afterEach(async () => {
        await test_util_1.KonfigurasiTest.delete();
        await test_util_1.UserTest.delete();
    });
    it('should allow OWNER to update konfigurasi', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi')
            .set('Authorization', `Bearer ${token}`)
            .send({
            gajiPerJam: 15000,
            batasJedaMenit: 10,
            jedaOtomatisAktif: false,
        });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data).toHaveProperty('gajiPerJam', 15000);
        expect(response.body.data).toHaveProperty('batasJedaMenit', 10);
        expect(response.body.data).toHaveProperty('jedaOtomatisAktif', false);
    });
    it('should return 400 for invalid input', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi')
            .set('Authorization', `Bearer ${token}`)
            .send({
            gajiPerJam: -1, // invalid
            batasJedaMenit: 'lima', // invalid
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toMatch(/Validation failed/i);
    });
    it('should reject if user is not OWNER', async () => {
        const token = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi')
            .set('Authorization', `Bearer ${token}`)
            .send({
            gajiPerJam: 20000,
        });
        // console.log(response.body);
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
    it('should reject if no token is provided', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi')
            .send({
            gajiPerJam: 20000,
        });
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
});
describe('GET /api/konfigurasi/effective', () => {
    beforeEach(async () => {
        await test_util_1.KonfigurasiTest.create();
        await test_util_1.UserTest.create();
    });
    afterEach(async () => {
        await test_util_1.KonfigurasiTest.delete();
        await test_util_1.UserTest.delete();
    });
    it('should return effective = global for OWNER when no override', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi/effective')
            .set('Authorization', `Bearer ${token}`)
            .query({ username: 'raka20' }); // username dari UserTest.create()
        console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.scope).toBe('GLOBAL');
        expect(response.body.data.effective).toMatchObject({
            gajiPerJam: 14285.71,
            batasJedaMenit: 5,
            jedaOtomatisAktif: true,
        });
    });
    it('should apply override for the target user', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        // Buat override untuk user
        await test_util_1.KonfigurasiTest.setOverride('raka20', { batasJedaMenit: 10 });
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi/effective')
            .set('Authorization', `Bearer ${token}`)
            .query({ username: 'raka20' });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.scope).toBe('USER');
        expect(response.body.data.effective).toMatchObject({
            gajiPerJam: 14285.71,
            batasJedaMenit: 10,
            jedaOtomatisAktif: true,
        });
    });
    it('should allow USER to access only their own effective config', async () => {
        const token = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi/effective')
            .set('Authorization', `Bearer ${token}`)
            .query({ username: 'raka20' });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.username).toBe('raka20');
    });
    it('should reject if USER tries to access other user effective config', async () => {
        const token = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi/effective')
            .set('Authorization', `Bearer ${token}`)
            .query({ username: 'owner1' });
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
    it('should return 404 if target username not found', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi/effective')
            .set('Authorization', `Bearer ${token}`)
            .query({ username: 'ghostuser' });
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
    });
    it('should return 400 if query.username is missing', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi/effective')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
    });
});
describe('PUT /api/konfigurasi/override/:username', () => {
    beforeEach(async () => {
        // await KonfigurasiTest.delete?.()        // bersihin kalau ada sisa
        await test_util_1.KonfigurasiTest.create(); // siapkan konfigurasi global
        await test_util_1.UserTest.delete(); // bersihin user
        await test_util_1.UserTest.create(); // default user: username 'raka20', role USER
    });
    afterEach(async () => {
        // beberapa repo pakai table terpisah untuk overrides; kalau helper tersedia, gunakan
        if (test_util_1.KonfigurasiTest.deleteAllOverrides) {
            await test_util_1.KonfigurasiTest.deleteAllOverrides();
        }
        await test_util_1.KonfigurasiTest.delete();
        await test_util_1.UserTest.delete();
    });
    it('should allow OWNER to create override for a user', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${token}`)
            .send({ batasJedaMenit: 10 });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        const data = res.body.data;
        // bentuk data disesuaikan dengan kontrak controller kamu
        // contoh: { username: 'raka20', overrides: { batasJedaMenit: 10 } }
        expect(data).toHaveProperty('username', 'raka20');
        expect(data).toHaveProperty('overrides');
        expect(data.overrides).toMatchObject({ batasJedaMenit: 10 });
    });
    it('should update existing override (idempotent/merge-by-fields)', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        // pertama set satu field
        await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${token}`)
            .send({ batasJedaMenit: 10 })
            .expect(200);
        // kemudian update field lain, perilaku: merge (bukan replace total) sesuai desain "tadi"
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${token}`)
            .send({ jedaOtomatisAktif: false });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        const data = res.body.data;
        expect(data).toHaveProperty('username', 'raka20');
        // minimal field yang baru harus ada
        expect(data.overrides).toMatchObject({ jedaOtomatisAktif: false });
        // jika service melakukan merge, maka field lama masih ada; kalau desainmu replace, hapus assertion di bawah
        // expect(data.overrides).toMatchObject({ batasJedaMenit: 10 })
    });
    it('should return 400 for empty body', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.status).toBe('error');
        // opsional: periksa kode error standar kamu
        // expect(res.body.error.code).toBe('BAD_REQUEST')
    });
    it('should return 400 for invalid payload', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${token}`)
            .send({
            batasJedaMenit: -5, // invalid (min 0)
            gajiPerJam: 'dua puluh ribu' // invalid (harus number)
        });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe('error');
        // expect(res.body.error.code).toBe('BAD_REQUEST')
    });
    it('should return 404 when target user not found', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi/override/ghostuser')
            .set('Authorization', `Bearer ${token}`)
            .send({ batasJedaMenit: 10 });
        expect(res.status).toBe(404);
        expect(res.body.status).toBe('error');
        // expect(res.body.error.code).toBe('NOT_FOUND')
    });
    it('should reject if requester is not OWNER', async () => {
        const tokenUser = await test_util_1.UserTest.login(); // login sebagai USER biasa
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({ batasJedaMenit: 10 });
        expect(res.status).toBe(403);
        expect(res.body.status).toBe('error');
        // expect(res.body.error.code).toBe('FORBIDDEN')
    });
    it('should reject if no token is provided', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/konfigurasi/override/raka20')
            .send({ batasJedaMenit: 10 });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe('error');
        // expect(res.body.error.code).toBe('UNAUTHORIZED')
    });
});
describe('DELETE /api/konfigurasi/override/:username', () => {
    beforeEach(async () => {
        await test_util_1.KonfigurasiTest.create();
        await test_util_1.UserTest.create(); // default: username 'raka20'
    });
    afterEach(async () => {
        // Kalau kamu punya helper ini, pakai untuk bersihin override
        if (test_util_1.KonfigurasiTest.deleteAllOverrides) {
            await test_util_1.KonfigurasiTest.deleteAllOverrides();
        }
        await test_util_1.KonfigurasiTest.delete();
        await test_util_1.UserTest.delete();
    });
    it('should allow OWNER to delete override for a user', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        // siapkan override dulu
        await test_util_1.KonfigurasiTest.setOverride('raka20', { batasJedaMenit: 10 });
        const response = await (0, supertest_1.default)(app_1.default)
            .delete('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        // (opsional) verifikasi effective kembali ke GLOBAL
        const effRes = await (0, supertest_1.default)(app_1.default)
            .get('/api/konfigurasi/effective')
            .set('Authorization', `Bearer ${token}`)
            .query({ username: 'raka20' });
        expect(effRes.status).toBe(200);
        expect(effRes.body.data.scope).toBe('GLOBAL');
    });
    it('should be idempotent when override does not exist', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .delete('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${token}`);
        // service kita pakai deleteMany → sukses meski tidak ada datanya
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
    });
    it('should return 404 when target user not found', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .delete('/api/konfigurasi/override/ghostuser')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
    });
    it('should reject if requester is not OWNER', async () => {
        const token = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .delete('/api/konfigurasi/override/raka20')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
    it('should reject if no token is provided', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .delete('/api/konfigurasi/override/raka20');
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
});
