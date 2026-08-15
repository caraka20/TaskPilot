import {
  Prisma,
  StatusKerja,
  WorkMode,
  WorkStatus,
  type PrismaClient,
} from "../../generated/prisma";
import { AppError } from "../lib/http";

type Database = PrismaClient | Prisma.TransactionClient;

/**
 * WorkEntry dengan penanda ini dibuat hanya sebagai arsip migrasi JamKerja.
 * Nilainya tidak boleh masuk kelompok Harian karena sumber jam-jaman dihitung
 * langsung dari JamKerja agar sesi baru setelah migrasi ikut secara otomatis.
 */
export const LEGACY_HOURLY_MIGRATION_REASON = "LEGACY_TASKPILOT_MIGRATION";

type PayrollOptions = {
  excludeWorkId?: string;
  excludePaymentId?: string;
  range?: {
    from: Date;
    to: Date;
  };
};

function nativeAttendanceWhere(
  userId?: string,
  excludeWorkId?: string,
  range?: PayrollOptions["range"],
): Prisma.WorkEntryWhereInput {
  return {
    ...(userId ? { userId } : {}),
    status: WorkStatus.APPROVED,
    ...(range ? { workDate: { gte: range.from, lt: range.to } } : {}),
    ...(excludeWorkId ? { id: { not: excludeWorkId } } : {}),
    OR: [
      { automationReason: null },
      { automationReason: { not: LEGACY_HOURLY_MIGRATION_REASON } },
    ],
  };
}

async function hourlyRate(db: Database, username: string) {
  const [override, globalConfig] = await Promise.all([
    db.konfigurasiOverride.findUnique({
      where: { username },
      select: { gajiPerJam: true },
    }),
    db.konfigurasi.findUnique({
      where: { id: 1 },
      select: { gajiPerJam: true },
    }),
  ]);

  return new Prisma.Decimal(
    override?.gajiPerJam ?? globalConfig?.gajiPerJam ?? 0,
  );
}

export async function getPayrollSummary(
  db: Database,
  userId: string,
  options: PayrollOptions = {},
) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { username: true },
  });
  const attendanceWhere = nativeAttendanceWhere(userId, options.excludeWorkId, options.range);

  const [rate, legacyHours, attendanceByMode, payments, produced] =
    await Promise.all([
      hourlyRate(db, user.username),
      db.jamKerja.aggregate({
        where: {
          username: user.username,
          status: StatusKerja.SELESAI,
          ...(options.range ? { tanggal: { gte: options.range.from, lt: options.range.to } } : {}),
        },
        _sum: { totalJam: true },
        _count: { _all: true },
      }),
      db.workEntry.groupBy({
        by: ["mode"],
        where: attendanceWhere,
        _sum: { finalAmount: true },
        _count: { _all: true },
      }),
      db.payment.aggregate({
        where: {
          userId,
          ...(options.range ? { paymentDate: { gte: options.range.from, lt: options.range.to } } : {}),
          ...(options.excludePaymentId
            ? { id: { not: options.excludePaymentId } }
            : {}),
        },
        _sum: { amount: true },
      }),
      db.pieceworkItem.aggregate({
        where: { workEntry: attendanceWhere },
        _sum: { quantity: true },
      }),
    ]);

  const hourlyHours = Number(legacyHours._sum.totalJam ?? 0);
  const hourlyEarned = rate.mul(hourlyHours);
  const dailyRow = attendanceByMode.find((row) => row.mode === WorkMode.DAILY);
  const pieceworkRow = attendanceByMode.find(
    (row) => row.mode === WorkMode.PIECEWORK,
  );
  const dailyEarned = dailyRow?._sum.finalAmount ?? new Prisma.Decimal(0);
  const pieceworkEarned =
    pieceworkRow?._sum.finalAmount ?? new Prisma.Decimal(0);
  const attendanceEarned = dailyEarned.plus(pieceworkEarned);
  const totalEarned = hourlyEarned.plus(attendanceEarned);
  const totalPaid = payments._sum.amount ?? new Prisma.Decimal(0);
  const attendanceCount = attendanceByMode.reduce(
    (total, row) => total + row._count._all,
    0,
  );

  return {
    hourlyHours,
    hourlyRate: rate,
    hourlyEarned,
    hourlySessionCount: legacyHours._count._all,
    dailyEarned,
    dailyCount: dailyRow?._count._all ?? 0,
    pieceworkEarned,
    pieceworkCount: pieceworkRow?._count._all ?? 0,
    attendanceEarned,
    totalEarned,
    totalPaid,
    balance: totalEarned.minus(totalPaid),
    attendanceCount,
    totalWorkCount: attendanceCount + legacyHours._count._all,
    totalItems: produced._sum.quantity ?? 0,
  };
}

/**
 * Ringkasan semua pekerja untuk dashboard OWNER. Penghitungan dibagi per user
 * karena setiap pekerja dapat memiliki tarif jam override yang berbeda.
 */
export async function getCompanyPayrollSummary(
  db: Database,
  options: PayrollOptions = {},
) {
  const users = await db.user.findMany({
    where: { role: "USER" },
    select: { id: true },
    orderBy: { username: "asc" },
  });
  const summaries = await Promise.all(
    users.map((user) => getPayrollSummary(db, user.id, options)),
  );

  const zero = () => new Prisma.Decimal(0);
  return summaries.reduce(
    (total, summary) => ({
      hourlyHours: total.hourlyHours + summary.hourlyHours,
      hourlyEarned: total.hourlyEarned.plus(summary.hourlyEarned),
      dailyEarned: total.dailyEarned.plus(summary.dailyEarned),
      pieceworkEarned: total.pieceworkEarned.plus(summary.pieceworkEarned),
      attendanceEarned: total.attendanceEarned.plus(summary.attendanceEarned),
      totalEarned: total.totalEarned.plus(summary.totalEarned),
      totalPaid: total.totalPaid.plus(summary.totalPaid),
      balance: total.balance.plus(summary.balance),
      hourlySessionCount:
        total.hourlySessionCount + summary.hourlySessionCount,
      dailyCount: total.dailyCount + summary.dailyCount,
      pieceworkCount: total.pieceworkCount + summary.pieceworkCount,
      attendanceCount: total.attendanceCount + summary.attendanceCount,
      totalWorkCount: total.totalWorkCount + summary.totalWorkCount,
      totalItems: total.totalItems + Number(summary.totalItems),
    }),
    {
      hourlyHours: 0,
      hourlyEarned: zero(),
      dailyEarned: zero(),
      pieceworkEarned: zero(),
      attendanceEarned: zero(),
      totalEarned: zero(),
      totalPaid: zero(),
      balance: zero(),
      hourlySessionCount: 0,
      dailyCount: 0,
      pieceworkCount: 0,
      attendanceCount: 0,
      totalWorkCount: 0,
      totalItems: 0,
    },
  );
}

export function ensureNonNegativeBalance(
  earned: Prisma.Decimal,
  paid: Prisma.Decimal,
) {
  if (earned.lessThan(paid)) {
    throw new AppError(
      409,
      "Perubahan ditolak karena akan membuat sisa gaji menjadi negatif.",
    );
  }
}
