"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JamKerjaValidation = void 0;
const zod_1 = require("zod");
class JamKerjaValidation {
}
exports.JamKerjaValidation = JamKerjaValidation;
JamKerjaValidation.START = zod_1.z.object({
    username: zod_1.z.string().min(3).max(100),
});
JamKerjaValidation.START_BODY_OWNER = zod_1.z.object({
    username: zod_1.z.string().min(3).max(100).optional(),
});
JamKerjaValidation.HISTORY_QUERY = zod_1.z.object({
    username: zod_1.z.string().min(3),
});
JamKerjaValidation.REKAP_QUERY = zod_1.z.object({
    username: zod_1.z.string().min(3),
    period: zod_1.z.enum(["minggu", "bulan"]),
});
// output bertipe wajib: { username; period }
JamKerjaValidation.AKTIF_QUERY = zod_1.z.object({
    username: zod_1.z.string().min(3),
    period: zod_1.z.enum(["minggu", "bulan"]),
});
JamKerjaValidation.OWNER_SUMMARY_QUERY = zod_1.z.object({
    username: zod_1.z.string().min(3).optional(),
});
JamKerjaValidation.USER_SUMMARY_QUERY = zod_1.z.object({
    username: zod_1.z.string().min(3),
});
