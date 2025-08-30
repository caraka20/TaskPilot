import { AppError } from "../../middleware/app-error";
import { ERROR_CODE } from "../../utils/error-codes";
import { UserRepository } from "../user/user.repository";
import {
  JamKerjaAktifQuery,
  JamKerjaResponse,
  RekapJamKerjaResponse,
  StartJamKerjaRequest,
  toRekapJamKerjaResponse,
  OwnerUserSummary,
  OwnerSummaryResponse,
} from "./jam-kerja.model";
import { JamKerjaRepository } from "./jam-kerja.repository";
import { io } from "../../server";
import { Role, StatusKerja } from "../../generated/prisma";

/* helpers tanggal */
function startOfToday(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0); }
function endOfToday(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59,999); }
function startOfWeek(): Date { const now = new Date(); const day = now.getDay(); const diff = now.getDate() - day + (day === 0 ? -6 : 1); return new Date(now.getFullYear(), now.getMonth(), diff, 0,0,0,0); }
function endOfWeek(): Date { const s = startOfWeek(); const e = new Date(s); e.setDate(e.getDate() + 6); e.setHours(23,59,59,999); return e; }
function startOfMonth(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0,0); }
function endOfMonth(): Date { const now = new Date(); return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23,59,59,999); }
const round2 = (n: number) => Math.round(n * 100) / 100;
const round0 = (n: number) => Math.round(n);
function toNum(x: any, d = 0) { const n = Number(x); return Number.isFinite(n) ? n : d; }

async function getRateFor(username: string): Promise<number> {
  try {
    const eff = await (UserRepository as any).getEffectiveKonfigurasi?.(username);
    const val = toNum(eff?.gajiPerJam, NaN); if (!Number.isNaN(val) && val > 0) return val;
  } catch {}
  try {
    const g = await UserRepository.getKonfigurasi();
    const val = toNum(g?.gajiPerJam, NaN); if (!Number.isNaN(val) && val > 0) return val;
  } catch {}
  const envVal = toNum(process.env.DEFAULT_GAJI_PER_JAM, NaN);
  if (!Number.isNaN(envVal) && envVal > 0) return envVal;
  return 10000;
}

export class JamKerjaService {
  /* START */
  static async startJamKerja(payload: StartJamKerjaRequest) {
    // pastikan user ada → kalau tidak, jangan biarkan Prisma error 500
    const target = await UserRepository.findByUsername(payload.username);
    if (!target) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND);

    // jika sudah ada sesi terbuka, kembalikan saja (tidak error) supaya FE langsung sync
    const open = await JamKerjaRepository.findOpenByUsername(payload.username);
    if (open.length > 0) return open[0];

    // buat segmen baru
    const now = new Date();
    const jamKerja = await JamKerjaRepository.createStart(payload.username, now);

    io?.emit?.("jamKerja:started", {
      id: jamKerja.id,
      username: jamKerja.username,
      jamMulai: jamKerja.jamMulai,
      status: jamKerja.status,
    });

