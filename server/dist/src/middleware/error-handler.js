"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const api_response_1 = require("../utils/api-response");
const app_error_1 = require("./app-error");
const errorHandler = (err, req, res, next) => {
    // Zod validation error
    if (err instanceof zod_1.ZodError) {
        const formattedErrors = err.issues.map((e) => ({
            field: e.path?.join('.') || '(unknown)',
            message: e.message,
        }));
        return (0, api_response_1.errorResponse)(res, 'Validation failed', 400, 'VALIDATION_ERROR', formattedErrors);
    }
    // Custom AppError
    if (err instanceof app_error_1.AppError) {
        return (0, api_response_1.errorResponse)(res, err.message, err.statusCode || 500, err.code || "INTERNAL_SERVER_ERROR", err.details);
    }
    // Generic JavaScript Error
    if (err instanceof Error) {
        return (0, api_response_1.errorResponse)(res, err.message || 'Unexpected error', 500, 'INTERNAL_SERVER_ERROR');
    }
    // Unknown error (fallback)
    return (0, api_response_1.errorResponse)(res, 'Unknown error', 500, 'INTERNAL_SERVER_ERROR');
};
exports.errorHandler = errorHandler;
