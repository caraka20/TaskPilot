import httpClient from "../lib/httpClient";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/http";
import type {
  CustomerDetail,
  CustomerItem,
  CustomerListResponse,
  ListParams,
  CreateCustomerPayload,
  AddPaymentPayload,
  PaymentsListParams,
  PaymentsListResponse,
  TutonSummary,
} from "../utils/customer";

const base = "/api/customers";

export function createCustomer(payload: CreateCustomerPayload) {
  return apiPost<CustomerItem, CreateCustomerPayload>(httpClient, base, payload);
}

export function getCustomers(params: Partial<ListParams> = {}) {
  // rakit query; biarkan undefined dibersihkan oleh cleanParams di http.ts
  const query: Record<string, unknown> = {
    q: params.q,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  };

  // Filter jenis — kirim hanya jika dipilih (TUTON | KARIL | TK)
  if (params.jenis) query.jenis = params.jenis;

  return apiGet<CustomerListResponse>(httpClient, base, query);
}

export function getCustomerById(id: string | number) {
  return apiGet<CustomerDetail>(httpClient, `${base}/${id}`);
}

export function deleteCustomer(id: string | number) {
  return apiDelete<{ deleted: boolean }>(httpClient, `${base}/${id}`);
}

/* ===== payments ===== */
export function addCustomerPayment(id: string | number, payload: AddPaymentPayload) {
  return apiPost<CustomerItem, AddPaymentPayload>(httpClient, `${base}/${id}/payments`, payload);
}

export function listCustomerPayments(id: string | number, params: PaymentsListParams) {
  return apiGet<PaymentsListResponse>(httpClient, `${base}/${id}/payments`, params as Record<string, unknown>);
}

export function updateInvoiceTotal(id: string | number, payload: { totalBayar: number }) {
  return apiPatch<CustomerItem, { totalBayar: number }>(httpClient, `${base}/${id}/invoice`, payload);
}

/* ===== tuton summary ===== */
export function getTutonSummary(id: string | number) {
  return apiGet<TutonSummary>(httpClient, `${base}/${id}/tuton-summary`);
}
