"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const DateString = zod_1.z
    .string()
    .min(1)
    .refine((s) => {
    const iso = s.length === 10 ? `${s}T00:00:00.000Z` : s;
    return !Number.isNaN(Date.parse(iso));
}, "Invalid date");
class UserValidation {
}
exports.UserValidation = UserValidation;
UserValidation.CREATE = zod_1.z.object({
    password: zod_1.z.string().min(6).max(20),
    namaLengkap: zod_1.z.string().min(6),
    username: zod_1.z.string().min(6).max(10),
});
UserValidation.LOGIN = zod_1.z.object({
    username: zod_1.z.string().min(6).max(20),
    password: zod_1.z.string().min(6).max(20),
});
UserValidation.DETAIL_USER = zod_1.z.object({
    username: zod_1.z.string().min(3).max(50),
});
UserValidation.SET_JEDA_OTOMATIS = zod_1.z.object({
    aktif: zod_1.z.boolean(),
});
// query untuk API agregat
UserValidation.DETAIL_DEEP_QUERY = zod_1.z.object({
    from: DateString.optional(),
    to: DateString.optional(),
    histPage: zod_1.z.coerce.number().int().positive().optional(),
    histLimit: zod_1.z.coerce.number().int().positive().max(100).optional(),
    payPage: zod_1.z.coerce.number().int().positive().optional(),
    payLimit: zod_1.z.coerce.number().int().positive().max(100).optional(),
});
