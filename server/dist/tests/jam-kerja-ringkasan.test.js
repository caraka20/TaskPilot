"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const test_util_1 = require("./test-util");
const prisma_1 = require("../src/generated/prisma");
// ================= Helpers =================
const startOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};
const startOfWeek = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
};
const startOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
};
async function insertSelesai(username, jamMulai, durJam) {
    const jamSelesai = new Date(jamMulai.getTime() + durJam * 60 * 60 * 1000);
    return database_1.prismaClient.jamKerja.create({
        data: {
            username,
            jamMulai,
            jamSelesai,
            totalJam: durJam,
            status: prisma_1.StatusKerja.SELESAI,
            tanggal: jamMulai,
        },
    });
}
async function insertAktif(username, startedAt) {
    return database_1.prismaClient.jamKerja.create({
        data: {
            username,
            jamMulai: startedAt,
            status: prisma_1.StatusKerja.AKTIF,
            tanggal: startedAt,
        },
    });
}
async function insertJeda(username, startedAt) {
    return database_1.prismaClient.jamKerja.create({
        data: {
            username,
            jamMulai: startedAt,
            status: prisma_1.StatusKerja.JEDA,
            tanggal: startedAt,
        },
    });
}
// Prisma kamu mewajibkan namaLengkap → bikin helper kecil
async function createUser(username, role = prisma_1.Role.USER, namaLengkap = 'User Test') {
    return database_1.prismaClient.user.create({
        data: {
            username,
            password: 'secret',
            namaLengkap, // <— WAJIB sesuai schema-mu
            role, // pakai enum Role biar type-safe
            // field lain biarkan default schema (token, totalGaji, dll)
        },
    });
}
// ================= Tests =================
describe('GET /api/jam-kerja/user-summary', () => {
    const USERNAME = 'raka20';
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        // pastikan konfigurasi global ada
        await database_1.prismaClient.konfigurasi.upsert({
            where: { id: 1 },
            update: { gajiPerJam: 10000 },
            create: { id: 1, gajiPerJam: 10000 },
        });
        // Data selesai: hari ini 2h + 1.5h
        await insertSelesai(USERNAME, new Date(startOfToday().getTime() + 9 * 3600000), 2);
        await insertSelesai(USERNAME, new Date(startOfToday().getTime() + 14 * 3600000), 1.5);
        // Minggu ini (di luar hari ini): +4h
        const weekStart = startOfWeek();
        await insertSelesai(USERNAME, new Date(weekStart.getTime() + 2 * 24 * 3600000 + 10 * 3600000), 4);
        // Bulan ini (di luar minggu ini): +8h
        const monthStart = startOfMonth();
        await insertSelesai(USERNAME, new Date(monthStart.getTime() + 1 * 24 * 3600000 + 9 * 3600000), 8);
        // Sesi aktif sekarang (tidak ikut sum selesai)
        await insertAktif(USERNAME, new Date(Date.now() - 30 * 60 * 1000));
    });
    afterEach(async () => {
        await database_1.prismaClient.jamKerja.deleteMany();
        await database_1.prismaClient.konfigurasi.deleteMany();
        await test_util_1.UserTest.delete();
        await test_util_1.JamKerjaTest.delete();
    });
    it('should return per-user summary for OWNER', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/jam-kerja/user-summary?username=${USERNAME}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        const data = res.body.data;
        console.log(data);
        expect(data).toHaveProperty('username', USERNAME);
        expect(['AKTIF', 'JEDA', 'SELESAI', 'OFF']).toContain(data.status);
        // total jam kira-kira sesuai
        expect(Number(data.totals.hari.totalJam)).toBeCloseTo(3.5, 2); // 2 + 1.5
        expect(Number(data.totals.minggu.totalJam)).toBeCloseTo(7.5, 2); // 3.5 + 4
        expect(Number(data.totals.bulan.totalJam)).toBeCloseTo(15.5, 2); // 7.5 + 8
        expect(Number(data.totals.semua.totalJam)).toBeCloseTo(15.5, 2);
        // gaji = round0(totalJam * 10000)
        expect(Number(data.totals.hari.totalGaji)).toBe(Math.round(3.5 * 10000));
    });
    it("should allow USER to view only their own summary and forbid others", async () => {
        const userToken = await test_util_1.UserTest.login();
        const ok = await (0, supertest_1.default)(app_1.default)
            .get(`/api/jam-kerja/user-summary?username=${USERNAME}`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(ok.status).toBe(200);
        expect(ok.body.status).toBe('success');
        expect(ok.body.data.username).toBe(USERNAME);
        const bad = await (0, supertest_1.default)(app_1.default)
            .get(`/api/jam-kerja/user-summary?username=owner-test`)
            .set('Authorization', `Bearer ${userToken}`);
        expect(bad.status).toBe(403);
        expect(bad.body.status).toBe('error');
    });
    it('should return 401 if no token provided', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/jam-kerja/user-summary?username=${USERNAME}`);
        expect(res.status).toBe(401);
        expect(res.body.status).toBe('error');
    });
});
describe('GET /api/jam-kerja/summary/oke', () => {
    const U1 = 'raka20';
    const U2 = 'lala';
    beforeEach(async () => {
        await test_util_1.UserTest.create(); // create default users (raka20 + owner)
        await createUser(U2, prisma_1.Role.USER, 'lala Santoso'); // <— FIX: tambah namaLengkap
        await database_1.prismaClient.konfigurasi.upsert({
            where: { id: 1 },
            update: { gajiPerJam: 10000 },
            create: { id: 1, gajiPerJam: 10000 },
        });
        // U1: 1 aktif, 1 jeda, 1 selesai (hari ini 2h)
        await insertAktif(U1, new Date(Date.now() - 20 * 60 * 1000));
        await insertJeda(U1, new Date(Date.now() - 60 * 60 * 1000));
        await insertSelesai(U1, new Date(startOfToday().getTime() + 8 * 3600000), 2);
        // U2: 1 selesai minggu ini (4h)
        await insertSelesai(U2, new Date(startOfWeek().getTime() + 3 * 24 * 3600000 + 9 * 3600000), 4);
    });
    afterEach(async () => {
        await database_1.prismaClient.jamKerja.deleteMany();
        await database_1.prismaClient.konfigurasi.deleteMany();
        await database_1.prismaClient.user.deleteMany({ where: { username: U2 } });
        await test_util_1.UserTest.delete();
        await test_util_1.JamKerjaTest.delete();
    });
    it('should return global summary with counts and users for OWNER', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/jam-kerja/summary')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        const data = res.body.data;
        expect(data).toHaveProperty('generatedAt');
        expect(data).toHaveProperty('counts.users');
        expect(data).toHaveProperty('counts.aktif');
        expect(data).toHaveProperty('counts.jeda');
        expect(Array.isArray(data.users)).toBe(true);
        // setidaknya 1 aktif & 1 jeda sesuai seed
        expect(data.counts.aktif).toBeGreaterThanOrEqual(1);
        expect(data.counts.jeda).toBeGreaterThanOrEqual(1);
        const users = data.users.map((u) => u.username);
        expect(users).toEqual(expect.arrayContaining([U1, U2]));
    });
    it('should support filter by username', async () => {
        const token = await test_util_1.UserTest.loginOwner();
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/jam-kerja/summary?username=${U2}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.data.users)).toBe(true);
        expect(res.body.data.users.length).toBe(1);
        expect(res.body.data.users[0].username).toBe(U2);
    });
    it('should reject USER role', async () => {
        const token = await test_util_1.UserTest.login();
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/jam-kerja/summary')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.status).toBe('error');
    });
    it('should return 401 if no token provided', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/jam-kerja/summary');
        expect(res.status).toBe(401);
        expect(res.body.status).toBe('error');
    });
});
