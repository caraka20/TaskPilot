import { z, ZodType } from "zod";
import {
  JamKerjaHistoryQuery,
  RekapJamKerjaQuery,
  StartJamKerjaRequest,
} from "./jam-kerja.model";

export class JamKerjaValidation {
  static readonly START: ZodType<StartJamKerjaRequest> = z.object({
    username: z.string().min(3).max(100),
  });

  static readonly START_BODY_OWNER = z.object({
    username: z.string().min(3).max(100).optional(),
  });

  static readonly HISTORY_QUERY: ZodType<JamKerjaHistoryQuery> = z.object({
    username: z.string().min(3),
  });

  static readonly REKAP_QUERY: ZodType<RekapJamKerjaQuery> = z.object({
    username: z.string().min(3),
    period: z.enum(["minggu", "bulan"]),
  });

  // output bertipe wajib: { username; period }
  static readonly AKTIF_QUERY: ZodType<{ username: string; period: "minggu" | "bulan" }> =
    z.object({
      username: z.string().min(3),
      period: z.enum(["minggu", "bulan"]),
    });

  static readonly OWNER_SUMMARY_QUERY = z.object({
    username: z.string().min(3).optional(),
  });

  static readonly USER_SUMMARY_QUERY = z.object({
    username: z.string().min(3),
  });
}
