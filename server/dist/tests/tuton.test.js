"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const test_util_1 = require("./test-util");
describe("POST /api/customers/:id/tuton-courses", () => {
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
    it("should allow OWNER to add a course and auto-generate 19 items", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/customers/${customer.id}/tuton-courses`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ matkul: "MAN101 - Manajemen" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const data = res.body.data;
        expect(data).toHaveProperty("id");
        expect(data).toHaveProperty("customerId", customer.id);
        expect(data).toHaveProperty("matkul", "MAN101 - Manajemen");
        expect(data).toHaveProperty("totalItems", 19);
        expect(data).toHaveProperty("completedItems", 0);
        // optional verif langsung ke DB
        const itemCount = await test_util_1.TutonTest.countItems(data.id);
        expect(itemCount).toBe(19);
    });
    it("should allow USER to add a course (route allows USER)", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/customers/${customer.id}/tuton-courses`)
            .set("Authorization", `Bearer ${userToken}`)
            .send({ matkul: "EKM201 - Ekonomi Manajerial" });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data.customerId).toBe(customer.id);
    });
    it("should support generateItems=false (no default items created)", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/customers/${customer.id}/tuton-courses`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ matkul: "STAT101 - Statistika", generateItems: false });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data.totalItems).toBe(0);
        const itemCount = await test_util_1.TutonTest.countItems(res.body.data.id);
        expect(itemCount).toBe(0);
    });
    it("should return 400 when course with same matkul already exists for the customer", async () => {
        const customer = await test_util_1.CustomerTest.create();
        await test_util_1.TutonTest.createCourse(customer.id, "DUP-001");
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/customers/${customer.id}/tuton-courses`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ matkul: "DUP-001" });
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 404 when customer not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/customers/999999/tuton-courses`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({ matkul: "NO-CUST" });
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when body is invalid (missing matkul)", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/customers/${customer.id}/tuton-courses`)
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token is provided", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const res = await (0, supertest_1.default)(app_1.default)
            .post(`/api/customers/${customer.id}/tuton-courses`)
            .send({ matkul: "NO-AUTH" });
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
describe("DELETE /api/tuton-courses/:courseId", () => {
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
    it("should allow OWNER to delete a course and cascade delete its items", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(customer.id, "MAN101 - Manajemen");
        await test_util_1.TutonTest.createItems(course.id);
        // pre-check
        const before = await test_util_1.TutonTest.countItems(course.id);
        expect(before).toBe(19);
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/tuton-courses/${course.id}`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data.deleted).toBe(true);
        // items must be gone
        const after = await test_util_1.TutonTest.countItems(course.id);
        expect(after).toBe(0);
    });
    it("should allow USER to delete a course (route allows USER)", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(customer.id, "EKM201 - Ekonomi Manajerial");
        await test_util_1.TutonTest.createItems(course.id);
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/tuton-courses/${course.id}`)
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data.deleted).toBe(true);
        // pastikan item juga terhapus
        const after = await test_util_1.TutonTest.countItems(course.id);
        expect(after).toBe(0);
    });
    it("should return 404 when course not found", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/tuton-courses/999999`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(404);
        expect(res.body.status).toBe("error");
    });
    it("should return 400 when courseId is invalid (non-numeric)", async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/tuton-courses/abc`)
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(400);
        expect(res.body.status).toBe("error");
    });
    it("should return 401 when no token is provided", async () => {
        const customer = await test_util_1.CustomerTest.create();
        const course = await test_util_1.TutonTest.createCourse(customer.id, "STAT101 - Statistika");
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/tuton-courses/${course.id}`);
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