    return jamKerja;
  }

  /* END (SELESAI) */
  static async endJamKerja(current: { username: string; role: Role }, id: number) {
    const row = await JamKerjaRepository.findById(id);
    if (!row) throw AppError.fromCode(ERROR_CODE.NOT_FOUND);

    if (current.role !== Role.OWNER && row.username !== current.username) {
      throw AppError.fromCode(ERROR_CODE.FORBIDDEN);
    }
    if (row.status !== "AKTIF" || row.jamSelesai) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Sesi tidak aktif");
    }

    const now = new Date();
    const durasiJam = (now.getTime() - new Date(row.jamMulai).getTime()) / 3600000;
    const totalJam = Math.max(0, round2(durasiJam));
    const gajiPerJam = await getRateFor(row.username);

    await JamKerjaRepository.endJamKerja(id, now, totalJam);
    await UserRepository.tambahJamKerjaDanGaji(row.username, totalJam, gajiPerJam);

    io?.emit?.("jamKerja:ended", {
      id: row.id,
      username: row.username,
      jamSelesai: now,
      totalJam,
      status: "SELESAI",
    });

    return { totalJam, jamSelesai: now };
  }

  /* HISTORY */
  static async getHistory(username: string): Promise<JamKerjaResponse[]> {
    const list = await JamKerjaRepository.findByUsername(username);
    return list.map((j) => ({
      id: j.id, username: j.username,
      jamMulai: j.jamMulai, jamSelesai: j.jamSelesai,
      totalJam: j.totalJam, status: j.status, tanggal: j.tanggal,
    }));
  }

  /* REKAP */
  static async rekap(username: string, period: "minggu" | "bulan"): Promise<RekapJamKerjaResponse> {
    const now = new Date();
    let start: Date;
    if (period === "minggu") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    const result = await JamKerjaRepository.rekap(username, start, new Date());
    const totalJam = result._sum.totalJam || 0;
    return toRekapJamKerjaResponse(username, totalJam, period);
  }

  static async getActive(
    current: { username: string; role: Role },
    query: { username: string; period: "minggu" | "bulan" }
  ): Promise<RekapJamKerjaResponse> {
    if (current.role === Role.USER && query.username !== current.username) {
      throw AppError.fromCode(ERROR_CODE.FORBIDDEN, "USER hanya boleh akses datanya sendiri");
    }

    const now = new Date();
    let start: Date;
    if (query.period === "minggu") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const agg = await JamKerjaRepository.rekapAktif?.(query.username, start, now);
    const totalJam = (agg?._sum.totalJam as number) || 0;
    return toRekapJamKerjaResponse(query.username, totalJam, query.period);
  }

  static async getAktif(query: JamKerjaAktifQuery): Promise<JamKerjaResponse[]> {
    const list = await JamKerjaRepository.findAktif(query);
    return list.map((j) => ({
      id: j.id, username: j.username,
      jamMulai: j.jamMulai, jamSelesai: j.jamSelesai,
      totalJam: j.totalJam, status: j.status, tanggal: j.tanggal,
    }));
  }

  /* PAUSE/RESUME */
  static async pause(current: { username: string; role: Role }, id: number) {
    const row = await JamKerjaRepository.findById(id);
    if (!row) throw AppError.fromCode(ERROR_CODE.NOT_FOUND);
    if (current.role !== Role.OWNER && row.username !== current.username) {
      throw AppError.fromCode(ERROR_CODE.FORBIDDEN);
    }
    if (row.status !== "AKTIF" || row.jamSelesai)
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Sesi tidak bisa dijeda");

    const now = new Date();
    const durasiJam = (now.getTime() - new Date(row.jamMulai).getTime()) / 3600000;

    const updated = await JamKerjaRepository.closeAs(
      id, now, Math.max(0, Math.round(durasiJam * 100) / 100), StatusKerja.JEDA
    );

    io?.emit?.("jamKerja:paused", {
      id: updated.id, username: updated.username, status: updated.status,
      jamMulai: updated.jamMulai, jamSelesai: updated.jamSelesai, totalJam: updated.totalJam,
    });

    return updated;
  }

  static async resume(current: { username: string; role: Role }, id: number) {
    const row = await JamKerjaRepository.findById(id);
    if (!row) throw AppError.fromCode(ERROR_CODE.NOT_FOUND);
    if (current.role !== Role.OWNER && row.username !== current.username) {
      throw AppError.fromCode(ERROR_CODE.FORBIDDEN);
    }
    if (row.status !== "JEDA") {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Sesi tidak bisa diresume");
    }

    // legacy flip jika belum ditutup
    if (!row.jamSelesai) {
      const updated = await JamKerjaRepository.updateStatus(id, StatusKerja.AKTIF);
      io?.emit?.("jamKerja:resumed", {
        id: updated.id, username: updated.username, status: updated.status, jamMulai: updated.jamMulai,
      });
      return updated;
    }

    // segmen baru jika jeda sudah ditutup
    const open = await JamKerjaRepository.findOpenByUsername(row.username);
    if (open.length > 0) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Masih ada sesi aktif");
    }

    const now = new Date();
    const created = await JamKerjaRepository.createStart(row.username, now);

    io?.emit?.("jamKerja:resumed", {
      id: created.id, username: created.username, status: created.status, jamMulai: created.jamMulai,
    });

    return created;
  }

  /* SUMMARY (tetap) */
  static async buildUserSummary(username: string) { /* ... (tidak diubah) ... */ 
    const gajiPerJam = await getRateFor(username);
    const latestList = await JamKerjaRepository.findByUsername(username);
    const latest = latestList[0];
    const [todayAgg, weekAgg, monthAgg, allJam] = await Promise.all([
      JamKerjaRepository.rekap(username, startOfToday(), endOfToday()),
      JamKerjaRepository.rekap(username, startOfWeek(), endOfWeek()),
      JamKerjaRepository.rekap(username, startOfMonth(), endOfMonth()),
      JamKerjaRepository.sumTotalJamAll(username),
    ]);
    const todayJam = toNum(todayAgg._sum.totalJam);
    const weekJam  = toNum(weekAgg._sum.totalJam);
    const monthJam = toNum(monthAgg._sum.totalJam);
    const allTotal = toNum(allJam);

    let status: "AKTIF" | "JEDA" | "OFF" | "SELESAI" = "OFF";
    if (latest?.status === "AKTIF") status = "AKTIF";
    else if (latest?.status === "JEDA") status = "JEDA";
    else if (latest?.status === "SELESAI") status = "SELESAI";

    return {
      username,
      status,
      sesiTerakhir: latest ? {
        id: latest.id, jamMulai: latest.jamMulai, jamSelesai: latest.jamSelesai, status: latest.status as any,
      } : null,
      totals: {
        hari:   { totalJam: round2(todayJam), totalGaji: round0(todayJam * gajiPerJam) },
        minggu: { totalJam: round2(weekJam),  totalGaji: round0(weekJam * gajiPerJam) },
        bulan:  { totalJam: round2(monthJam), totalGaji: round0(monthJam * gajiPerJam) },
        semua:  { totalJam: round2(allTotal), totalGaji: round0(allTotal * gajiPerJam) },
      },
    } as OwnerUserSummary;
  }

  static async buildOwnerSummary(filterUsername?: string): Promise<OwnerSummaryResponse> {
    const usernames = filterUsername ? [filterUsername] : await (UserRepository as any).listUsernames();
    const [summaries, currents] = await Promise.all([
      Promise.all(usernames.map((u: any) => this.buildUserSummary(u))),
      JamKerjaRepository.findCurrentAll(),
    ]);
    const aktifSet = new Set<string>();
    const jedaSet  = new Set<string>();
    for (const c of currents) {
      if (c.status === StatusKerja.AKTIF && c.jamSelesai === null) aktifSet.add(c.username);
      if (c.status === StatusKerja.JEDA  && c.jamSelesai === null) jedaSet.add(c.username);
    }
    return {
      generatedAt: new Date(),
      counts: { users: summaries.length, aktif: aktifSet.size, jeda: jedaSet.size },
      users: summaries,
    };
  }
}

export default JamKerjaService;
