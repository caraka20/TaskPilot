import { z, ZodType } from "zod";
import {
  UserDetailRequest,
  LoginRequest,
  RegisterRequest,
  SetJedaOtomatisRequest,
  DetailRangeQuery,
} from "./user.model";

const DateString = z
  .string()
  .min(1)
  .refine((s) => {
    const iso = s.length === 10 ? `${s}T00:00:00.000Z` : s;
    return !Number.isNaN(Date.parse(iso));
  }, "Invalid date");

export class UserValidation {
  static readonly CREATE: ZodType<RegisterRequest> = z.object({
    password: z.string().min(6).max(20),
    namaLengkap: z.string().min(6),
    username: z.string().min(6).max(10),
  });

  static readonly LOGIN: ZodType<LoginRequest> = z.object({
    username: z.string().min(6).max(20),
    password: z.string().min(6).max(20),
  });

  static readonly DETAIL_USER: ZodType<UserDetailRequest> = z.object({
    username: z.string().min(3).max(50),
  });

  static readonly SET_JEDA_OTOMATIS: ZodType<SetJedaOtomatisRequest> = z.object({
    aktif: z.boolean(),
  });

  // query untuk API agregat
  static readonly DETAIL_DEEP_QUERY: ZodType<DetailRangeQuery> = z.object({
    from: DateString.optional(),
    to: DateString.optional(),
    histPage: z.coerce.number().int().positive().optional(),
    histLimit: z.coerce.number().int().positive().max(100).optional(),
    payPage: z.coerce.number().int().positive().optional(),
    payLimit: z.coerce.number().int().positive().max(100).optional(),
  });
}
