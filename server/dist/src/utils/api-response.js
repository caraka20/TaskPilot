"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponseFromCode = exports.errorResponse = exports.successResponse = void 0;
const error_codes_1 = require("./error-codes");
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        message,
        data,
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, message = 'Something went wrong', statusCode = 500, code = 'INTERNAL_SERVER_ERROR', errors) => {
    return res.status(statusCode).json({
        status: 'error',
        code,
        message,
        errors,
    });
};
exports.errorResponse = errorResponse;
const errorResponseFromCode = (res, code, errors) => {
    const def = error_codes_1.ERROR_DEFINITIONS[code];
    return (0, exports.errorResponse)(res, def.message, def.httpStatus, code, errors);
};
exports.errorResponseFromCode = errorResponseFromCode;
