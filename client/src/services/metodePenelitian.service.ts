import httpClient from "../lib/httpClient";
import { apiGet, apiPut } from "../lib/http";
import type {
  KarilDetail,
  KarilListResponse,
  UpsertKarilPayload,
} from "./karil.service";

export type MetodePenelitianPayload = UpsertKarilPayload;
export type MetodePenelitianDetail = KarilDetail;
export type MetodePenelitianListResponse = KarilListResponse;

export type MetodePenelitianListParams = {
  q?: string;
  page?: number;
  limit?: number;
  progress?: "all" | "complete" | "incomplete";
  tugasBelum?: "all" | "1" | "2" | "3" | "4";
  sortBy?: "updatedAt" | "createdAt" | "namaCustomer" | "nim";
  sortDir?: "asc" | "desc";
};

export async function listMetodePenelitian(params: MetodePenelitianListParams) {
  return apiGet<MetodePenelitianListResponse>(httpClient, "/api/metode-penelitian", params);
}

export async function getMetodePenelitianDetail(customerId: number | string) {
  return apiGet<MetodePenelitianDetail>(httpClient, `/api/customers/${customerId}/metode-penelitian`);
}

export async function upsertMetodePenelitianDetail(
  customerId: number | string,
  payload: MetodePenelitianPayload
) {
  return apiPut<MetodePenelitianDetail, MetodePenelitianPayload>(
    httpClient,
    `/api/customers/${customerId}/metode-penelitian`,
    payload,
  );
}
