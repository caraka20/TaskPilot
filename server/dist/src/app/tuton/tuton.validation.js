"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutonValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const prisma_1 = require("../../generated/prisma");
class TutonValidation {
}
exports.TutonValidation = TutonValidation;
// ==== EXISTING ====
TutonValidation.ADD_COURSE_BODY = zod_1.default.object({
    matkul: zod_1.default.string().min(2).max(200),
    generateItems: zod_1.default.boolean().optional(), // default true di controller
});
TutonValidation.CUSTOMER_ID_PARAM = zod_1.default.object({
    id: zod_1.default.coerce.number().int().positive(),
});
TutonValidation.COURSE_ID_PARAM = zod_1.default.object({
    courseId: zod_1.default.coerce.number().int().positive(),
});
TutonValidation.CONFLICT_MATKUL_PARAM = zod_1.default.object({
    matkul: zod_1.default.string().min(2).max(150),
});
// ==== NEW ====
// GET /api/tuton/subjects?q=...
TutonValidation.SUBJECTS_QUERY = zod_1.default.object({
    q: zod_1.default.string().min(1).max(200).optional(),
});
// GET /api/tuton/scan?jenis=&sesi=&status=&matkul=&page=&pageSize=
TutonValidation.SCAN_QUERY = zod_1.default.object({
    matkul: zod_1.default.string().min(1).max(200).optional(),
    jenis: zod_1.default.nativeEnum(prisma_1.JenisTugas).optional(),
    sesi: zod_1.default.coerce.number().int().min(1).max(16).optional(),
    status: zod_1.default.nativeEnum(prisma_1.StatusTugas).optional().default(prisma_1.StatusTugas.BELUM),
    page: zod_1.default.coerce.number().int().min(1).optional().default(1),
    pageSize: zod_1.default.coerce.number().int().min(1).max(200).optional().default(50),
});
