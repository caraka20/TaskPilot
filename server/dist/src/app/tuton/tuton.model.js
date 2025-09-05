"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTutonCourseResponse = toTutonCourseResponse;
function toTutonCourseResponse(c) {
    return {
        id: c.id,
        customerId: c.customerId,
        matkul: c.matkul,
        totalItems: c.totalItems,
        completedItems: c.completedItems,
    };
}
