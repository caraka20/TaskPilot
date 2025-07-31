import z, { ZodType } from "zod";
import { CreateGajiRequest } from "./gaji.model";



export class GajiValidation {
    static readonly CREATE : ZodType<CreateGajiRequest> = z.object({
      username: z.string().min(6).max(20),
      jumlahBayar: z.number().min(1),
      catatan : z.string().optional()
    })
}