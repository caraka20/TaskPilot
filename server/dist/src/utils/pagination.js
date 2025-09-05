"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = getPagination;
function getPagination(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
