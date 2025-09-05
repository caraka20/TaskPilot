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
describe("POST /api/tuton-courses/:courseId/items/init", () => {
    let ownerToken;
    let userToken;
    let customerId;
    let courseId;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        ownerToken = await test_util_1.UserTest.loginOwner();
        userToken = await test_util_1.UserTest.login();
        await test_util_1.TutonTest.delete();
        await test_util_1.CustomerTest.delete();
        const cust = await test_util_1.CustomerTest.create();
        customerId = cust.id;
        const course = await test_util_1.TutonTest.createCourse(customerId, "Manajemen");
        courseId = course.id;
    });
    afterEach(async () => {
        await test_util_1.TutonTest.delete();
        await test_util_1.CustomerTest.delete();
        await test_util_1.UserTest.delete();
    });
    it("should init 19 default items for course (OWNER)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/init`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({}); // overwrite default false
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const data = res.body.data;
        expect(data).toHaveProperty("courseId", courseId);
        expect(data).toHaveProperty("created", true);
        expect(data).toHaveProperty("totalItems", 19);
        expect(data).toHaveProperty("completedItems", 0);
        const count = await test_util_1.TutonTest.countItems(courseId);
        expect(count).toBe(19);
        const course = await database_1.prismaClient.tutonCourse.findUnique({ where: { id: courseId } });
        expect(course?.totalItems).toBe(19);
        expect(course?.completedItems).toBe(0);
    });
    it("should be idempotent (no overwrite): second call does not recreate", async () => {
        // init pertama
        await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/init`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({});
        // init kedua tanpa overwrite
        const res2 = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/init`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({});
        expect(res2.status).toBe(200);
        expect(res2.body.status).toBe("success");
        expect(res2.body.data).toHaveProperty("created", false);
        const count = await test_util_1.TutonTest.countItems(courseId);
        expect(count).toBe(19);
        const course = await database_1.prismaClient.tutonCourse.findUnique({ where: { id: courseId } });
        expect(course?.totalItems).toBe(19);
    });
    it("should recreate when overwrite=true", async () => {
        // seed manual biar ada items dulu (atau panggil init pertama)
        await test_util_1.TutonTest.createItems(courseId);
        const beforeCount = await test_util_1.TutonTest.countItems(courseId);
        expect(beforeCount).toBe(19);
        // overwrite
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/init`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ overwrite: true });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("created", true);
        expect(res.body.data).toHaveProperty("totalItems", 19);
        const afterCount = await test_util_1.TutonTest.countItems(courseId);
        expect(afterCount).toBe(19);
        const course = await database_1.prismaClient.tutonCourse.findUnique({ where: { id: courseId } });
        expect(course?.totalItems).toBe(19);
        expect(course?.completedItems).toBe(0);
    });
    it("should allow USER as well", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/init`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({});
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("courseId", courseId);
        const count = await test_util_1.TutonTest.countItems(courseId);
        expect(count).toBe(19);
    });
    it("should return 404 when course not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/999999/items/init`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({});
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when courseId is invalid (non-numeric)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/abc/items/init`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/init`)
            .send({});
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
describe("POST /api/tuton-courses/:courseId/items/bulk-status", () => {
    let ownerToken;
    let userToken;
    let customerId;
    let courseId;
    beforeEach(async () => {
        await test_util_1.UserTest.create();
        ownerToken = await test_util_1.UserTest.loginOwner();
        userToken = await test_util_1.UserTest.login();
        await test_util_1.TutonTest.delete();
        await test_util_1.CustomerTest.delete();
        const cust = await test_util_1.CustomerTest.create();
        customerId = cust.id;
        const course = await test_util_1.TutonTest.createCourse(customerId, "Manajemen Operasional");
        courseId = course.id;
        await test_util_1.TutonTest.createItems(courseId); // 19 items
    });
    afterEach(async () => {
        await test_util_1.TutonTest.delete();
        await test_util_1.CustomerTest.delete();
        await test_util_1.UserTest.delete();
    });
    it("should update multiple items to SELESAI (OWNER) and refresh completedItems", async () => {
        const i1 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.DISKUSI, 1);
        const i2 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.ABSEN, 2);
        const i3 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.TUGAS, 3);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
            items: [
                { itemId: i1.id, status: "SELESAI" },
                { itemId: i2.id, status: "SELESAI" },
                { itemId: i3.id, status: "SELESAI" },
            ],
        });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("updated", 3);
        // verify items updated
        const [r1, r2, r3] = await Promise.all([
            database_1.prismaClient.tutonItem.findUnique({ where: { id: i1.id } }),
            database_1.prismaClient.tutonItem.findUnique({ where: { id: i2.id } }),
            database_1.prismaClient.tutonItem.findUnique({ where: { id: i3.id } }),
        ]);
        expect(r1?.status).toBe(prisma_1.StatusTugas.SELESAI);
        expect(r2?.status).toBe(prisma_1.StatusTugas.SELESAI);
        expect(r3?.status).toBe(prisma_1.StatusTugas.SELESAI);
        // completedItems should be 3
        const course = await database_1.prismaClient.tutonCourse.findUnique({ where: { id: courseId } });
        expect(course?.completedItems).toBe(3);
    });
    it("should allow USER to bulk update", async () => {
        const i1 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.DISKUSI, 4);
        const i2 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.DISKUSI, 5);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({
            items: [
                { itemId: i1.id, status: "SELESAI" },
                { itemId: i2.id, status: "SELESAI" },
            ],
        });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data.updated).toBe(2);
    });
    it("should be fine updating mix BELUM/SELESAI (idempotent behavior)", async () => {
        const i1 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.DISKUSI, 6);
        const i2 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.DISKUSI, 7);
        // first set SELESAI
        await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ items: [{ itemId: i1.id, status: "SELESAI" }] });
        // then set BELUM for i1, SELESAI for i2
        const res2 = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
            items: [
                { itemId: i1.id, status: "BELUM" },
                { itemId: i2.id, status: "SELESAI" },
            ],
        });
        expect(res2.status).toBe(200);
        expect(res2.body.status).toBe("success");
        expect(res2.body.data.updated).toBe(2);
        const [r1, r2] = await Promise.all([
            database_1.prismaClient.tutonItem.findUnique({ where: { id: i1.id } }),
            database_1.prismaClient.tutonItem.findUnique({ where: { id: i2.id } }),
        ]);
        expect(r1?.status).toBe(prisma_1.StatusTugas.BELUM);
        expect(r2?.status).toBe(prisma_1.StatusTugas.SELESAI);
    });
    it("should return 404 when course not found", async () => {
        const anyItem = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.ABSEN, 1);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/999999/items/bulk-status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ items: [{ itemId: anyItem.id, status: "SELESAI" }] });
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when body is invalid (empty items)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ items: [] });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when status value is invalid", async () => {
        const i1 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.DISKUSI, 2);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
            items: [
                { itemId: i1.id, status: "DONE" },
            ],
        });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when courseId is invalid (non-numeric)", async () => {
        const i1 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.DISKUSI, 8);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/abc/items/bulk-status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ items: [{ itemId: i1.id, status: "SELESAI" }] });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        const i1 = await test_util_1.TutonTest.findItem(courseId, prisma_1.JenisTugas.TUGAS, 5);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${courseId}/items/bulk-status`)
            .send({ items: [{ itemId: i1.id, status: "SELESAI" }] });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
describe("POST /api/tuton-courses/:courseId/items/bulk-nilai", () => {
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
    it("should update nilai for multiple items (OWNER)", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Manajemen");
        await test_util_1.TutonTest.createItems(course.id);
        const disk7 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 7);
        const tug7 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.TUGAS, 7);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
            items: [
                { itemId: disk7.id, nilai: 88 },
                { itemId: tug7.id, nilai: 95 },
            ],
        });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("updated", 2);
        const d = await database_1.prismaClient.tutonItem.findUnique({ where: { id: disk7.id } });
        const t = await database_1.prismaClient.tutonItem.findUnique({ where: { id: tug7.id } });
        expect(d?.nilai).toBe(88);
        expect(t?.nilai).toBe(95);
    });
    it("should allow USER to update nilai", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Hukum");
        await test_util_1.TutonTest.createItems(course.id);
        const d1 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 1);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ items: [{ itemId: d1.id, nilai: 77 }] });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const row = await database_1.prismaClient.tutonItem.findUnique({ where: { id: d1.id } });
        expect(row?.nilai).toBe(77);
    });
    it("should reject when nilai is out of range (e.g., >100)", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Akuntansi");
        await test_util_1.TutonTest.createItems(course.id);
        const d2 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 2);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ items: [{ itemId: d2.id, nilai: 120 }] }); // invalid
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should reject empty payload (items required)", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Sosiologi");
        await test_util_1.TutonTest.createItems(course.id);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ items: [] });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 404 when course not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/999999/items/bulk-nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ items: [{ itemId: 1, nilai: 80 }] });
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 if any item does not belong to the course", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const c1 = await test_util_1.TutonTest.createCourse(cust.id, "Biologi");
        const c2 = await test_util_1.TutonTest.createCourse(cust.id, "Fisika");
        await test_util_1.TutonTest.createItems(c1.id);
        await test_util_1.TutonTest.createItems(c2.id);
        const i1 = await test_util_1.TutonTest.findItem(c1.id, prisma_1.JenisTugas.DISKUSI, 3);
        const iWrong = await test_util_1.TutonTest.findItem(c2.id, prisma_1.JenisTugas.DISKUSI, 4); // beda course
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${c1.id}/items/bulk-nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ items: [{ itemId: i1.id, nilai: 70 }, { itemId: iWrong.id, nilai: 80 }] });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Psikologi");
        await test_util_1.TutonTest.createItems(course.id);
        const d3 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 3);
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/tuton-courses/${course.id}/items/bulk-nilai`)
            .send({ items: [{ itemId: d3.id, nilai: 65 }] });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
