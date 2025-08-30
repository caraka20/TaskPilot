// src/app/karil/karil.model.ts
import { KarilDetail, Customer } from "../../generated/prisma"

export type KarilProgressFilter = "all" | "complete" | "incomplete"
export type KarilSortBy = "updatedAt" | "createdAt" | "namaCustomer" | "nim"
export type SortDir = "asc" | "desc"

export interface KarilListQuery {
  q?: string
  page: number
  limit: number
  progress?: KarilProgressFilter
  sortBy: KarilSortBy
  sortDir: SortDir
}

export interface KarilListItem {
  id: number             // karilDetail.id
  customerId: number
  namaCustomer: string
  nim: string
  jurusan: string
  judul: string
  tugas1: boolean
  tugas2: boolean
  tugas3: boolean
  tugas4: boolean
  totalTasks: number
  doneTasks: number
  progress: number       // 0..1
  keterangan: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Paginated<T> {
  items: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export type KarilListRow = KarilDetail & {
  customer: Pick<Customer, "id"|"namaCustomer"|"nim"|"jurusan"|"jenis">
}

export function mapRowToItem(row: KarilListRow): KarilListItem {
  const total = 4
  const done =
    (row.tugas1 ? 1 : 0) +
    (row.tugas2 ? 1 : 0) +
    (row.tugas3 ? 1 : 0) +
    (row.tugas4 ? 1 : 0)

  return {
    id: row.id,
    customerId: row.customerId,
    namaCustomer: row.customer.namaCustomer,
    nim: row.customer.nim,
    jurusan: row.customer.jurusan,
    judul: row.judul,
    tugas1: row.tugas1,
    tugas2: row.tugas2,
    tugas3: row.tugas3,
    tugas4: row.tugas4,
    totalTasks: total,
    doneTasks: done,
    progress: total > 0 ? +(done/total).toFixed(4) : 0,
    keterangan: row.keterangan,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
