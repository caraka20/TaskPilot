"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const test_util_1 = require("./test-util");
const database_1 = require("../src/config/database");
const prisma_1 = require("../src/generated/prisma");
describe("GET /api/tuton/subjects", () => {
    let ownerToken;
    let userToken;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        ownerToken = await test_util_1.UserTest.loginOwner();
        userToken = await test_util_1.UserTest.login();
        await test_util_1.TutonTest.delete();
        await test_util_1.CustomerTest.delete();
    });
    afterEach(async () => {
        await test_util_1.TutonTest.delete();
        await test_util_1.CustomerTest.delete();
        await test_util_1.UserTest.delete();
    });
    it("should return empty array when no courses", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/subjects")
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(0);
    });
    it("should aggregate subjects (conflict & non-conflict) for OWNER", async () => {
        const c1 = await test_util_1.CustomerTest.create(); // e.g. A
        const c2 = await test_util_1.CustomerTest.create(); // e.g. B
        // Konflik: dua course dengan matkul sama
        await test_util_1.TutonTest.createCourse(c1.id, "Akuntansi Dasar");
        await test_util_1.TutonTest.createCourse(c2.id, "Akuntansi Dasar");
        // Non-konflik: satu saja
        await test_util_1.TutonTest.createCourse(c1.id, "Statistika");
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/subjects")
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        const byMatkul = Object.fromEntries(res.body.data
            .map((x) => [x.matkul, x]));
        expect(byMatkul["Akuntansi Dasar"]).toBeTruthy();
        expect(byMatkul["Akuntansi Dasar"].totalCourses).toBe(2);
        expect(byMatkul["Akuntansi Dasar"].isConflict).toBe(true);
        expect(byMatkul["Statistika"]).toBeTruthy();
        expect(byMatkul["Statistika"].totalCourses).toBe(1);
        expect(byMatkul["Statistika"].isConflict).toBe(false);
    });
    it("should support q filter", async () => {
        const c = await test_util_1.CustomerTest.create();
        await test_util_1.TutonTest.createCourse(c.id, "Akuntansi Dasar");
        await test_util_1.TutonTest.createCourse(c.id, "Statistika");
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/subjects?q=Akuntansi")
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        const list = res.body.data;
        expect(list.every((x) => x.matkul.includes("Akuntansi"))).toBe(true);
    });
    it("should allow USER to access", async () => {
        const c = await test_util_1.CustomerTest.create();
        await test_util_1.TutonTest.createCourse(c.id, "Manajemen Keuangan");
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/subjects")
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
    });
    it("should return 401 when no token", async () => {
        const res = await (0, supertest_1.default)(app_1.default).get("/api/tuton/subjects");
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
describe("GET /api/tuton/scan", () => {
    let ownerToken;
    let userToken;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        ownerToken = await test_util_1.UserTest.loginOwner();
        userToken = await test_util_1.UserTest.login();
        await test_util_1.TutonTest.delete();
        await test_util_1.CustomerTest.delete();
    });
    afterEach(async () => {
        await test_util_1.TutonTest.delete();
        await test_util_1.CustomerTest.delete();
        await test_util_1.UserTest.delete();
    });
    it("should list BELUM for ABSEN sesi=1 on specific subject (owner)", async () => {
        // Setup: 2 customers, 2 courses - same subject ("Akuntansi Dasar")
        const A = await test_util_1.CustomerTest.create();
        const B = await test_util_1.CustomerTest.create();
        const courseA = await test_util_1.TutonTest.createCourse(A.id, "Akuntansi Dasar");
        const courseB = await test_util_1.TutonTest.createCourse(B.id, "Akuntansi Dasar");
        await test_util_1.TutonTest.createItems(courseA.id);
        await test_util_1.TutonTest.createItems(courseB.id);
        // Mark ABSEN sesi 1 as SELESAI for courseA only
        await database_1.prismaClient.tutonItem.updateMany({
            where: { courseId: courseA.id, jenis: prisma_1.JenisTugas.ABSEN, sesi: 1 },
            data: { status: prisma_1.StatusTugas.SELESAI, selesaiAt: new Date() },
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/scan")
            .query({ jenis: "ABSEN", sesi: 1, status: "BELUM", matkul: "Akuntansi Dasar" })
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const rows = res.body.data.rows;
        // should only contain courseB side (BELUM)
        expect(rows.length).toBe(1);
        expect(rows[0].matkul).toBe("Akuntansi Dasar");
        expect(rows[0].jenis).toBe("ABSEN");
        expect(rows[0].sesi).toBe(1);
        expect(rows[0].status).toBe("BELUM");
        expect(rows[0].customerId).toBe(B.id);
    });
    it("should list two BELUM for DISKUSI sesi=1 (both courses)", async () => {
        const A = await test_util_1.CustomerTest.create();
        const B = await test_util_1.CustomerTest.create();
        const cA = await test_util_1.TutonTest.createCourse(A.id, "Akuntansi Dasar");
        const cB = await test_util_1.TutonTest.createCourse(B.id, "Akuntansi Dasar");
        await test_util_1.TutonTest.createItems(cA.id);
        await test_util_1.TutonTest.createItems(cB.id);
        // No changes to DISKUSI sesi 1 → default BELUM for both
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/scan")
            .query({ jenis: "DISKUSI", sesi: 1, status: "BELUM" })
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.meta.total).toBe(2);
        expect(res.body.data.rows.length).toBe(2);
    });
    it("should paginate results (pageSize=1)", async () => {
        const A = await test_util_1.CustomerTest.create();
        const B = await test_util_1.CustomerTest.create();
        const cA = await test_util_1.TutonTest.createCourse(A.id, "Tugas Project");
        const cB = await test_util_1.TutonTest.createCourse(B.id, "Tugas Project");
        await test_util_1.TutonTest.createItems(cA.id);
        await test_util_1.TutonTest.createItems(cB.id);
        // Keep TUGAS sesi 3 as BELUM for both
        const page1 = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/scan")
            .query({ jenis: "TUGAS", sesi: 3, status: "BELUM", pageSize: 1, page: 1 })
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(page1.status).toBe(200);
        expect(page1.body.data.meta.total).toBe(2);
        expect(page1.body.data.meta.hasNext).toBe(true);
        expect(page1.body.data.rows.length).toBe(1);
        const page2 = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/scan")
            .query({ jenis: "TUGAS", sesi: 3, status: "BELUM", pageSize: 1, page: 2 })
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(page2.status).toBe(200);
        expect(page2.body.data.meta.total).toBe(2);
        expect(page2.body.data.meta.hasNext).toBe(false);
        expect(page2.body.data.rows.length).toBe(1);
    });
    it("should allow USER to access scan", async () => {
        const C = await test_util_1.CustomerTest.create();
        const c = await test_util_1.TutonTest.createCourse(C.id, "Basis Data");
        await test_util_1.TutonTest.createItems(c.id);
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton/scan")
            .query({ jenis: "ABSEN", sesi: 1, status: "BELUM" })
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
    });
    it("should return 401 when no token", async () => {
        const res = await (0, supertest_1.default)(app_1.default).get("/api/tuton/scan").query({ jenis: "ABSEN", sesi: 1 });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