describe("GET /api/tuton-courses/:courseId/summary", () => {
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
    it("should return correct summary for OWNER", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Manajemen");
        await test_util_1.TutonTest.createItems(course.id); // 19 items (8 diskusi, 8 absen, 3 tugas)
        // Tandai 3 diskusi + 2 absen + 1 tugas = 6 selesai
        const d1 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 1);
        const d2 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 2);
        const d3 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 3);
        const a1 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.ABSEN, 1);
        const a2 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.ABSEN, 2);
        const t3 = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.TUGAS, 3);
        await database_1.prismaClient.$transaction([
            database_1.prismaClient.tutonItem.update({ where: { id: d1.id }, data: { status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.update({ where: { id: d2.id }, data: { status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.update({ where: { id: d3.id }, data: { status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.update({ where: { id: a1.id }, data: { status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.update({ where: { id: a2.id }, data: { status: prisma_1.StatusTugas.SELESAI } }),
            database_1.prismaClient.tutonItem.update({ where: { id: t3.id }, data: { status: prisma_1.StatusTugas.SELESAI } }),
        ]);
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/${course.id}/summary`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const data = res.body.data;
        // Bentuk response boleh sedikit beda, tapi pastikan ada info kunci:
        expect(data).toHaveProperty("courseId", course.id);
        // total items & completed (harus 19 & 6)
        const totals = data.totals || data.total || data.summary || data;
        expect(totals.totalItems ?? data.totalItems).toBe(19);
        const completed = totals.completedItems ?? data.completedItems;
        expect(completed).toBe(6);
        // persen progres antara 0..100 (≈ 6/19*100)
        const percent = totals.completionPercent ?? totals.percent ?? data.completionPercent;
        expect(typeof percent).toBe("number");
        expect(percent).toBeGreaterThanOrEqual(0);
        expect(percent).toBeLessThanOrEqual(100);
        // breakdown per jenis (kalau disediakan)
        if (data.jenis) {
            expect(data.jenis.DISKUSI.total).toBe(8);
            expect(data.jenis.ABSEN.total).toBe(8);
            expect(data.jenis.TUGAS.total).toBe(3);
            expect(typeof data.jenis.DISKUSI.selesai).toBe("number");
            expect(typeof data.jenis.ABSEN.selesai).toBe("number");
            expect(typeof data.jenis.TUGAS.selesai).toBe("number");
        }
    });
    it("should allow USER to get summary", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Hukum");
        await test_util_1.TutonTest.createItems(course.id);
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/${course.id}/summary`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("courseId", course.id);
    });
    it("should handle course with no items (not initialized): totals=0", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Sosiologi");
        // tidak createItems
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/${course.id}/summary`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const tot = res.body.data.totals ?? res.body.data;
        expect(tot.totalItems ?? res.body.data.totalItems).toBe(0);
        expect((tot.completedItems ?? res.body.data.completedItems) ?? 0).toBe(0);
    });
    it("should return 404 when course not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/999999/summary`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when courseId is invalid (non-numeric)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/abc/summary`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        const cust = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(cust.id, "Biologi");
        await test_util_1.TutonTest.createItems(course.id);
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/${course.id}/summary`);
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
