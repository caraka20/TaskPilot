"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutonItemValidation = void 0;
const zod_1 = __importDefault(require("zod"));
const prisma_1 = require("../../generated/prisma");
class TutonItemValidation {
}
exports.TutonItemValidation = TutonItemValidation;
TutonItemValidation.COURSE_ID_PARAM = zod_1.default.object({
    courseId: zod_1.default.coerce.number().int().positive(),
});
TutonItemValidation.ITEM_ID_PARAM = zod_1.default.object({
    itemId: zod_1.default.coerce.number().int().positive(),
});
TutonItemValidation.UPDATE_BODY = zod_1.default.object({
    status: zod_1.default.nativeEnum(prisma_1.StatusTugas).optional(),
    nilai: zod_1.default.number().min(0).max(100).nullable().optional(),
    deskripsi: zod_1.default.string().max(500).nullable().optional(),
    copas: zod_1.default.boolean().optional(),
}).refine(o => Object.keys(o).length > 0, { message: "Minimal satu field harus diisi" });
TutonItemValidation.UPDATE_STATUS_BODY = zod_1.default.object({
    status: zod_1.default.nativeEnum(prisma_1.StatusTugas),
});
TutonItemValidation.UPDATE_NILAI_BODY = zod_1.default.object({
    nilai: zod_1.default.number().min(0).max(100).nullable(),
});
TutonItemValidation.UPDATE_COPAS_BODY = zod_1.default.object({
    copas: zod_1.default.boolean(),
});
TutonItemValidation.PARAMS = zod_1.default.object({
    courseId: zod_1.default.coerce.number().int().positive(),
});
TutonItemValidation.INIT = zod_1.default.object({
    overwrite: zod_1.default.boolean().optional().default(false),
});
TutonItemValidation.BULK_STATUS = zod_1.default.object({
    items: zod_1.default.array(zod_1.default.object({
        itemId: zod_1.default.coerce.number().int().positive(),
        status: zod_1.default.enum(["BELUM", "SELESAI"]),
    })).min(1, "items tidak boleh kosong"),
});
TutonItemValidation.BULK_NILAI = zod_1.default.object({
    items: zod_1.default.array(zod_1.default.object({
        itemId: zod_1.default.coerce.number().int().positive(),
        nilai: zod_1.default.number().min(0).max(100).nullable(),
    })).min(1, "items tidak boleh kosong"),
});
