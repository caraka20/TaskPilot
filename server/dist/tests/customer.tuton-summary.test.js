"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const prisma_1 = require("../src/generated/prisma");
const test_util_1 = require("./test-util");
describe("GET /api/customers/:id/tuton-summary", () => {
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
    it("should return aggregated summary for a customer with courses (OWNER)", async () => {
        const customer = await test_util_1.CustomerTest.create();
        // Course 1 + items
        const c1 = await test_util_1.TutonTest.createCourse(customer.id, "MAN101 - Manajemen");
        await test_util_1.TutonTest.createItems(c1.id);
        // tandai beberapa selesai + nilai
        await test_util_1.TutonTest.setItemStatus(c1.id, prisma_1.JenisTugas.DISKUSI, 1, prisma_1.StatusTugas.SELESAI, 80);
        await test_util_1.TutonTest.setItemStatus(c1.id, prisma_1.JenisTugas.DISKUSI, 2, prisma_1.StatusTugas.SELESAI, 90);
        await test_util_1.TutonTest.setItemStatus(c1.id, prisma_1.JenisTugas.ABSEN, 1, prisma_1.StatusTugas.SELESAI);
        await test_util_1.TutonTest.setItemStatus(c1.id, prisma_1.JenisTugas.TUGAS, 5, prisma_1.StatusTugas.SELESAI, 95);
        await test_util_1.TutonTest.recalcCompleted(c1.id); // completedItems sinkron
        // Course 2 + items (biarkan kosong)
        const c2 = await test_util_1.TutonTest.createCourse(customer.id, "STAT101 - Statistika");
        await test_util_1.TutonTest.createItems(c2.id);
        await test_util_1.TutonTest.recalcCompleted(c2.id);
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/customers/${customer.id}/tuton-summary`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const data = res.body.data;
        expect(data).toHaveProperty("customerId", customer.id);
        expect(data).toHaveProperty("namaCustomer", customer.namaCustomer);
        expect(data).toHaveProperty("totalCourses", 2);
        expect(data).toHaveProperty("totalItems", 38);
        expect(data).toHaveProperty("totalCompleted", 4); // 2 diskusi + 1 absen + 1 tugas
        expect(typeof data.overallProgress).toBe("number");
        // cek per-course
        const courses = data.courses;
        expect(Array.isArray(courses)).toBe(true);
        expect(courses.length).toBe(2);
        const course1 = courses.find((c) => c.courseId === c1.id);
        const course2 = courses.find((c) => c.courseId === c2.id);
        expect(course1).toBeTruthy();
        expect(course2).toBeTruthy();
        // Course 1 breakdown
        expect(course1.totalItems).toBe(19);
        expect(course1.completedItems).toBe(4);
        expect(course1.breakdown.DISKUSI.total).toBe(8);
        expect(course1.breakdown.DISKUSI.selesai).toBe(2);
        expect(course1.breakdown.DISKUSI.nilaiAvg).toBe(85); // (80+90)/2
        expect(course1.breakdown.ABSEN.total).toBe(8);
        expect(course1.breakdown.ABSEN.selesai).toBe(1);
        expect(course1.breakdown.TUGAS.total).toBe(3);
        expect(course1.breakdown.TUGAS.selesai).toBe(1);
        expect(course1.breakdown.TUGAS.nilaiAvg).toBe(95);
        // Course 2 breakdown
        expect(course2.totalItems).toBe(19);
        expect(course2.completedItems).toBe(0);
        expect(course2.breakdown.DISKUSI.selesai).toBe(0);
        expect(course2.breakdown.DISKUSI.nilaiAvg).toBeNull();
        expect(course2.breakdown.ABSEN.selesai).toBe(0);
        expect(course2.breakdown.TUGAS.selesai).toBe(0);
        expect(course2.breakdown.TUGAS.nilaiAvg).toBeNull();
    });
    it("should allow USER to access tuton summary", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/customers/${customer.id}/tuton-summary`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
    });
    it("should return zero summary when customer has no courses", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/customers/${customer.id}/tuton-summary`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const data = res.body.data;
        expect(data.totalCourses).toBe(0);
        expect(data.totalItems).toBe(0);
        expect(data.totalCompleted).toBe(0);
        expect(data.overallProgress).toBe(0);
        expect(Array.isArray(data.courses)).toBe(true);
        expect(data.courses.length).toBe(0);
    });
    it("should return 404 when customer not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/customers/999999/tuton-summary`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when id is invalid (non-numeric)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/customers/abc/tuton-summary`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/customers/${customer.id}/tuton-summary`);
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
