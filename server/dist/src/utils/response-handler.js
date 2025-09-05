"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
class ResponseHandler {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            status: 'success',
            message,
            data,
        });
    }
    static error(res, message = 'Something went wrong', statusCode = 500) {
        return res.status(statusCode).json({
            status: 'error',
            message,
        });
    }
    static validationError(res, errors, message = 'Validation failed', statusCode = 400) {
        return res.status(statusCode).json({
            status: 'error',
            message,
            errors,
        });
    }
}
exports.ResponseHandler = ResponseHandler;
