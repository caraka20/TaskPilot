import z, { ZodType } from "zod"
import {
  ItemIdParam, CourseIdParam,
  UpdateNilaiRequest, UpdateStatusRequest, UpdateTutonItemRequest, UpdateCopasRequest,
  BulkNilaiRequest, BulkStatusRequest, InitItemsRequest, CourseParam,
} from "./tuton-item.model"
import { StatusTugas } from "../../generated/prisma"

export class TutonItemValidation {
  static readonly COURSE_ID_PARAM: ZodType<CourseIdParam> = z.object({
    courseId: z.coerce.number().int().positive(),
  })

  static readonly ITEM_ID_PARAM: ZodType<ItemIdParam> = z.object({
    itemId: z.coerce.number().int().positive(),
  })

  static readonly UPDATE_BODY: ZodType<UpdateTutonItemRequest> = z.object({
    status: z.nativeEnum(StatusTugas).optional(),
    nilai: z.number().min(0).max(100).nullable().optional(),
    deskripsi: z.string().max(500).nullable().optional(),
    copas: z.boolean().optional(),
  }).refine(o => Object.keys(o).length > 0, { message: "Minimal satu field harus diisi" })

  static readonly UPDATE_STATUS_BODY: ZodType<UpdateStatusRequest> = z.object({
    status: z.nativeEnum(StatusTugas),
  })

  static readonly UPDATE_NILAI_BODY: ZodType<UpdateNilaiRequest> = z.object({
    nilai: z.number().min(0).max(100).nullable(),
  })

  static readonly UPDATE_COPAS_BODY: ZodType<UpdateCopasRequest> = z.object({
    copas: z.boolean(),
  })

  static readonly PARAMS: ZodType<CourseParam> = z.object({
    courseId: z.coerce.number().int().positive(),
  })

  static readonly INIT: ZodType<InitItemsRequest> = z.object({
    overwrite: z.boolean().optional().default(false),
  })

  static readonly BULK_STATUS: ZodType<BulkStatusRequest> = z.object({
    items: z.array(z.object({
      itemId: z.coerce.number().int().positive(),
      status: z.enum(["BELUM", "SELESAI"]),
    })).min(1, "items tidak boleh kosong"),
  })

  static readonly BULK_NILAI: ZodType<BulkNilaiRequest> = z.object({
    items: z.array(z.object({
      itemId: z.coerce.number().int().positive(),
      nilai: z.number().min(0).max(100).nullable(),
    })).min(1, "items tidak boleh kosong"),
  })
}
