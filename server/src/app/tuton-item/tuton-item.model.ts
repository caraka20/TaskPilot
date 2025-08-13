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
  }
}

export interface UpdateTutonItemRequest {
  status?: StatusTugas            // <-- pakai enum, bukan string bebas
  nilai?: number | null
  deskripsi?: string | null
}

export interface UpdateStatusRequest {
  status: StatusTugas             // <-- enum
}

export interface UpdateNilaiRequest {
  nilai: number | null
}


/** PARAMS */
export interface CourseParam {
  courseId: number
}

/** INIT */
export interface InitItemsRequest {
  overwrite?: boolean
}
export interface InitItemsResponse {
  courseId: number
  created: boolean
  totalItems: number
  completedItems: number
}

/** BULK STATUS */
export interface BulkStatusItem {
  itemId: number
  status: StatusTugas
}
export interface BulkStatusRequest {
  items: BulkStatusItem[]
}
export interface BulkResult {
  updated: number
}

/** BULK NILAI */
export interface BulkNilaiItem {
  itemId: number
  nilai: number | null
}
export interface BulkNilaiRequest {
  items: BulkNilaiItem[]
}

/** LIST / SUMMARY SHAPES (opsional dipakai di tempat lain) */
export interface TutonItemBrief {
  id: number
  jenis: JenisTugas
  sesi: number
  status: StatusTugas
  nilai?: number | null
}

export interface CourseSummaryResponse {
  courseId: number
  matkul: string
  totalItems: number
  completedItems: number
  progress: number
  byJenis: {
    DISKUSI: { total: number; done: number; avgNilai: number | null }
    ABSEN:   { total: number; done: number }
    TUGAS:   { total: number; done: number; avgNilai: number | null }
  }
  updatedAt: Date
}

export function toItemBrief(item: TutonItem): TutonItemBrief {
  return {
    id: item.id,
    jenis: item.jenis,
    sesi: item.sesi,
    status: item.status,
    nilai: item.nilai ?? null,
  }
}