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
describe("GET /api/tuton-courses/:courseId/items", () => {
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
    it("should return 19 items for an existing course (OWNER)", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(customer.id, "MAN101 - Manajemen");
        await test_util_1.TutonTest.createItems(course.id); // 8 diskusi + 8 absen + 3 tugas
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/${course.id}/items`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(19);
        const items = res.body.data;
        // struktur minimum
        const sample = items[0];
        expect(sample).toHaveProperty("id");
        expect(sample).toHaveProperty("courseId", course.id);
        expect(sample).toHaveProperty("jenis");
        expect(sample).toHaveProperty("sesi");
        expect(sample).toHaveProperty("status");
        expect(sample).toHaveProperty("nilai");
        // validasi komposisi
        const diskusi = items.filter(i => i.jenis === "DISKUSI").length;
        const absen = items.filter(i => i.jenis === "ABSEN").length;
        const tugas = items.filter(i => i.jenis === "TUGAS").length;
        expect(diskusi).toBe(8);
        expect(absen).toBe(8);
        expect(tugas).toBe(3);
    });
    it("should allow USER to list items", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(customer.id, "EKM201 - Ekonomi Manajerial");
        await test_util_1.TutonTest.createItems(course.id);
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/${course.id}/items`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(Array.isArray(res.body.data)).toBe(true);
    });
    it("should return 404 when course not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/999999/items`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when courseId is invalid (non-numeric)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/abc/items`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        // siapkan course valid
        const customer = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(customer.id, "STAT101 - Statistika");
        await test_util_1.TutonTest.createItems(course.id);
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/tuton-courses/${course.id}/items`);
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
describe("PATCH /api/tuton-items/:itemId", () => {
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
    it("should update status to SELESAI and set selesaiAt (OWNER)", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "MAN101 - Manajemen");
        await test_util_1.TutonTest.createItems(course.id);
        const item = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 7);
        expect(item).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ status: "SELESAI" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("id", item.id);
        expect(res.body.data).toHaveProperty("status", "SELESAI");
        expect(res.body.data.selesaiAt).toBeTruthy();
    });
    it("should allow USER to update nilai on DISKUSI", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "EKM201 - Ekonomi Manajerial");
        await test_util_1.TutonTest.createItems(course.id);
        const item = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 3);
        expect(item).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ nilai: 88 });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("nilai", 88);
    });
    it("should reject setting nilai for ABSEN (400)", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "STAT101 - Statistika");
        await test_util_1.TutonTest.createItems(course.id);
        const absen = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.ABSEN, 2);
        expect(absen).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${absen.id}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ nilai: 75 });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should update multiple fields at once (status + nilai + deskripsi)", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "PSI101 - Pengantar Psikologi");
        await test_util_1.TutonTest.createItems(course.id);
        const tugas = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.TUGAS, 5);
        expect(tugas).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${tugas.id}`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ status: "SELESAI", nilai: 95, deskripsi: "ok" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("status", "SELESAI");
        expect(res.body.data).toHaveProperty("nilai", 95);
        expect(res.body.data).toHaveProperty("deskripsi", "ok");
        expect(res.body.data.selesaiAt).toBeTruthy();
    });
    it("should return 404 when item not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/999999`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ status: "SELESAI" });
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when itemId is invalid (non-numeric)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/abc`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ status: "SELESAI" });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "BIO101 - Biologi Dasar");
        await test_util_1.TutonTest.createItems(course.id);
        const item = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 1);
        expect(item).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}`)
            .send({ status: "SELESAI" });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
