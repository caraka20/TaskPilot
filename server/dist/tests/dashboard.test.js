"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const database_1 = require("../src/config/database");
const test_util_1 = require("./test-util");
describe('GET /api/dashboard/summary', () => {
    let ownerToken;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        ownerToken = await test_util_1.UserTest.loginOwner();
        await test_util_1.JamKerjaTest.delete();
        await test_util_1.GajiTest.delete();
    });
    afterEach(async () => {
        await test_util_1.JamKerjaTest.delete();
        await test_util_1.GajiTest.delete();
        await test_util_1.UserTest.delete();
    });
    it('should return summary numbers for OWNER', async () => {
        // seed: aktif, jeda, selesai (hari ini), dan gaji bulan ini
        await test_util_1.JamKerjaTest.createAktif('raka20');
        await test_util_1.JamKerjaTest.createJeda('raka20');
        await test_util_1.JamKerjaTest.createMany('raka20'); // 2 selesai @ totalJam=1 → total hari ini >= 2
        // gaji bulan berjalan
        await database_1.prismaClient.salary.createMany({
            data: [
                { username: 'raka20', jumlahBayar: 100000, catatan: 'bonus', tanggalBayar: new Date() },
                { username: 'raka20', jumlahBayar: 50000, catatan: 'tambahan', tanggalBayar: new Date() },
            ]
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/dashboard/summary')
            .set('Authorization', `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        const d = res.body.data;
        expect(typeof d.totalAktif).toBe('number');
        expect(typeof d.totalJeda).toBe('number');
        expect(typeof d.totalJamHariIni).toBe('number');
        expect(typeof d.payrollBulanBerjalan).toBe('number');
        expect(d.totalAktif).toBeGreaterThanOrEqual(1);
        expect(d.totalJeda).toBeGreaterThanOrEqual(1);
        expect(d.totalJamHariIni).toBeGreaterThanOrEqual(2);
        expect(d.payrollBulanBerjalan).toBeGreaterThanOrEqual(150000);
    });
    it('should return 401 without token', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/dashboard/summary');
        expect(res.status).toBe(401);
        expect(res.body.status).toBe('error');
    });
    it('should return 403 for USER role', async () => {
        const token = await test_util_1.UserTest.login();
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/dashboard/summary')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
        expect(res.body.status).toBe('error');
    });
});
