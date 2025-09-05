"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const validation_1 = require("../../middleware/validation");
const response_handler_1 = require("../../utils/response-handler");
const customer_validation_1 = require("./customer.validation");
const customer_service_1 = require("./customer.service");
class CustomerController {
    static async create(req, res, next) {
        try {
            const body = await validation_1.Validation.validate(customer_validation_1.CustomerValidation.CREATE, req.body);
            const data = await customer_service_1.CustomerService.create(body);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async detail(req, res, next) {
        try {
            const { id } = customer_validation_1.CustomerValidation.PARAMS_ID.parse(req.params);
            const data = await customer_service_1.CustomerService.detail(id);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async addPayment(req, res, next) {
        try {
            // params & body tervalidasi + coerce (number/date)
            const { id } = validation_1.Validation.validate(customer_validation_1.CustomerValidation.ID_PARAM, req.params);
            const body = validation_1.Validation.validate(customer_validation_1.CustomerValidation.ADD_PAYMENT, req.body);
            const data = await customer_service_1.CustomerService.addPayment(Number(id), body);
            return response_handler_1.ResponseHandler.success(res, data, 'Pembayaran tercatat & saldo diperbarui');
        }
        catch (err) {
            next(err);
        }
    }
    // PATCH /api/customers/:id/invoice  (OWNER)
    static async updateInvoice(req, res, next) {
        try {
            const { id } = validation_1.Validation.validate(customer_validation_1.CustomerValidation.ID_PARAM, req.params);
            const { totalBayar } = validation_1.Validation.validate(customer_validation_1.CustomerValidation.UPDATE_INVOICE, req.body);
            const data = await customer_service_1.CustomerService.updateInvoiceTotal(Number(id), totalBayar);
            return response_handler_1.ResponseHandler.success(res, data, 'Total tagihan diperbarui');
        }
        catch (err) {
            next(err);
        }
    }
    // GET /api/customers/:id/payments  (OWNER; buka untuk USER jika ingin)
    static async listPayments(req, res, next) {
        try {
            const { id } = validation_1.Validation.validate(customer_validation_1.CustomerValidation.ID_PARAM, req.params);
            const query = validation_1.Validation.validate(customer_validation_1.CustomerValidation.PAYMENTS_LIST_QUERY, req.query);
            const data = await customer_service_1.CustomerService.listPayments(Number(id), query);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async remove(req, res, next) {
        try {
            const { id } = await validation_1.Validation.validate(customer_validation_1.CustomerValidation.ID_PARAM, req.params);
            const data = await customer_service_1.CustomerService.remove(id);
            return response_handler_1.ResponseHandler.success(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    static async getTutonSummary(req, res, next) {
        try {
            const { id } = await validation_1.Validation.validate(customer_validation_1.CustomerValidation.TUTON_SUMMARY_PARAM, req.params);
            const result = await customer_service_1.CustomerService.getTutonSummary(id);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const query = await validation_1.Validation.validate(customer_validation_1.CustomerValidation.LIST_QUERY, req.query);
            const result = await customer_service_1.CustomerService.list(query);
            return response_handler_1.ResponseHandler.success(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CustomerController = CustomerController;