describe("PATCH /api/tuton-items/:itemId/status", () => {
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
    it("should set status to SELESAI and update selesaiAt & course.completedItems (OWNER)", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "MAN101 - Manajemen");
        await test_util_1.TutonTest.createItems(course.id);
        // ambil item diskusi sesi 7
        const item = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 7);
        expect(item).toBeTruthy();
        // sebelum update, completedItems = 0
        let before = await database_1.prismaClient.tutonCourse.findUnique({ where: { id: course.id } });
        expect(before?.completedItems).toBe(0);
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}/status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ status: "SELESAI" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("id", item.id);
        expect(res.body.data).toHaveProperty("status", "SELESAI");
        expect(res.body.data.selesaiAt).toBeTruthy();
        // setelah update, completedItems = 1
        const after = await database_1.prismaClient.tutonCourse.findUnique({ where: { id: course.id } });
        expect(after?.completedItems).toBe(1);
    });
    it("should allow USER to set status back to BELUM and clear selesaiAt", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "EKM201 - Ekonomi Manajerial");
        await test_util_1.TutonTest.createItems(course.id);
        const item = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 3);
        expect(item).toBeTruthy();
        // set ke SELESAI dulu
        await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}/status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ status: "SELESAI" })
            .expect(200);
        // lalu balikin ke BELUM
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}/status`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ status: "BELUM" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("status", "BELUM");
        expect(res.body.data.selesaiAt).toBeNull();
    });
    it("should return 400 when status is invalid", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "STAT101 - Statistika");
        await test_util_1.TutonTest.createItems(course.id);
        const item = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.ABSEN, 2);
        expect(item).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}/status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ status: "DONE" });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 404 when item not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/999999/status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ status: "SELESAI" });
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when itemId is invalid (non-numeric)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/abc/status`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ status: "SELESAI" });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "BIO101 - Biologi Dasar");
        await test_util_1.TutonTest.createItems(course.id);
        const item = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.TUGAS, 5);
        expect(item).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}/status`)
            .send({ status: "SELESAI" });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
describe("PATCH /api/tuton-items/:itemId/nilai", () => {
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
    it("should allow OWNER to set nilai for DISKUSI", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "MAN101 - Manajemen");
        await test_util_1.TutonTest.createItems(course.id);
        const item = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 7);
        expect(item).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${item.id}/nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ nilai: 88 });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("id", item.id);
        expect(res.body.data).toHaveProperty("nilai", 88);
    });
    it("should allow USER to set nilai for TUGAS", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "EKM201 - Ekonomi Manajerial");
        await test_util_1.TutonTest.createItems(course.id);
        const tugas = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.TUGAS, 5);
        expect(tugas).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${tugas.id}/nilai`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ nilai: 95 });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("nilai", 95);
    });
    it("should allow clearing nilai (set to null)", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "PSI101 - Pengantar Psikologi");
        await test_util_1.TutonTest.createItems(course.id);
        const diskusi = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 3);
        expect(diskusi).toBeTruthy();
        // set dulu
        await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${diskusi.id}/nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ nilai: 80 })
            .expect(200);
        // lalu clear
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${diskusi.id}/nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ nilai: null });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toHaveProperty("nilai", null);
    });
    it("should return 400 when setting nilai for ABSEN", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "STAT101 - Statistika");
        await test_util_1.TutonTest.createItems(course.id);
        const absen = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.ABSEN, 2);
        expect(absen).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${absen.id}/nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ nilai: 70 });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when nilai is out of range", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "BIO101 - Biologi Dasar");
        await test_util_1.TutonTest.createItems(course.id);
        const diskusi = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.DISKUSI, 1);
        expect(diskusi).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${diskusi.id}/nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ nilai: 120 }); // > 100
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 404 when item not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/999999/nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ nilai: 90 });
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when itemId is invalid (non-numeric)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/abc/nilai`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ nilai: 90 });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token provided", async () => {
        const c = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(c.id, "HIS101 - Sejarah");
        await test_util_1.TutonTest.createItems(course.id);
        const tugas = await test_util_1.TutonTest.findItem(course.id, prisma_1.JenisTugas.TUGAS, 7);
        expect(tugas).toBeTruthy();
        const res = await (0, supertest_1.default)(app_1.default)
            .patch(`/api/tuton-items/${tugas.id}/nilai`)
            .send({ nilai: 85 });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
