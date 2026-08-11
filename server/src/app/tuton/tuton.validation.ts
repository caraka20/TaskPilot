import z, { ZodType } from "zod"
import { AddCourseRequest, CourseIdParam, CustomerIdParam, UpdateCourseRequest } from "./tuton.model"
import { JenisTugas, StatusTugas } from "../../generated/prisma"

export interface MatkulParam { matkul: string }

export class TutonValidation {
  // ==== EXISTING ====

  static readonly ADD_COURSE_BODY: ZodType<AddCourseRequest> = z.object({
    matkul: z.string().min(2).max(200),
    generateItems: z.boolean().optional(), // default true di controller
  })

  static readonly CUSTOMER_ID_PARAM: ZodType<CustomerIdParam> = z.object({
    id: z.coerce.number().int().positive(),
  })

  static readonly COURSE_ID_PARAM: ZodType<CourseIdParam> = z.object({
    courseId: z.coerce.number().int().positive(),
  })

  static readonly CONFLICT_MATKUL_PARAM: ZodType<{ matkul: string }> = z.object({
    matkul: z.string().min(2).max(150),
  })

  // ==== NEW ====

  // GET /api/tuton/subjects?q=...
  static readonly SUBJECTS_QUERY: ZodType<{ q?: string }> = z.object({
    q: z.string().min(1).max(200).optional(),
  })

  // GET /api/tuton/scan?jenis=&sesi=&status=&matkul=&page=&pageSize=
  // helper: parse YA/TIDAK/true/false/1/0 -> boolean | undefined
  private static readonly zCopasSoal = z.preprocess((v) => {
    if (typeof v === "boolean") return v
    if (v == null) return undefined
    const s = String(v).trim().toLowerCase()
    if (["ya", "true", "1"].includes(s)) return true
    if (["tidak", "false", "0", "no"].includes(s)) return false
    return undefined
  }, z.boolean().optional())

  // GET /api/tuton/scan?jenis=&sesi=&status=&matkul=&page=&pageSize=&copas=
  static readonly SCAN_QUERY: ZodType<{
    matkul?: string
    jenis?: JenisTugas
    sesi?: number
    status?: StatusTugas
    page?: number
    pageSize?: number
    /** FE param "copas", dipetakan ke kolom "copasSoal" */
    copas?: boolean
  }> = z.object({
    matkul: z.string().min(1).max(200).optional(),
    jenis: z.nativeEnum(JenisTugas).optional(),
    sesi: z.coerce.number().int().min(1).max(16).optional(),
    status: z.nativeEnum(StatusTugas).optional().default(StatusTugas.BELUM),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(200).optional().default(50),
    copas: TutonValidation.zCopasSoal, // <-- FIX: bukan zCopas yg undefined
  })

  static readonly UPDATE_COURSE_BODY: ZodType<UpdateCourseRequest> = z.object({
    matkul: z.string().min(2).max(200).optional(),
    resetItems: z.coerce.boolean().optional().default(false),
  }).refine(v => v.matkul !== undefined || v.resetItems === true, {
    message: "Tidak ada perubahan",
  });
}
