import { Prisma } from '../../generated/prisma'

export interface CreateGajiRequest {
  username: string
  jumlahBayar: number
  catatan?: string | null
}

export interface UpdateGajiRequest {
  jumlahBayar?: number
  catatan?: string | null
}

export interface GajiResponse {
  id: number
  username: string
  jumlahBayar: number
  tanggalBayar: Date
  catatan?: string | null
  namaLengkap?: string
}

export interface Paginated<T> {
  items: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// Query untuk GET /api/gaji/me
export type GetMyGajiInput = {
  page: number
  limit: number
  sort: 'asc' | 'desc'
  'tanggalBayar.gte'?: string
  'tanggalBayar.lte'?: string
}

export interface GajiMeSummary {
  username: string
  totalJam: number
  gajiPerJam: number
  upahKeseluruhan: number
  totalDiterima: number
  belumDibayar: number
}

export function toGajiResponse(row: any): GajiResponse {
  return {
    id: row.id,
    username: row.username,
    jumlahBayar: row.jumlahBayar,
    tanggalBayar: row.tanggalBayar ?? row.createdAt,
    catatan: row.catatan ?? null,
    namaLengkap: row.user?.namaLengkap ?? row.namaLengkap ?? undefined,
  }
}

export class GajiModel {
  static buildWhere(query: any): Prisma.SalaryWhereInput {
    const where: Prisma.SalaryWhereInput = {}

    if (query.username) where.username = query.username

    if (query['tanggalBayar.gte'] || query['tanggalBayar.lte']) {
      where.tanggalBayar = {}
      if (query['tanggalBayar.gte']) where.tanggalBayar.gte = new Date(query['tanggalBayar.gte'])
      if (query['tanggalBayar.lte']) where.tanggalBayar.lte = new Date(query['tanggalBayar.lte'])
    }

    return where
  }
}
