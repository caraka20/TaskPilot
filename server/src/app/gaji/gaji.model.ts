import { Gaji } from "../../generated/prisma"

// REQUEST
export interface CreateGajiRequest {
  username: string
  jumlahBayar: number
  catatan?: string | null,
}

// RESPONSE
export interface GajiResponse {
  id: number
  username: string
  jumlahBayar: number
  catatan?: string | null
}

// FUNCTION
export function toGajiResponse(gaji: Gaji): GajiResponse {
  return {
    id: gaji.id,
    username: gaji.username,
    jumlahBayar: gaji.jumlahBayar,
    catatan: gaji.catatan,
  }
}