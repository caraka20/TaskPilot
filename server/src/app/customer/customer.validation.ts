import z, { ZodType } from "zod"
import { JenisUT } from "../../generated/prisma"
import { CreateCustomerRequest, CustomerListQuery, UpdatePaymentRequest } from "./customer.model"

export class CustomerValidation {
  static readonly ID_PARAM = z.object({
    id: z.coerce.number().int().positive(),
  })

  /** body untuk POST /api/customers */
  static readonly CREATE: ZodType<CreateCustomerRequest> = z.object({
    namaCustomer: z.string().min(2, "Nama minimal 2 karakter").max(200),
    noWa: z.string().min(5, "No WA tidak valid").max(30),
    nim: z.string().min(3, "NIM tidak valid").max(191), // 191 aman utk unique index MySQL
    password: z.string().min(6, "Password minimal 6 karakter"),
    jurusan: z.string().min(2).max(200),
    jenis: z.nativeEnum(JenisUT),
    totalBayar: z.number().min(0).optional(),
    sudahBayar: z.number().min(0).optional(),
  }).superRefine((v, ctx) => {
    const total = v.totalBayar ?? 0
    const sudah = v.sudahBayar ?? 0
    if (sudah > total) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sudahBayar"], message: "sudahBayar tidak boleh melebihi totalBayar" })
    }
  })

  // OWNER menambah transaksi pembayaran customer
  static readonly ADD_PAYMENT = z.object({
    amount: z.coerce.number().positive(),
    catatan: z.string().max(200).optional(),
    tanggalBayar: z.coerce.date().optional(),
  })

  // OWNER mengubah total tagihan (invoice total)
  static readonly UPDATE_INVOICE = z.object({
    totalBayar: z.coerce.number().min(0),
  })

  // List histori pembayaran customer
  static readonly PAYMENTS_LIST_QUERY = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sortDir: z.enum(['asc', 'desc']).default('desc'),
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
  })

    static readonly TUTON_SUMMARY_PARAM: ZodType<{ id: number }> = z.object({
        id: z.coerce.number().int().positive(),
    })

    private static readonly JENIS_Q = z.preprocess((val) => {
      if (Array.isArray(val)) return val;                       // jenis[]=TUTON&jenis[]=KARIL
      if (typeof val === "string" && val.includes(",")) {
        return val.split(",").map((s) => s.trim()).filter(Boolean); // jenis=KARIL,TUTON
      }
      return val;
    }, z.union([
      z.nativeEnum(JenisUT),
      z.array(z.nativeEnum(JenisUT)).min(1),
    ]).optional());

    static readonly LIST_QUERY: ZodType<CustomerListQuery> = z.object({
      q: z.string().trim().min(1).max(100).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      sortBy: z.enum(["namaCustomer", "nim", "createdAt"]).default("createdAt"),
      sortDir: z.enum(["asc", "desc"]).default("desc"),
      /** ⬅️ NEW */
      jenis: this.JENIS_Q,
    });

  static readonly PARAMS_ID = z.object({
    id: z.coerce.number().int().positive(),
  })

}
