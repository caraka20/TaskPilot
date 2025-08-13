import { Salary, User, Prisma } from '../../generated/prisma'

// REQUEST
export interface CreateGajiRequest {
  username: string
  jumlahBayar: number
  catatan?: string | null
}

export interface UpdateGajiRequest {
  jumlahBayar?: number
  catatan?: string | null
}

// RESPONSE
export interface GajiResponse {
  id: number
  username: string
  jumlahBayar: number
  catatan?: string | null
  tanggalBayar: Date
  namaLengkap?: string
}

// GENERIC PAGINATION
export interface Paginated<T> {
  items: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// MAPPING FUNCTION
export function toGajiResponse(gaji: Salary & { user?: User | null }): GajiResponse {
  return {
    id: gaji.id,
    username: gaji.username,
    jumlahBayar: gaji.jumlahBayar,
    catatan: gaji.catatan,
    tanggalBayar: gaji.tanggalBayar,
    namaLengkap: gaji.user?.namaLengkap || undefined,
  }
}

export class GajiModel {
  static buildWhere(query: any): Prisma.SalaryWhereInput {
    const where: Prisma.SalaryWhereInput = {}

    if (query.username) {
      where.username = query.username
    }

    if (query['tanggalBayar.gte'] || query['tanggalBayar.lte']) {
      where.tanggalBayar = {}
      if (query['tanggalBayar.gte']) {
        where.tanggalBayar.gte = new Date(query['tanggalBayar.gte'])
      }
      if (query['tanggalBayar.lte']) {
        where.tanggalBayar.lte = new Date(query['tanggalBayar.lte'])
      }
    }

    return where
  }
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
