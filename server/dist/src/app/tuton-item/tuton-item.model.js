"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTutonItemResponse = toTutonItemResponse;
function toTutonItemResponse(item) {
    return {
        id: item.id,
        courseId: item.courseId,
        jenis: String(item.jenis),
        sesi: item.sesi,
        status: String(item.status),
        nilai: item.nilai ?? null,
        deskripsi: item.deskripsi ?? null,
        selesaiAt: item.selesaiAt ?? null,
        copas: !!item.copasSoal,
    };
}
