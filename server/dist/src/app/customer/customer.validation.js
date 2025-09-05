"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const prisma_1 = require("../../generated/prisma");
class CustomerValidation {
}
exports.CustomerValidation = CustomerValidation;
_a = CustomerValidation;
CustomerValidation.ID_PARAM = zod_1.default.object({
    id: zod_1.default.coerce.number().int().positive(),
});
/** body untuk POST /api/customers */
CustomerValidation.CREATE = zod_1.default.object({
    namaCustomer: zod_1.default.string().min(2, "Nama minimal 2 karakter").max(200),
    noWa: zod_1.default.string().min(5, "No WA tidak valid").max(30),
    nim: zod_1.default.string().min(3, "NIM tidak valid").max(191), // 191 aman utk unique index MySQL
    password: zod_1.default.string().min(6, "Password minimal 6 karakter"),
    jurusan: zod_1.default.string().min(2).max(200),
    jenis: zod_1.default.nativeEnum(prisma_1.JenisUT),
    totalBayar: zod_1.default.number().min(0).optional(),
    sudahBayar: zod_1.default.number().min(0).optional(),
}).superRefine((v, ctx) => {
    const total = v.totalBayar ?? 0;
    const sudah = v.sudahBayar ?? 0;
    if (sudah > total) {
        ctx.addIssue({ code: zod_1.default.ZodIssueCode.custom, path: ["sudahBayar"], message: "sudahBayar tidak boleh melebihi totalBayar" });
    }
});
// OWNER menambah transaksi pembayaran customer
CustomerValidation.ADD_PAYMENT = zod_1.default.object({
    amount: zod_1.default.coerce.number().positive(),
    catatan: zod_1.default.string().max(200).optional(),
    tanggalBayar: zod_1.default.coerce.date().optional(),
});
// OWNER mengubah total tagihan (invoice total)
CustomerValidation.UPDATE_INVOICE = zod_1.default.object({
    totalBayar: zod_1.default.coerce.number().min(0),
});
// List histori pembayaran customer
CustomerValidation.PAYMENTS_LIST_QUERY = zod_1.default.object({
    page: zod_1.default.coerce.number().int().positive().default(1),
    limit: zod_1.default.coerce.number().int().min(1).max(100).default(10),
    sortDir: zod_1.default.enum(['asc', 'desc']).default('desc'),
    start: zod_1.default.coerce.date().optional(),
    end: zod_1.default.coerce.date().optional(),
});
CustomerValidation.TUTON_SUMMARY_PARAM = zod_1.default.object({
    id: zod_1.default.coerce.number().int().positive(),
});
CustomerValidation.JENIS_Q = zod_1.default.preprocess((val) => {
    if (Array.isArray(val))
        return val; // jenis[]=TUTON&jenis[]=KARIL
    if (typeof val === "string" && val.includes(",")) {
        return val.split(",").map((s) => s.trim()).filter(Boolean); // jenis=KARIL,TUTON
    }
    return val;
}, zod_1.default.union([
    zod_1.default.nativeEnum(prisma_1.JenisUT),
    zod_1.default.array(zod_1.default.nativeEnum(prisma_1.JenisUT)).min(1),
]).optional());
CustomerValidation.LIST_QUERY = zod_1.default.object({
    q: zod_1.default.string().trim().min(1).max(100).optional(),
    page: zod_1.default.coerce.number().int().positive().default(1),
    limit: zod_1.default.coerce.number().int().min(1).max(100).default(10),
    sortBy: zod_1.default.enum(["namaCustomer", "nim", "createdAt"]).default("createdAt"),
    sortDir: zod_1.default.enum(["asc", "desc"]).default("desc"),
    /** ⬅️ NEW */
    jenis: _a.JENIS_Q,
});
CustomerValidation.PARAMS_ID = zod_1.default.object({
    id: zod_1.default.coerce.number().int().positive(),
});
