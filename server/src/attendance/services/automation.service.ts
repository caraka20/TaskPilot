import { Prisma, WorkMode, WorkStatus } from "../../generated/prisma";
import { dateOnly, todayString } from "../lib/date";
import { prisma } from "../lib/prisma";

const AUTO_APPROVAL_DELAY_MS = 4 * 60 * 60 * 1_000;

function jakartaClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.ATTENDANCE_TIMEZONE || process.env.TZ || "Asia/Jakarta",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

/**
 * Menutup laporan yang tertinggal dari hari sebelumnya. Untuk hari berjalan,
 * penutupan dilakukan mulai 23:00 WIB (satu jam sebelum pergantian hari)
 * normal dan mengisi jumlah produksi borongan.
 */
export async function autoCloseAttendanceEntries(now = new Date()) {
  const clock = jakartaClock(now);
  const currentDate = dateOnly(clock.date);
  const shouldCloseCurrentDate = clock.hour >= 23;

  const entries = await prisma.workEntry.findMany({
    where: {
      status: WorkStatus.IN_PROGRESS,
      OR: [
        { workDate: { lt: currentDate } },
        ...(shouldCloseCurrentDate ? [{ workDate: currentDate }] : []),
      ],
    },
    include: { items: true },
  });

  for (const entry of entries) {
    const finalAmount =
      entry.mode === WorkMode.DAILY
        ? entry.dailyRateSnapshot ?? 0
        : entry.items.reduce(
            (sum, item) => sum.plus(item.subtotal),
            new Prisma.Decimal(0),
          );

    await prisma.workEntry.update({
      where: { id: entry.id },
      data: {
        clockOut: entry.clockOut ?? now,
        finalAmount,
        status: WorkStatus.PENDING,
        submittedAt: entry.submittedAt ?? now,
        autoClosedAt: now,
        automationReason:
          entry.mode === WorkMode.PIECEWORK && entry.items.length === 0
            ? "Ditutup otomatis; jumlah produksi perlu diperiksa admin."
            : "Ditutup otomatis satu jam sebelum pergantian hari.",
      },
    });
  }

  return { closed: entries.length };
}

/**
 * Grace period empat jam dihitung sejak auto-close. Pekerjaan manual tetap
 * harus disetujui admin dan tidak pernah disentuh fungsi ini.
 */
export async function autoApproveAttendanceEntries(now = new Date()) {
  const threshold = new Date(now.getTime() - AUTO_APPROVAL_DELAY_MS);
  const result = await prisma.workEntry.updateMany({
    where: {
      status: WorkStatus.PENDING,
      autoClosedAt: { not: null, lte: threshold },
      autoApprovedAt: null,
    },
    data: {
      status: WorkStatus.APPROVED,
      approvedAt: now,
      autoApprovedAt: now,
      correctionReason: "Disetujui otomatis setelah grace period 4 jam.",
    },
  });
  return { approved: result.count };
}

export async function runAttendanceAutomation(now = new Date()) {
  const close = await autoCloseAttendanceEntries(now);
  const approve = await autoApproveAttendanceEntries(now);
  return { ...close, ...approve, date: todayString() };
}
