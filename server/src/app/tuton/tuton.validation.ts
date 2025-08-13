import z, { ZodType } from "zod"
import { AddCourseRequest, CourseIdParam, CustomerIdParam } from "./tuton.model"
export interface MatkulParam { matkul: string }


export class TutonValidation {
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
}
