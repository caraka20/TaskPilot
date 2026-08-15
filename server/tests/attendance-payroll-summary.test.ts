import { Prisma, WorkMode, WorkStatus } from "../src/generated/prisma";
import {
  getPayrollSummary,
  LEGACY_HOURLY_MIGRATION_REASON,
} from "../src/attendance/services/payroll.service";

describe("attendance payroll summary", () => {
  it("menggabungkan upah jam-jaman, harian, dan borongan tanpa menghitung arsip migrasi dua kali", async () => {
    const db = {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ username: "worker-a" }),
      },
      konfigurasiOverride: {
        findUnique: jest.fn().mockResolvedValue({ gajiPerJam: 10_000 }),
      },
      konfigurasi: {
        findUnique: jest.fn().mockResolvedValue({ gajiPerJam: 8_000 }),
      },
      jamKerja: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { totalJam: 5.5 },
          _count: { _all: 2 },
        }),
      },
      workEntry: {
        groupBy: jest.fn().mockResolvedValue([
          {
            mode: WorkMode.DAILY,
            _sum: { finalAmount: new Prisma.Decimal(50_000) },
            _count: { _all: 2 },
          },
          {
            mode: WorkMode.PIECEWORK,
            _sum: { finalAmount: new Prisma.Decimal(30_000) },
            _count: { _all: 1 },
          },
        ]),
      },
      payment: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: new Prisma.Decimal(20_000) },
        }),
      },
      pieceworkItem: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 12 } }),
      },
    };

    const summary = await getPayrollSummary(db as never, "user-1");

    expect(summary.hourlyHours).toBe(5.5);
    expect(Number(summary.hourlyRate)).toBe(10_000);
    expect(Number(summary.hourlyEarned)).toBe(55_000);
    expect(Number(summary.dailyEarned)).toBe(50_000);
    expect(Number(summary.pieceworkEarned)).toBe(30_000);
    expect(Number(summary.totalEarned)).toBe(135_000);
    expect(Number(summary.totalPaid)).toBe(20_000);
    expect(Number(summary.balance)).toBe(115_000);
    expect(summary.totalWorkCount).toBe(5);
    expect(summary.totalItems).toBe(12);

    expect(db.workEntry.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          status: WorkStatus.APPROVED,
          OR: [
            { automationReason: null },
            { automationReason: { not: LEGACY_HOURLY_MIGRATION_REASON } },
          ],
        }),
      }),
    );
  });

  it("menggunakan tarif global jika user tidak memiliki override", async () => {
    const db = {
      user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ username: "worker-b" }) },
      konfigurasiOverride: { findUnique: jest.fn().mockResolvedValue(null) },
      konfigurasi: { findUnique: jest.fn().mockResolvedValue({ gajiPerJam: 9_000 }) },
      jamKerja: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { totalJam: 2 },
          _count: { _all: 1 },
        }),
      },
      workEntry: { groupBy: jest.fn().mockResolvedValue([]) },
      payment: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }) },
      pieceworkItem: { aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: null } }) },
    };

    const summary = await getPayrollSummary(db as never, "user-2");

    expect(Number(summary.hourlyEarned)).toBe(18_000);
    expect(Number(summary.totalEarned)).toBe(18_000);
    expect(Number(summary.balance)).toBe(18_000);
  });
});
