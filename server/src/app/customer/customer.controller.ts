import { type Response, type NextFunction } from "express"
import { type UserRequest } from "../../types/user-request"
import { Validation } from "../../middleware/validation"
import { ResponseHandler } from "../../utils/response-handler"
import { CustomerValidation } from "./customer.validation"
import { CustomerService } from "./customer.service"
import { AddCustomerPaymentBody, CreateCustomerRequest, ERequest, IdParam, PaymentsListQueryRaw, UpdateCustomerRequest, UpdateInvoiceBody, UpdatePaymentRequest } from "./customer.model"

export class CustomerController {
  static async create(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const body = await Validation.validate<CreateCustomerRequest>(CustomerValidation.CREATE, req.body)
      const data = await CustomerService.create(body)
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async detail(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = CustomerValidation.PARAMS_ID.parse(req.params)
      const data = await CustomerService.detail(id)
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async addPayment(
    req: ERequest<IdParam, any, AddCustomerPaymentBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      // params & body tervalidasi + coerce (number/date)
      const { id } = Validation.validate(CustomerValidation.ID_PARAM, req.params)
      const body = Validation.validate(CustomerValidation.ADD_PAYMENT, req.body)

      const data = await CustomerService.addPayment(Number(id), body)
      return ResponseHandler.success(res, data, 'Pembayaran tercatat & saldo diperbarui')
    } catch (err) {
      next(err)
    }
  }

  // PATCH /api/customers/:id/invoice  (OWNER)
  static async updateInvoice(
    req: ERequest<IdParam, any, UpdateInvoiceBody>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = Validation.validate(CustomerValidation.ID_PARAM, req.params)
      const { totalBayar } = Validation.validate(CustomerValidation.UPDATE_INVOICE, req.body)

      const data = await CustomerService.updateInvoiceTotal(Number(id), totalBayar)
      return ResponseHandler.success(res, data, 'Total tagihan diperbarui')
    } catch (err) {
      next(err)
    }
  }

  // GET /api/customers/:id/payments  (OWNER; buka untuk USER jika ingin)
  static async listPayments(
    req: ERequest<IdParam, any, any, PaymentsListQueryRaw>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = Validation.validate(CustomerValidation.ID_PARAM, req.params)
      const query = Validation.validate(CustomerValidation.PAYMENTS_LIST_QUERY, req.query)

      const data = await CustomerService.listPayments(Number(id), query)
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async remove(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = await Validation.validate(CustomerValidation.ID_PARAM, req.params as Record<string, any>)
      const data = await CustomerService.remove(id)
      return ResponseHandler.success(res, data)
    } catch (err) {
      next(err)
    }
  }

  static async getTutonSummary(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { id } = await Validation.validate(CustomerValidation.TUTON_SUMMARY_PARAM, req.params as any)
      const result = await CustomerService.getTutonSummary(id)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async list(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const query = await Validation.validate(CustomerValidation.LIST_QUERY, req.query as any)
      const result = await CustomerService.list(query)
      return ResponseHandler.success(res, result)
    } catch (err) {
      next(err)
    }
  }

  static async publicSelfByNim(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const { nim } = CustomerValidation.NIM_PARAM.parse(req.params);
      const data = await CustomerService.publicSelfViewByNim(nim);
      return ResponseHandler.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  static async update(
    req: ERequest<IdParam, any, UpdateCustomerRequest>,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = Validation.validate(CustomerValidation.ID_PARAM, req.params);
      const body = Validation.validate(CustomerValidation.UPDATE, req.body);
      const data = await CustomerService.update(Number(id), body);
      return ResponseHandler.success(res, data, "Data customer diperbarui");
    } catch (err) {
      next(err);
    }
  }
}
