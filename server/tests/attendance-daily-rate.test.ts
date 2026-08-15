import { Prisma } from "../src/generated/prisma";
import { getDailyRate } from "../src/attendance/services/rate.service";

describe("attendance daily rate", () => {
  it("menggunakan tarif efektif terbaru pada tanggal pekerjaan", async () => {
    const db = {
      dailyRateHistory: {
        findFirst: jest.fn().mockResolvedValue({ amount: new Prisma.Decimal(75_000) }),
      },
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ dailyRate: new Prisma.Decimal(50_000) }),
      },
    };

    const rate = await getDailyRate(db as never, "user-1", new Date("2026-08-14T00:00:00.000Z"));

    expect(Number(rate)).toBe(75_000);
    expect(db.dailyRateHistory.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "user-1" }) }),
    );
  });

  it("menggunakan tarif profil jika histori efektif belum tersedia", async () => {
    const db = {
      dailyRateHistory: { findFirst: jest.fn().mockResolvedValue(null) },
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ dailyRate: new Prisma.Decimal(40_000) }),
      },
    };

    const rate = await getDailyRate(db as never, "user-2", new Date("2026-08-14T00:00:00.000Z"));

    expect(Number(rate)).toBe(40_000);
  });
});
