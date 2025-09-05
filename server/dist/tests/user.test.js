"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const test_util_1 = require("./test-util");
/* Helpers */
function expectEverythingShape(data) {
    expect(data).toHaveProperty('profile');
    expect(data.profile).toHaveProperty('username');
    expect(data.profile).toHaveProperty('namaLengkap');
    expect(data.profile).toHaveProperty('role');
    expect(data.profile).toHaveProperty('createdAt');
    expect(data.profile).toHaveProperty('updatedAt');
    expect(data.profile).toHaveProperty('totals.totalJamKerja');
    expect(typeof data.profile.totals.totalJamKerja).toBe('number');
    expect(data.profile).toHaveProperty('totals.totalGaji');
    expect(typeof data.profile.totals.totalGaji).toBe('number');
    expect(data).toHaveProperty('konfigurasi');
    expect(typeof data.konfigurasi.gajiPerJam).toBe('number');
    expect(typeof data.konfigurasi.batasJedaMenit).toBe('number');
    expect(typeof data.konfigurasi.jedaOtomatisAktif).toBe('boolean');
    expect(['override', 'global']).toContain(data.konfigurasi.source);
    expect(data).toHaveProperty('jamKerja');
    expect(['AKTIF', 'JEDA', 'SELESAI', 'OFF']).toContain(data.jamKerja.latestStatus);
    expect(data.jamKerja).toHaveProperty('activeSessionId');
    expect(data.jamKerja).toHaveProperty('today.items');
    expect(Array.isArray(data.jamKerja.today.items)).toBe(true);
    expect(data.jamKerja).toHaveProperty('summary.hari.totalJam');
    expect(typeof data.jamKerja.summary.hari.totalJam).toBe('number');
    expect(data.jamKerja).toHaveProperty('summary.hari.totalGaji');
    expect(typeof data.jamKerja.summary.hari.totalGaji).toBe('number');
    expect(data.jamKerja).toHaveProperty('history.items');
    expect(Array.isArray(data.jamKerja.history.items)).toBe(true);
    expect(data.jamKerja).toHaveProperty('history.page');
    expect(data.jamKerja).toHaveProperty('history.perPage');
    expect(data.jamKerja).toHaveProperty('history.total');
    expect(data).toHaveProperty('gaji.gajiPerJam');
    expect(typeof data.gaji.gajiPerJam).toBe('number');
    expect(data).toHaveProperty('gaji.summary.totalJam');
    expect(typeof data.gaji.summary.totalJam).toBe('number');
    expect(data).toHaveProperty('gaji.summary.upahKeseluruhan');
    expect(typeof data.gaji.summary.upahKeseluruhan).toBe('number');
    expect(data).toHaveProperty('gaji.summary.totalDiterima');
    expect(typeof data.gaji.summary.totalDiterima).toBe('number');
    expect(data).toHaveProperty('gaji.summary.belumDibayar');
    expect(typeof data.gaji.summary.belumDibayar).toBe('number');
    expect(data).toHaveProperty('gaji.riwayat.items');
    expect(Array.isArray(data.gaji.riwayat.items)).toBe(true);
    expect(data).toHaveProperty('gaji.riwayat.page');
    expect(data).toHaveProperty('gaji.riwayat.perPage');
    expect(data).toHaveProperty('gaji.riwayat.total');
    expect(data).toHaveProperty('tugas');
    expect(Array.isArray(data.tugas)).toBe(true);
}
/* ================= REGISTER ================= */
describe('POST /api/users/register', () => {
    let ownerToken;
    beforeEach(async () => {
        await test_util_1.UserTest.delete();
        ownerToken = await test_util_1.UserTest.loginOwner();
    });
    afterEach(async () => {
        await test_util_1.UserTest.delete();
    });
    it('should be able register a new user', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/users/register')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
            username: "raka20",
            password: "raka20",
            namaLengkap: "caraka"
        });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.username).toBe("raka20");
        expect(response.body.data.namaLengkap).toBe("caraka");
    });
    it('should fail to register when request body is invalid', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/users/register')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
            username: "",
            password: "",
            namaLengkap: ""
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
    });
    it('should fail to register when username already exists', async () => {
        await test_util_1.UserTest.create();
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/users/register')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
            username: "raka20",
            password: "raka20",
            namaLengkap: "caraka"
        });
        expect(response.status).toBe(409);
        expect(response.body.status).toBe('error');
    });
});
/* ================= LOGIN ================= */
describe('POST /api/users/login', () => {
    beforeEach(async () => {
        await test_util_1.UserTest.create();
    });
    afterEach(async () => {
        await test_util_1.UserTest.delete();
    });
    it('shoul be able login', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/users/login')
            .send({
            username: "raka20",
            password: "raka20"
        });
        expect(response.status).toBe(200);
        expect(response.body.data.token).toBeDefined();
    });
    it('should error when username does not exist', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/users/login')
            .send({
            username: "user_salah",
            password: "raka20"
        });
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
    });
    it('should error when password is incorrect', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/users/login')
            .send({
            username: "raka20",
            password: "password_salah"
        });
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
    it('should error when username and password is missing', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/users/login')
            .send({
            username: "",
            password: ""
        });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.errors).toBeDefined();
    });
});
/* ================= GET LIST USERS ================= */
describe('GET /api/users', () => {
    let ownerToken;
    let userToken;
    beforeEach(async () => {
        await test_util_1.UserTest.create(); // buat user 'raka20' (role USER)
        ownerToken = await test_util_1.UserTest.loginOwner();
        userToken = await test_util_1.UserTest.login();
    });
    afterEach(async () => {
        await test_util_1.UserTest.delete();
    });
    it('should return array of user objects with expected structure (OWNER)', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/users')
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        const data = response.body.data;
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        data.forEach((user) => {
            expect(user).toHaveProperty('username');
            expect(typeof user.username).toBe('string');
            expect(user).toHaveProperty('namaLengkap');
            expect(typeof user.namaLengkap).toBe('string');
            expect(user).toHaveProperty('role');
            expect(['USER', 'OWNER']).toContain(user.role);
            expect(user).toHaveProperty('totalJamKerja');
            expect(typeof user.totalJamKerja).toBe('number');
            expect(user).toHaveProperty('totalGaji');
            expect(typeof user.totalGaji).toBe('number');
        });
    });
    it('should return 403 for USER role', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/users')
            .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
    it('should return 401 if no token provided', async () => {
        const response = await (0, supertest_1.default)(app_1.default).get('/api/users');
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
});
/* ================= GET USER DETAIL (lama) ================= */
describe('GET /api/users/:username', () => {
    beforeEach(async () => {
        await test_util_1.UserTest.create();
    });
    afterEach(async () => {
        await test_util_1.UserTest.delete();
    });
    it('should get user detail by username', async () => {
        const token = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/users/raka20')
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        const data = response.body.data;
        expect(data).toHaveProperty('username', 'raka20');
        expect(data).toHaveProperty('namaLengkap', 'caraka');
        expect(data).toHaveProperty('role');
        expect(data).toHaveProperty('totalJamKerja');
        expect(data).toHaveProperty('totalGaji');
        expect(Array.isArray(data.jamKerja)).toBe(true);
        expect(Array.isArray(data.tugas)).toBe(true);
        expect(Array.isArray(data.riwayatGaji)).toBe(true);
    });
    it('should error if user not found', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/users/unknownuser');
        expect(response.status).toBe(401); // tidak ada token
        expect(response.body.status).toBe('error');
    });
});
/* ================= LOGOUT ================= */
describe('DELETE /api/users/logout', () => {
    beforeEach(async () => {
        await test_util_1.UserTest.create();
    });
    afterEach(async () => {
        await test_util_1.UserTest.delete();
    });
    it("should be able logout", async () => {
        const token = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .post("/api/users/logout")
            .set('Authorization', `Bearer ${token}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
    });
});
/* ================= PATCH JEDA OTOMATIS ================= */
describe('PATCH /api/users/:username/jeda-otomatis', () => {
    beforeEach(async () => {
        await test_util_1.UserTest.create();
    });
    afterEach(async () => {
        await test_util_1.UserTest.delete();
    });
    it('should allow OWNER to set jeda otomatis for a user (aktif: false)', async () => {
        const ownerToken = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch('/api/users/raka20/jeda-otomatis')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ aktif: false });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.jedaOtomatis).toBe(false);
    });
    it('should allow OWNER to set jeda otomatis for a user (aktif: true)', async () => {
        const ownerToken = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch('/api/users/raka20/jeda-otomatis')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ aktif: true });
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.data.jedaOtomatis).toBe(true);
    });
    it('should return 400 if aktif is not a boolean', async () => {
        const ownerToken = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch('/api/users/raka20/jeda-otomatis')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ aktif: 'ya' });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
    });
    it('should return 404 if user not found', async () => {
        const ownerToken = await test_util_1.UserTest.loginOwner();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch('/api/users/unknownuser/jeda-otomatis')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ aktif: true });
        expect(response.status).toBe(404);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe("User not found");
    });
    it('should return 403 if role is not OWNER', async () => {
        const userToken = await test_util_1.UserTest.login();
        const response = await (0, supertest_1.default)(app_1.default)
            .patch('/api/users/raka20/jeda-otomatis')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ aktif: true });
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
    it('should return 401 if no token provided', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .patch('/api/users/raka20/jeda-otomatis')
            .send({ aktif: true });
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
});
/* ================= GET USER EVERYTHING (baru) ================= */
describe('GET /api/users/:username/everything', () => {
    let ownerToken;
    let userToken;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        ownerToken = await test_util_1.UserTest.loginOwner();
        userToken = await test_util_1.UserTest.login();
    });
    afterEach(async () => {
        await test_util_1.UserTest.delete();
    });
    it('should allow OWNER to fetch any user everything', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/users/raka20/everything?histPage=1&histLimit=5&payPage=1&payLimit=5')
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expectEverythingShape(response.body.data);
    });
    it('should allow USER to fetch his own everything', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/users/raka20/everything')
            .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expectEverythingShape(response.body.data);
    });
    it('should return 403 when USER fetches other user everything', async () => {
        // misal owner username = 'owner' (di util loginOwner)
        // USER coba akses username lain
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/users/owner/everything')
            .set('Authorization', `Bearer ${userToken}`);
        expect(response.status).toBe(403);
        expect(response.body.status).toBe('error');
    });
    it('should return 401 if no token provided', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .get('/api/users/raka20/everything');
        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
    });
});
