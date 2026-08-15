import {
  User,
  JamKerja,
  Salary,
  Prisma,
} from "../../generated/prisma";

/* ========= RESPON RINGKAS ========= */

export interface UserResponse {
  id?: string;
  username: string;
  namaLengkap: string;
  role?: string;
  totalJamKerja?: number;
  totalGaji?: number;
  totalGajiDibayar?: number;
  canViewCustomerBilling?: boolean;
  canEditTutonWithoutWork?: boolean;
  avatarUrl?: string | null;
  isActive?: boolean;
  dailyRate?: number;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

/* ========= DETAIL (lama) ========= */

export interface UserDetailResponse {
  id: string;
  username: string;
  namaLengkap: string;
  role: string;
  totalJamKerja: number;
  totalGaji: number;
  canViewCustomerBilling: boolean;
  canEditTutonWithoutWork: boolean;
  avatarUrl: string | null;
  isActive: boolean;
  dailyRate: number;
  createdAt: Date;
  updatedAt: Date;
  jamKerja: JamKerja[];
  tugas: Array<{
    id: number;
    deskripsi: string;
    jenisTugas: string;
    status: string;
    waktuSelesai: Date | null;
    customer: {
      id: number;
      namaCustomer: string;
      nim: string;
      jurusan: string;
    };
  }>;
  riwayatGaji: Salary[];
  unifiedPayroll?: {
    hourlyHours: number;
    hourlyRate: number;
    hourlyEarned: number;
    hourlySessionCount: number;
    dailyEarned: number;
    dailyCount: number;
    pieceworkEarned: number;
    pieceworkCount: number;
    totalEarned: number;
    totalPaid: number;
    balance: number;
  };
}

/* ========= REQUEST ========= */

export interface RegisterRequest {
  username: string;
  password: string;
  namaLengkap: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserDetailRequest {
  username: string;
}

export interface SetJedaOtomatisRequest {
  aktif: boolean;
}

export interface SetCustomerBillingAccessRequest {
  aktif: boolean;
}

export interface SetTutonWorkExemptionRequest {
  aktif: boolean;
}

export interface SetUserActiveRequest {
  aktif: boolean;
}

/* ========= MAPPERS ========= */

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: user.role,
    totalJamKerja: user.totalJamKerja,
    totalGaji: user.totalGaji,
    canViewCustomerBilling: user.canViewCustomerBilling,
    canEditTutonWithoutWork: user.canEditTutonWithoutWork,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive && !user.deletedAt,
    dailyRate: Number(user.dailyRate),
  };
}

export function toLoginResponse(user: User, token: string): LoginResponse {
  return {
    token,
    user: toUserResponse(user),
  };
}

export type UserDetailEntity = Prisma.UserGetPayload<{
  include: {
    jamKerja: true;
    riwayatGaji: true;
    tutonItems: {
      select: {
        id: true;
        deskripsi: true;
        jenis: true;
        sesi: true;
        status: true;
        selesaiAt: true;
        course: {
          select: {
            customer: {
              select: {
                id: true;
                namaCustomer: true;
                nim: true;
                jurusan: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export function toUserDetailResponse(user: UserDetailEntity): UserDetailResponse {
  const tugas = (user.tutonItems ?? []).map((item) => {
    const customer = item.course?.customer;
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
    };
  });

  return {
    id: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    role: user.role,
    totalJamKerja: user.totalJamKerja,
    totalGaji: user.totalGaji,
    canViewCustomerBilling: user.canViewCustomerBilling,
    canEditTutonWithoutWork: user.canEditTutonWithoutWork,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive && !user.deletedAt,
    dailyRate: Number(user.dailyRate),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    jamKerja: user.jamKerja ?? [],
    riwayatGaji: user.riwayatGaji ?? [],
    tugas, // back-compat untuk test lama
  };
}

/* ========= EFEKTIF KONFIG ========= */

export interface EffectiveKonfigurasi {
  gajiPerJam: number;
  batasJedaMenit: number;
  jedaOtomatisAktif: boolean;
  source: "override" | "global";
}

/* ========= DETAIL MENYELURUH (BARU) ========= */

export interface DetailRangeQuery {
  /** ISO string atau 'YYYY-MM-DD' */
  from?: string;
  /** ISO string atau 'YYYY-MM-DD' */
  to?: string;
  /** Halaman histori jam kerja */
  histPage?: number;
  /** Item per halaman histori */
  histLimit?: number;
  /** Halaman riwayat gaji */
  payPage?: number;
  /** Item per halaman riwayat gaji */
  payLimit?: number;
}

export type StatusSaatIni = "AKTIF" | "JEDA" | "OFF" | "SELESAI";

export interface UserEverythingResponse {
  profile: {
    username: string;
    namaLengkap: string;
    role: string;
    canViewCustomerBilling: boolean;
    canEditTutonWithoutWork: boolean;
    createdAt: Date;
    updatedAt: Date;
    totals: {
      totalJamKerja: number;
      totalGaji: number;
    };
  };
  konfigurasi: EffectiveKonfigurasi & { updatedAt?: Date };
  jamKerja: {
    latestStatus: StatusSaatIni;
    activeSessionId: number | null;
    today: { items: JamKerja[]; total: number };
    summary: {
      hari: { totalJam: number; totalGaji: number };
      minggu: { totalJam: number; totalGaji: number };
      bulan: { totalJam: number; totalGaji: number };
      semua: { totalJam: number; totalGaji: number };
    };
    history: {
      items: JamKerja[];
      page: number;
      perPage: number;
      total: number;
      range?: { from?: string; to?: string };
    };
  };
  gaji: {
    gajiPerJam: number;
    summary: {
      totalJam: number;
      upahKeseluruhan: number;
      totalDiterima: number;
      belumDibayar: number;
    };
    riwayat: {
      items: Salary[];
      page: number;
      perPage: number;
      total: number;
    };
  };
  tugas: UserDetailResponse["tugas"];
}
