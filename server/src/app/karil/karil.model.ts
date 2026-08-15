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
  tugasBelum?: "all" | "1" | "2" | "3" | "4"
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

export type KarilListRow = Pick<Customer, "id" | "namaCustomer" | "nim" | "jurusan" | "jenis" | "createdAt" | "updatedAt"> & {
  karil: KarilDetail | null
}

export function mapRowToItem(row: KarilListRow): KarilListItem {
  const detail = row.karil
  const total = 4
  const done =
    (detail?.tugas1 ? 1 : 0) +
    (detail?.tugas2 ? 1 : 0) +
    (detail?.tugas3 ? 1 : 0) +
    (detail?.tugas4 ? 1 : 0)

  return {
    id: detail?.id ?? 0,
    customerId: row.id,
    namaCustomer: row.namaCustomer,
    nim: row.nim,
    jurusan: row.jurusan,
    judul: detail?.judul ?? "Belum dibuat",
    tugas1: detail?.tugas1 ?? false,
    tugas2: detail?.tugas2 ?? false,
    tugas3: detail?.tugas3 ?? false,
    tugas4: detail?.tugas4 ?? false,
    totalTasks: total,
    doneTasks: done,
    progress: total > 0 ? +(done/total).toFixed(4) : 0,
    keterangan: detail?.keterangan ?? null,
    createdAt: detail?.createdAt ?? row.createdAt,
    updatedAt: detail?.updatedAt ?? row.updatedAt,
  }
}
