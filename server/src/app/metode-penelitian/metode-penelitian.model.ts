import type { Customer, MetodePenelitianDetail } from "../../generated/prisma"

export interface MetodePenelitianListQuery {
  q?: string
  page: number
  limit: number
  progress: "all" | "complete" | "incomplete"
  tugasBelum: "all" | "1" | "2" | "3" | "4"
  sortBy: "updatedAt" | "createdAt" | "namaCustomer" | "nim"
  sortDir: "asc" | "desc"
}

export type MetodePenelitianListRow = Pick<Customer, "id" | "namaCustomer" | "nim" | "jurusan" | "jenis" | "createdAt" | "updatedAt"> & {
  metodePenelitian: MetodePenelitianDetail | null
}

export function mapMetodePenelitian(row: MetodePenelitianListRow) {
  const detail = row.metodePenelitian
  const doneTasks = [detail?.tugas1, detail?.tugas2, detail?.tugas3, detail?.tugas4].filter(Boolean).length
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
    totalTasks: 4,
    doneTasks,
    progress: doneTasks / 4,
    keterangan: detail?.keterangan ?? null,
    createdAt: detail?.createdAt ?? row.createdAt,
    updatedAt: detail?.updatedAt ?? row.updatedAt,
  }
}
