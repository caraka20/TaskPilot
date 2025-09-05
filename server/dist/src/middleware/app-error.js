"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
const error_codes_1 = require("../utils/error-codes");
class AppError extends Error {
    constructor(message, code, statusCode, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
    static fromCode(code, details) {
        const def = error_codes_1.ERROR_DEFINITIONS[code];
        return new AppError(def.message, code, def.httpStatus, details);
    }
}
exports.AppError = AppError;
