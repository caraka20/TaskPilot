"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = __importDefault(require("./dashboard.service"));
const response_handler_1 = require("../../utils/response-handler");
const app_error_1 = require("../../middleware/app-error");
const error_codes_1 = require("../../utils/error-codes");
const prisma_1 = require("../../generated/prisma");
class DashboardController {
    static async summary(req, res, next) {
        try {
            if (!req.user?.username || !req.user?.role)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.UNAUTHORIZED);
            if (req.user.role !== prisma_1.Role.OWNER)
                throw app_error_1.AppError.fromCode(error_codes_1.ERROR_CODE.FORBIDDEN);
            const data = await dashboard_service_1.default.getSummary();
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DashboardController = DashboardController;
exports.default = DashboardController;
