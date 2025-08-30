import { TutonItem, StatusTugas, JenisTugas } from "../../generated/prisma"

export interface CourseIdParam { courseId: number }
export interface ItemIdParam { itemId: number }

export interface TutonItemResponse {
  id: number
  courseId: number
  jenis: string
  sesi: number
  status: string
  nilai?: number | null
  deskripsi?: string | null
  selesaiAt?: Date | null
  copas: boolean
}

export function toTutonItemResponse(item: TutonItem): TutonItemResponse {
  return {
    id: item.id,
    courseId: item.courseId,
    jenis: String(item.jenis),
    sesi: item.sesi,
    status: String(item.status),
    nilai: item.nilai ?? null,
    deskripsi: item.deskripsi ?? null,
    selesaiAt: item.selesaiAt ?? null,
    copas: !!item.copasSoal,
  }
}

export interface UpdateTutonItemRequest {
  status?: StatusTugas
  nilai?: number | null
  deskripsi?: string | null
  copas?: boolean
}

export interface UpdateStatusRequest { status: StatusTugas }
export interface UpdateNilaiRequest { nilai: number | null }
export interface UpdateCopasRequest { copas: boolean }

export interface CourseParam { courseId: number }

export interface InitItemsRequest { overwrite?: boolean }
export interface InitItemsResponse {
  courseId: number
  created: boolean
  totalItems: number
  completedItems: number
}

export interface BulkStatusItem { itemId: number; status: StatusTugas }
export interface BulkStatusRequest { items: BulkStatusItem[] }
export interface BulkResult { updated: number }

export interface BulkNilaiItem { itemId: number; nilai: number | null }
export interface BulkNilaiRequest { items: BulkNilaiItem[] }

export interface TutonItemBrief {
  id: number
  jenis: JenisTugas
  sesi: number
  status: StatusTugas
  nilai?: number | null
}
