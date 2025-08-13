import { GajiRepository } from './gaji.repository'
import {
  CreateGajiRequest,
  GajiModel,
  GajiResponse,
  GetMyGajiInput,
  Paginated,
  toGajiResponse,
  UpdateGajiRequest
} from './gaji.model'
import { UserRepository } from '../user/user.repository'
import { AppError } from '../../middleware/app-error'
import { ERROR_CODE, ERROR_DEFINITIONS } from '../../utils/error-codes'
import { prismaClient } from '../../config/database'
import { getPagination } from '../../utils/pagination'
import { Prisma } from '@prisma/client'


export class GajiService {

    static async createGaji(request: CreateGajiRequest): Promise<GajiResponse> {
        const exiting = await UserRepository.findByUsername(request.username)
            if (!exiting){
            throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)
        }
        const response = await GajiRepository.create(request)
        return toGajiResponse(response)
    }

    static async getAllGaji(query: any): Promise<{
        page: number
        total: number
        perPage: number
        data: GajiResponse[]
    }> {
        const where = GajiModel.buildWhere(query)
        const { page, limit, skip } = getPagination(query)

        const [total, list] = await Promise.all([
        prismaClient.salary.count({ where }),
        prismaClient.salary.findMany({
            where,
            skip,
            take: limit,
            orderBy: { tanggalBayar: 'desc' },
            include: { user: true },
        }),
        ])

        return {
        page,
        total,
        perPage: limit,
        data: list.map(toGajiResponse),
        }
    }

    static async deleteById(id: number): Promise<void> {
        const gaji = await GajiRepository.findById(id)

        if (!gaji) {
            throw AppError.fromCode(ERROR_CODE.NOT_FOUND, ERROR_DEFINITIONS.NOT_FOUND)
        }

        await GajiRepository.deleteById(id)
    }

    static async updateById(id: number, request: UpdateGajiRequest) {
        const gaji = await GajiRepository.findById(id)

        if (!gaji) {
        throw AppError.fromCode(ERROR_CODE.NOT_FOUND, ERROR_DEFINITIONS.NOT_FOUND)
        }

        return GajiRepository.updateById(id, {
        jumlahBayar: request.jumlahBayar,
        catatan: request.catatan,
        })
    }

  static async getMyGaji(
    username: string,
    query: GetMyGajiInput,
  ): Promise<Paginated<GajiResponse>> {
    const page = Math.max(1, Number(query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(query.limit || 10)))
    const skip = (page - 1) * limit
    const order: 'asc' | 'desc' = query.sort || 'desc'

    // where tanpa hard-typing Prisma agar fleksibel
    const where: Record<string, any> = { username }

    if (query['tanggalBayar.gte'] || query['tanggalBayar.lte']) {
      where.tanggalBayar = {}
      if (query['tanggalBayar.gte']) {
        const s = query['tanggalBayar.gte']
        where.tanggalBayar.gte = new Date(s.length === 10 ? `${s}T00:00:00.000Z` : s)
      }
      if (query['tanggalBayar.lte']) {
        const s = query['tanggalBayar.lte']
        where.tanggalBayar.lte = new Date(s.length === 10 ? `${s}T23:59:59.999Z` : s)
      }
    }

    const { items, total } = await GajiRepository.findMany(where, { skip, take: limit, order })
    const data = items.map((it) => toGajiResponse(it as any))
    const totalPages = Math.max(1, Math.ceil(total / limit))

    return { items: data, pagination: { page, limit, total, totalPages } }
  }
}
