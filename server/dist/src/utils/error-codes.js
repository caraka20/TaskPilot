"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_DEFINITIONS = exports.ERROR_CODE = void 0;
exports.ERROR_CODE = {
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    BAD_REQUEST: 'BAD_REQUEST',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    GAJI_EXCEEDS_REMAINING: 'GAJI_EXCEEDS_REMAINING', // ← JANGAN object
};
exports.ERROR_DEFINITIONS = {
    USER_NOT_FOUND: { httpStatus: 404, message: 'User not found' },
    USER_ALREADY_EXISTS: { httpStatus: 409, message: 'Username already exists' },
    VALIDATION_ERROR: { httpStatus: 400, message: 'Validation failed' },
    UNAUTHORIZED: { httpStatus: 401, message: 'Unauthorized access' },
    FORBIDDEN: { httpStatus: 403, message: 'Forbidden request' },
    BAD_REQUEST: { httpStatus: 400, message: 'Bad request' },
    NOT_FOUND: { httpStatus: 404, message: 'Resource not found' },
    INTERNAL_SERVER_ERROR: { httpStatus: 500, message: 'Internal server error' },
    UNKNOWN_ERROR: { httpStatus: 500, message: 'Unknown error occurred' },
    GAJI_EXCEEDS_REMAINING: { httpStatus: 400, message: 'Jumlah bayar melebihi sisa gaji' },
};
