import { Prisma, WorkMode } from "../src/generated/prisma";
import { resolveWorkEntryFinalAmount } from "../src/attendance/services/work-entry-amount.service";

describe("attendance work entry amount", () => {
  it("menggunakan hasil hitung terbaru ketika kuantitas borongan berubah", () => {
    const result = resolveWorkEntryFinalAmount({
      mode: WorkMode.PIECEWORK,
      calculated: new Prisma.Decimal(150_000),
      requested: "60000",
    });

    expect(Number(result)).toBe(150_000);
  });

  it("menerima nominal manual borongan hanya jika override dinyalakan", () => {
    const result = resolveWorkEntryFinalAmount({
      mode: WorkMode.PIECEWORK,
      calculated: new Prisma.Decimal(150_000),
      requested: "145000",
      manualAmount: true,
    });

    expect(Number(result)).toBe(145_000);
  });

  it("tetap mendukung koreksi nominal harian", () => {
    const result = resolveWorkEntryFinalAmount({
      mode: WorkMode.DAILY,
      calculated: new Prisma.Decimal(100_000),
      requested: "110000",
    });

    expect(Number(result)).toBe(110_000);
  });
});
