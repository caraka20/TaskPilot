// src/lib/http.ts
import type { AxiosInstance } from 'axios'
import type { ApiEnvelope } from './types'

// Query params yang aman untuk axios
export type Query =
  | Record<string, string | number | boolean | null | undefined>
  | undefined

// Body JSON generic
export type Json = Record<string, unknown>

// GET
export async function apiGet<T, Q extends Query = Query>(
  client: AxiosInstance,
  url: string,
  params?: Q
): Promise<T> {
  const res = await client.get<ApiEnvelope<T>>(url, { params })
  return res.data.data
}

// POST
export async function apiPost<T, B extends Json | undefined = undefined>(
  client: AxiosInstance,
  url: string,
  body?: B
): Promise<T> {
  const res = await client.post<ApiEnvelope<T>>(url, body)
  return res.data.data
}

// PATCH
export async function apiPatch<T, B extends Json | undefined = undefined>(
  client: AxiosInstance,
  url: string,
  body?: B
): Promise<T> {
  const res = await client.patch<ApiEnvelope<T>>(url, body)
  return res.data.data
}

// PUT
export async function apiPut<T, B extends Json | undefined = undefined>(
  client: AxiosInstance,
  url: string,
  body?: B
): Promise<T> {
  const res = await client.put<ApiEnvelope<T>>(url, body)
  return res.data.data
}

// DELETE
export async function apiDelete<T>(
  client: AxiosInstance,
  url: string
): Promise<T> {
  const res = await client.delete<ApiEnvelope<T>>(url)
  return res.data.data
}
