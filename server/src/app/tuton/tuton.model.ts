import { JenisTugas, StatusTugas, TutonCourse } from "../../generated/prisma"

// BODY REQUEST
export interface AddCourseRequest {
  matkul: string
  generateItems?: boolean // default true
}

// PARAMS
export interface CustomerIdParam {
  id: number
}

export interface CourseIdParam {
  courseId: number
}

// RESPONSE
export interface TutonCourseResponse {
  id: number
  customerId: number
  matkul: string
  totalItems: number
  completedItems: number
}

export function toTutonCourseResponse(c: TutonCourse): TutonCourseResponse {
  return {
    id: c.id,
    customerId: c.customerId,
    matkul: c.matkul,
    totalItems: c.totalItems,
    completedItems: c.completedItems,
  }
}

export interface ConflictCustomerEntry {
  customerId: number
  courseId: number
  namaCustomer: string
  createdAt: Date
  isDuplicate: boolean
}

export interface ConflictGroupResponse {
  matkul: string
  total: number
  customers: ConflictCustomerEntry[]
}