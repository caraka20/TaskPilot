import bcrypt from "bcrypt";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  SetJedaOtomatisRequest,
  toLoginResponse,
  toUserDetailResponse,
  toUserResponse,
  UserDetailRequest,
  UserDetailResponse,
  UserResponse,
  UserEverythingResponse,
  DetailRangeQuery,
} from "./user.model";
import { UserRepository } from "./user.repository";
import { ERROR_CODE } from "../../utils/error-codes";
import { AppError } from "../../middleware/app-error";
import { generateToken } from "../../utils/jwt";
import { UserRequest } from "../../types/user-request";
import { JamKerjaRepository } from "../jam-kerja/jam-kerja.repository";
import { GajiRepository } from "../gaji/gaji.repository";

const round2 = (n: number) => Math.round(n * 100) / 100;
const round0 = (n: number) => Math.round(n);

function safeISO(s?: string) {
  if (!s) return undefined;
  return s.length === 10 ? `${s}T00:00:00.000Z` : s;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}
function endOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}
function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
}
function endOfWeek(): Date {
  const s = startOfWeek();
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

export class UserService {
  static async register(request: RegisterRequest): Promise<UserResponse> {
    const existing = await UserRepository.findByUsername(request.username);
    if (existing) {
      throw AppError.fromCode(ERROR_CODE.USER_ALREADY_EXISTS);
    }

    const hashPassword = await bcrypt.hash(request.password, 10);
    request.password = hashPassword;

    const user = await UserRepository.create(request);
    return toUserResponse(user);
  }

  static async login(request: LoginRequest): Promise<LoginResponse> {
    const user = await UserRepository.findByUsername(request.username);
    if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND);

    const isPasswordValid = await bcrypt.compare(
      request.password,
      user.password
    );
    if (!isPasswordValid) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED);

    const token = generateToken({ username: user.username });
    await UserRepository.login(user.username, token);

    return toLoginResponse(user, token);
  }

  static async getAllUsers(): Promise<UserResponse[]> {
    const users = await UserRepository.findAllUsers();
    return users.map(toUserResponse);
  }

  static async getUserDetail(
    request: UserDetailRequest
  ): Promise<UserDetailResponse> {
    const user = await UserRepository.getUserDetail(request.username);
    if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND);

    const base = toUserDetailResponse(user);

    const ov = await UserRepository.getOverride(request.username);
    const withOverride = ov
      ? { ...base, jedaOtomatis: ov.jedaOtomatisAktif }
      : base;

    return withOverride as UserDetailResponse;
  }

  static async logout(userReq: UserRequest): Promise<{ loggedOut: true }> {
    await UserRepository.logout(userReq.user!);
    return { loggedOut: true };
  }

  static async setJedaOtomatis(username: string, payload: SetJedaOtomatisRequest) {
    const user = await UserRepository.findByUsername(username);
    if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND);
    return UserRepository.upsertOverrideJeda(username, payload.aktif);
  }

  /* ========= AGREGAT DETAIL LENGKAP ========= */
  static async getUserEverything(
    username: string,
    query: DetailRangeQuery
  ): Promise<UserEverythingResponse> {
    const base = await UserRepository.getUserDetail(username);
    if (!base) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND);

    // konfigurasi efektif (override > global)
    const eff = await UserRepository.getEffectiveKonfigurasi(username);
    const gajiPerJam = eff.gajiPerJam || 0;

    // summary jam (hari/minggu/bulan/semua)
    const [todayAgg, weekAgg, monthAgg, allTotalJam] = await Promise.all([
      JamKerjaRepository.rekap(username, startOfToday(), endOfToday()),
      JamKerjaRepository.rekap(username, startOfWeek(), endOfWeek()),
      JamKerjaRepository.rekap(username, startOfMonth(), endOfMonth()),
      JamKerjaRepository.sumTotalJamAll(username),
    ]);

    const hariJam = todayAgg._sum.totalJam ?? 0;
    const mingguJam = weekAgg._sum.totalJam ?? 0;
    const bulanJam = monthAgg._sum.totalJam ?? 0;
    const semuaJam = allTotalJam ?? 0;

    // status & session aktif (ambil latest)
    const latestList = await JamKerjaRepository.findByUsername(username);
    const latest = latestList[0];
    let latestStatus: "AKTIF" | "JEDA" | "SELESAI" | "OFF" = "OFF";
    if (latest?.status === "AKTIF") latestStatus = "AKTIF";
    else if (latest?.status === "JEDA") latestStatus = "JEDA";
    else if (latest?.status === "SELESAI") latestStatus = "SELESAI";
    const open = await JamKerjaRepository.findOpenByUsername(username);
    const activeSessionId = open[0]?.id ?? null;

    // histori hari ini
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const todayItems = latestList.filter((j) => {
      const t = new Date(j.jamMulai).getTime();
      return t >= todayStart.getTime() && t <= todayEnd.getTime();
    });

    // histori by range + pagination
    const histPage = Math.max(1, Number(query.histPage || 1));
    const histLimit = Math.min(100, Math.max(1, Number(query.histLimit || 20)));
    const rangeFrom = safeISO(query.from);
    const rangeTo = safeISO(query.to);
    const ranged = latestList.filter((j) => {
      const t = new Date(j.jamMulai).getTime();
      if (rangeFrom && t < new Date(rangeFrom).getTime()) return false;
      if (rangeTo && t > new Date(rangeTo).getTime()) return false;
      return true;
    });
    ranged.sort((a, b) => +new Date(b.jamMulai) - +new Date(a.jamMulai));
    const histTotal = ranged.length;
    const histItems = ranged.slice((histPage - 1) * histLimit, (histPage - 1) * histLimit + histLimit);

    // riwayat pembayaran (pagination)
    const payPage = Math.max(1, Number(query.payPage || 1));
    const payLimit = Math.min(100, Math.max(1, Number(query.payLimit || 10)));
    const { items: payItems, total: payTotal } = await GajiRepository.findMany(
      { username },
      { skip: (payPage - 1) * payLimit, take: payLimit, order: "desc" }
    );

    // summary gaji
    const totalDiterima = await GajiRepository.sumByUsername(username);
    const totalJamAll = round2(semuaJam);
    const upahKeseluruhan = round2(totalJamAll * gajiPerJam);
    const belumDibayar = round2(Math.max(0, upahKeseluruhan - totalDiterima));

    // tugas (mapping dari base)
    const tugas = (toUserDetailResponse(base).tugas ?? []).slice(0, 50);

    return {
      profile: {
        username: base.username,
        namaLengkap: base.namaLengkap,
        role: base.role,
        createdAt: base.createdAt,
        updatedAt: base.updatedAt,
        totals: {
          totalJamKerja: base.totalJamKerja,
          totalGaji: base.totalGaji,
        },
      },
      konfigurasi: eff,
      jamKerja: {
        latestStatus,
        activeSessionId,
        today: { items: todayItems, total: todayItems.length },
        summary: {
          hari: { totalJam: round2(hariJam), totalGaji: round0(hariJam * gajiPerJam) },
          minggu: { totalJam: round2(mingguJam), totalGaji: round0(mingguJam * gajiPerJam) },
          bulan: { totalJam: round2(bulanJam), totalGaji: round0(bulanJam * gajiPerJam) },
          semua: { totalJam: round2(semuaJam), totalGaji: round0(semuaJam * gajiPerJam) },
        },
        history: {
          items: histItems,
          page: histPage,
          perPage: histLimit,
          total: histTotal,
          range: { from: query.from, to: query.to },
        },
      },
      gaji: {
        gajiPerJam,
        summary: {
          totalJam: totalJamAll,
          upahKeseluruhan,
          totalDiterima,
          belumDibayar,
        },
        riwayat: {
          items: payItems as any,
          page: payPage,
          perPage: payLimit,
          total: payTotal,
        },
      },
      tugas,
    };
  }
}
