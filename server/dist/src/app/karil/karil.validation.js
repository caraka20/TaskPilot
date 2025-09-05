"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarilListQueryValidation = exports.KarilBodyValidation = exports.KarilParamValidation = void 0;
// src/app/karil/karil.validation.ts
const zod_1 = require("zod");
exports.KarilParamValidation = zod_1.z.object({
    id: zod_1.z.string().regex(/^\d+$/).transform(Number).pipe(zod_1.z.number().int().positive()),
});
exports.KarilBodyValidation = zod_1.z.object({
    judul: zod_1.z.string().min(3, "Judul minimal 3 karakter"),
    tugas1: zod_1.z.boolean().optional(),
    tugas2: zod_1.z.boolean().optional(),
    tugas3: zod_1.z.boolean().optional(),
    tugas4: zod_1.z.boolean().optional(),
    keterangan: zod_1.z.string().max(1000, "Keterangan terlalu panjang").optional(),
});
exports.KarilListQueryValidation = zod_1.z.object({
    q: zod_1.z.string().trim().min(1).max(100).optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    progress: zod_1.z.enum(["all", "complete", "incomplete"]).default("all"),
    sortBy: zod_1.z.enum(["updatedAt", "createdAt", "namaCustomer", "nim"]).default("updatedAt"),
    sortDir: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
