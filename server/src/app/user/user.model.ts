import {
  User,
  JamKerja,
  Salary,
  Customer,
  TutonItem,
  TutonCourse,
  Prisma,
} from "../../generated/prisma"

// RESPON
export interface UserResponse {
  username: string
  namaLengkap: string
  role?: string
  totalJamKerja?: number
  totalGaji?: number
  totalGajiDibayar?: number
}

export interface LoginResponse {
  token: string
  user: UserResponse
}

export interface UserDetailResponse {
  username: string
  namaLengkap: string
  role: string
  totalJamKerja: number
  totalGaji: number
  createdAt: Date
  updatedAt: Date
  jamKerja: JamKerja[]
  tugas: Array<{
    id: number
    deskripsi: string
    jenisTugas: string
    status: string
    waktuSelesai: Date | null
    customer: {
      id: number
      namaCustomer: string
      nim: string
      jurusan: string
    }
  }>
  riwayatGaji: Salary[]
}

// REQUEST
export interface RegisterRequest {
  username: string
  password: string
  namaLengkap: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface UserDetailRequest {
  username: string
}

export interface SetJedaOtomatisRequest {
  aktif: boolean
}

// FUNCTION (mappers)
export function toUserResponse(user: User): UserResponse {
  return {
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: user.role,
    totalJamKerja: user.totalJamKerja,
    totalGaji: user.totalGaji,
  }
}

export function toLoginResponse(user: User, token: string): LoginResponse {
  return {
    token,
    user: toUserResponse(user),
  }
}

export type UserDetailEntity = Prisma.UserGetPayload<{
  include: {
    jamKerja: true
    riwayatGaji: true
    tutonItems: {
      select: {
        id: true
        deskripsi: true
        jenis: true
        sesi: true
        status: true
        selesaiAt: true
        course: {
          select: {
            customer: {
              select: {
                id: true
                namaCustomer: true
                nim: true
                jurusan: true
              }
            }
          }
        }
      }
    }
  }
}>
// ======================================================================

export function toUserDetailResponse(
  user: UserDetailEntity
): UserDetailResponse {
  const tugas = (user.tutonItems ?? []).map((item) => {
    const customer = item.course?.customer
    return {
      id: item.id,
      deskripsi: item.deskripsi || `${String(item.jenis)} sesi ${item.sesi}`,
      jenisTugas: String(item.jenis),
      status: String(item.status),
      waktuSelesai: item.selesaiAt ?? null,
      customer: {
        id: customer?.id ?? 0,
        namaCustomer: customer?.namaCustomer ?? "",
        nim: customer?.nim ?? "",
        jurusan: customer?.jurusan ?? "",
      },
    }
  })

  return {
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: user.role,
    totalJamKerja: user.totalJamKerja,
    totalGaji: user.totalGaji,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    jamKerja: user.jamKerja ?? [],
    riwayatGaji: user.riwayatGaji ?? [],
    tugas, // back-compat untuk test lama
  }
}
