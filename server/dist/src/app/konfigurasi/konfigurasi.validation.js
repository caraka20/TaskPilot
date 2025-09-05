"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KonfigurasiValidation = void 0;
const zod_1 = require("zod");
function atLeastOneKey() {
    return (val, ctx) => {
        if (Object.keys(val ?? {}).length === 0) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Minimal satu field harus diisi",
            });
        }
    };
}
class KonfigurasiValidation {
}
exports.KonfigurasiValidation = KonfigurasiValidation;
// PATCH /api/konfigurasi
KonfigurasiValidation.UPDATE_GLOBAL = zod_1.z
    .object({
    gajiPerJam: zod_1.z.number().min(1000).optional(),
    batasJedaMenit: zod_1.z.number().min(1).max(120).optional(),
    jedaOtomatisAktif: zod_1.z.boolean().optional(),
})
    .superRefine(atLeastOneKey());
// GET /api/konfigurasi/effective?username=...
KonfigurasiValidation.GET_EFFECTIVE = zod_1.z.object({
    username: zod_1.z.string().min(6).max(20),
});
// PUT /api/konfigurasi/overrides/:username
KonfigurasiValidation.PUT_OVERRIDE = zod_1.z
    .object({
    gajiPerJam: zod_1.z.number().min(1000).optional(),
    batasJedaMenit: zod_1.z.number().min(1).max(120).optional(),
    jedaOtomatisAktif: zod_1.z.boolean().optional(),
})
    .superRefine(atLeastOneKey());
KonfigurasiValidation.PARAM_USERNAME = zod_1.z.object({
    username: zod_1.z.string().min(6).max(20),
});
KonfigurasiValidation.DELETE_OVERRIDE = zod_1.z.object({
    username: zod_1.z.string().min(1, "Username wajib diisi"),
});
