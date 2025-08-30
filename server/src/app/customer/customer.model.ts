import { Customer, JenisUT, TutonCourse, KarilDetail } from "../../generated/prisma"
/** Request body untuk create customer */
export interface CreateCustomerRequest {
  namaCustomer: string
  noWa: string
  nim: string
  password: string           // hash di service, bukan di controller/repo
  jurusan: string
  jenis: JenisUT
  totalBayar?: number        // default 0
  sudahBayar?: number        // default 0
}

/** Request body untuk update payment */
export interface UpdatePaymentRequest {
  totalBayar?: number
  sudahBayar?: number
}

/** Response standar untuk customer */
export interface CustomerResponse {
  id: number
  namaCustomer: string
  noWa: string
  nim: string
  jurusan: string
  jenis: JenisUT
  totalBayar: number
  sudahBayar: number
  sisaBayar: number
  createdAt: Date
  updatedAt: Date
}

export interface TutonJenisBreakdown {
  total: number
  selesai: number
  belum: number
  nilaiAvg?: number | null
}

export interface TutonCourseSummary {
  courseId: number
  matkul: string
  totalItems: number
  completedItems: number
  progress: number
  breakdown: {
    DISKUSI: TutonJenisBreakdown
    ABSEN: TutonJenisBreakdown
    TUGAS: TutonJenisBreakdown
  }
  createdAt: Date
  updatedAt: Date
}

export interface CustomerTutonSummaryResponse {
  customerId: number
  namaCustomer: string
  totalCourses: number
  totalItems: number
  totalCompleted: number
  overallProgress: number
  courses: TutonCourseSummary[]
}

/** util hitung sisa bayar (selalu >= 0) */
export function hitungSisaBayar(total = 0, sudah = 0): number {
  const sisa = (total ?? 0) - (sudah ?? 0)
  return sisa > 0 ? +Number(sisa).toFixed(2) : 0
}

/** mapper: Prisma.Customer -> CustomerResponse */
export function toCustomerResponse(c: Customer): CustomerResponse {
  return {
    id: c.id,
    namaCustomer: c.namaCustomer,
    noWa: c.noWa,
    nim: c.nim,
    jurusan: c.jurusan,
    jenis: c.jenis,
    totalBayar: c.totalBayar,
    sudahBayar: c.sudahBayar,
    sisaBayar: c.sisaBayar,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

// QUERY
export type CustomerSortBy = "namaCustomer" | "nim" | "createdAt"
export type SortDir = "asc" | "desc"

export interface CustomerListQuery {
  q?: string;
  page: number;
  limit: number;
  sortBy: CustomerSortBy;
  sortDir: SortDir;
  jenis?: JenisUT | JenisUT[];
}

// RESPONSE
export interface CustomerListItem {
  id: number
  namaCustomer: string
  noWa: string
  nim: string
  jurusan: string
  jenis: JenisUT
  totalBayar: number
  sudahBayar: number
  sisaBayar: number
  createdAt: Date
  updatedAt: Date
  tutonCourseCount: number
}

export interface Paginated<T> {
  items: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// Row type yg cocok dgn SELECT di repository
export type CustomerListRow = Pick<
  Customer,
  | "id"
  | "namaCustomer"
  | "noWa"
  | "nim"
  | "jurusan"
  | "jenis"
  | "totalBayar"
  | "sudahBayar"
  | "sisaBayar"
  | "createdAt"
  | "updatedAt"
> & {
  _count: { tutonCourses: number }
}

export function toCustomerListItem(row: CustomerListRow): CustomerListItem {
  return {
    id: row.id,
    namaCustomer: row.namaCustomer,
    noWa: row.noWa,
    nim: row.nim,
    jurusan: row.jurusan,
    jenis: row.jenis,
    totalBayar: row.totalBayar,
    sudahBayar: row.sudahBayar,
    sisaBayar: row.sisaBayar,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tutonCourseCount: row._count.tutonCourses,
  }
}
// === RESPONSE: detail ===
export interface CustomerDetailResponse {
  id: number
  namaCustomer: string
  noWa: string
  nim: string
  jurusan: string
  jenis: string
  password: string               // ⬅️ tambahkan
  totalBayar: number
  sudahBayar: number
  sisaBayar: number
  tutonCourseCount: number
  hasKaril: boolean
  createdAt: Date
  updatedAt: Date
}

// === Row dari Prisma untuk detail ===
export type CustomerDetailRow = Pick<
  Customer,
  | "id" | "namaCustomer" | "noWa" | "nim" | "jurusan" | "jenis"
  | "password"                   // ⬅️ tambahkan
  | "totalBayar" | "sudahBayar" | "sisaBayar" | "createdAt" | "updatedAt"
> & {
  _count: { tutonCourses: number },
  karil: { id: number } | null
}

export function toCustomerDetailResponse(row: CustomerDetailRow): CustomerDetailResponse {
  return {
    id: row.id,
    namaCustomer: row.namaCustomer,
    noWa: row.noWa,
    nim: row.nim,
    jurusan: row.jurusan,
    jenis: row.jenis,
    password: row.password,          // ⬅️ kirimkan password apa adanya
    totalBayar: row.totalBayar,
    sudahBayar: row.sudahBayar,
    sisaBayar: row.sisaBayar,
    tutonCourseCount: row._count.tutonCourses,
    hasKaril: !!row.karil,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

import type { Request as ExpressRequest } from 'express'

/** Alias Request Express dengan generics, diekspor supaya dipakai controller */
export type ERequest<P = any, ResB = any, ReqB = any, ReqQ = any> =
  ExpressRequest<P, ResB, ReqB, ReqQ>

/** Params */
export type IdParam = { id: string }

/** Bodies */
export type AddCustomerPaymentBody = {
  amount: number
  catatan?: string
  tanggalBayar?: string | Date
}
export type UpdateInvoiceBody = { totalBayar: number }

/** Queries (raw dari URL, masih string) */
export type PaymentsListQueryRaw = {
  page?: string
  limit?: string
  sortDir?: 'asc' | 'desc'
  start?: string
  end?: string
}

/** (opsional) Raw query untuk GET /api/customers listing */
export type CustomerListQueryRaw = {
  q?: string
  page?: string
  limit?: string
  sortBy?: 'namaCustomer' | 'nim' | 'createdAt'
  sortDir?: 'asc' | 'desc'
}