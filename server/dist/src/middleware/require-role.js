"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const app_error_1 = require("./app-error");
const error_codes_1 = require("../utils/error-codes");
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role || !allowedRoles.includes(role)) {
            throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN);
        }
        next();
    };
}
