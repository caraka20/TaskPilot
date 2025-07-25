
import { User, JamKerja, Task, Gaji, Customer } from '../../generated/prisma'

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
  riwayatGaji: Gaji[]
}

// FUNCTION
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
    token: token,
    user: toUserResponse(user),
  }
}

export function toUserDetailResponse(user: User & {
  jamKerja: JamKerja[]
  tugas: (Task & { customer: Customer })[]
  riwayatGaji: Gaji[]
}): UserDetailResponse {
  return {
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: user.role,
    totalJamKerja: user.totalJamKerja,
    totalGaji: user.totalGaji,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    jamKerja: user.jamKerja,
    riwayatGaji: user.riwayatGaji,
    tugas: user.tugas.map((tugas) => ({
      id: tugas.id,
      deskripsi: tugas.deskripsi,
      jenisTugas: tugas.jenisTugas,
      status: tugas.status,
      waktuSelesai: tugas.waktuSelesai,
      customer: {
        id: tugas.customer.id,
        namaCustomer: tugas.customer.namaCustomer,
        nim: tugas.customer.nim,
        jurusan: tugas.customer.jurusan
      }
    }))
  }
}