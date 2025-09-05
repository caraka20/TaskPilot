"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GajiValidation = void 0;
const zod_1 = __importDefault(require("zod"));
class GajiValidation {
}
exports.GajiValidation = GajiValidation;
GajiValidation.CREATE = zod_1.default.object({
    username: zod_1.default.string().min(3).max(100),
    jumlahBayar: zod_1.default.number().min(1),
    catatan: zod_1.default.string().nullable().optional(),
});
GajiValidation.UPDATE = zod_1.default
    .object({
    jumlahBayar: zod_1.default.number().min(1).optional(),
    catatan: zod_1.default.string().nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi',
});
// Query GET /api/gaji/me
GajiValidation.GET_MY = zod_1.default.object({
    page: zod_1.default.union([zod_1.default.number(), zod_1.default.string().regex(/^\d+$/)]).default(1).transform(Number),
    limit: zod_1.default.union([zod_1.default.number(), zod_1.default.string().regex(/^\d+$/)]).default(10).transform(Number),
    'tanggalBayar.gte': zod_1.default.string().regex(/^\d{4}-\d{2}-\d{2}($|T)/).optional(),
    'tanggalBayar.lte': zod_1.default.string().regex(/^\d{4}-\d{2}-\d{2}($|T)/).optional(),
    sort: zod_1.default.enum(['asc', 'desc']).optional().default('desc'),
});
// GET /api/gaji/summary (OWNER): period = total | minggu | bulan
GajiValidation.SUMMARY_QUERY = zod_1.default.object({
    period: zod_1.default.enum(['total', 'minggu', 'bulan']).default('total'),
});
