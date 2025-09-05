"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const test_util_1 = require("./test-util");
describe("GET /api/tuton-courses/conflicts", () => {
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
    it("should return conflict groups when same matkul appears on multiple customers (OWNER)", async () => {
        const [c1, c2, c3] = await test_util_1.CustomerTest.createMany(3);
        const matkul = "MAN101 - Manajemen";
        await test_util_1.TutonTest.createCourseFor(c1.id, matkul);
        await test_util_1.TutonTest.createCourseFor(c2.id, matkul);
        await test_util_1.TutonTest.createCourseFor(c3.id, matkul);
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton-courses/conflicts")
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        const groups = res.body.data;
        expect(Array.isArray(groups)).toBe(true);
        // cari grup untuk matkul tsb
        const group = groups.find(g => g.matkul === matkul);
        expect(group).toBeTruthy();
        expect(group.total).toBe(3);
        expect(Array.isArray(group.customers)).toBe(true);
        expect(group.customers.length).toBe(3);
        // first non-duplicate, others duplicate
        expect(group.customers[0].isDuplicate).toBe(false);
        expect(group.customers[1].isDuplicate).toBe(true);
        expect(group.customers[2].isDuplicate).toBe(true);
    });
    it("should allow USER to access conflicts", async () => {
        const [a, b] = await test_util_1.CustomerTest.createMany(2);
        const matkul = "STAT101 - Statistika";
        await test_util_1.TutonTest.createCourseFor(a.id, matkul);
        await test_util_1.TutonTest.createCourseFor(b.id, matkul);
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton-courses/conflicts")
            .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(Array.isArray(res.body.data)).toBe(true);
    });
    it("should return empty array when no conflicts", async () => {
        const c = await test_util_1.CustomerTest.createWith();
        await test_util_1.TutonTest.createCourseFor(c.id, "FIS101 - Fisika");
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/tuton-courses/conflicts")
            .set("Authorization", `Bearer ${ownerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(0); // tidak ada matkul yg > 1
    });
    it("should return 401 when no token", async () => {
        const res = await (0, supertest_1.default)(app_1.default).get("/api/tuton-courses/conflicts");
        expect(res.status).toBe(401);
        expect(res.body.status).toBe("error");
    });
});
