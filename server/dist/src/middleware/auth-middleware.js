"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const app_error_1 = require("./app-error");
const error_codes_1 = require("../utils/error-codes");
const database_1 = require("../config/database");
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
    }
    const token = authHeader.split(' ')[1];
    const payload = (0, jwt_1.verifyToken)(token);
    if (!payload || !payload.username) {
        throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
    }
    const user = await database_1.prismaClient.user.findUnique({
        where: { username: payload.username },
    });
    if (!user) {
        throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
    }
    req.user = user;
    next();
};
exports.authMiddleware = authMiddleware;
