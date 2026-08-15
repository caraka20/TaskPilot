import ExcelJS from "exceljs";
import { Router } from "express";
import { Prisma } from "../../../generated/prisma";
import { z } from "zod";
import { dateOnly, today, todayString } from "../../lib/date";
import { AppError, asyncRoute, routeParam } from "../../lib/http";
import { money } from "../../lib/money";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";
import { writeAudit } from "../../services/audit.service";
import {
  ensureNonNegativeBalance,
  getPayrollSummary,
  LEGACY_HOURLY_MIGRATION_REASON,
} from "../../services/payroll.service";
import { createPayrollSlipPdf } from "../../services/payroll-slip.service";

const router = Router();

const validatePositive = (value: string | number) => {
  const result = money(value);
  if (result.isZero()) throw new AppError(422, "Nominal pembayaran harus lebih dari nol.");
  return result;
};

router.get(
  "/payroll/summary",
  asyncRoute(async (_request, response) => {
    const users = await prisma.user.findMany({
      where: { role: "USER", deletedAt: null },
      select: {
        id: true,
        name: true,
        username: true,
        dailyRate: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
    const rows = await Promise.all(
      users.map(async (user) => ({
        ...user,
        ...(await getPayrollSummary(prisma, user.id)),
      })),
    );
    response.json({ users: serialize(rows) });
  }),
);

router.get(
  "/payroll/:userId",
  asyncRoute(async (request, response) => {
    const userId = routeParam(request, "userId");
    const [user, summary, payments, entries] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, name: true, username: true, dailyRate: true, isActive: true },
      }),
      getPayrollSummary(prisma, userId),
      prisma.payment.findMany({
        where: { userId },
        orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
      }),
      prisma.workEntry.findMany({
        where: {
          userId,
          status: "APPROVED",
          OR: [
            { automationReason: null },
            { automationReason: { not: LEGACY_HOURLY_MIGRATION_REASON } },
          ],
        },
        include: { items: { include: { product: true } } },
        orderBy: { workDate: "desc" },
        take: 50,
      }),
    ]);
    response.json(serialize({ user, summary, payments, entries }));
  }),
);

router.post(
  "/payroll/:userId/payments",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        paymentDate: z.string().optional(),
        amount: z.union([z.string(), z.number()]),
        note: z.string().trim().max(255).optional(),
      })
      .parse(request.body);
    const paymentDate = input.paymentDate ? dateOnly(input.paymentDate) : today();
    if ((input.paymentDate ?? todayString()) > todayString()) {
      throw new AppError(422, "Tanggal pembayaran tidak boleh di masa depan.");
    }
    const paymentAmount = validatePositive(input.amount);
    const userId = routeParam(request, "userId");

    const payment = await prisma.$transaction(
      async (transaction) => {
        await transaction.user.findUniqueOrThrow({ where: { id: userId } });
        const summary = await getPayrollSummary(transaction, userId);
        ensureNonNegativeBalance(summary.totalEarned, summary.totalPaid.plus(paymentAmount));
        const created = await transaction.payment.create({
          data: {
            userId,
            paymentDate,
            amount: paymentAmount,
            note: input.note || null,
            createdById: request.auth!.sub,
          },
        });
        await writeAudit(transaction, {
          actorId: request.auth!.sub,
          entityType: "Payment",
          entityId: created.id,
          action: "CREATE",
          afterData: created,
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    response.status(201).json({ payment: serialize(payment) });
  }),
);

router.patch(
  "/payroll/payments/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        paymentDate: z.string().optional(),
        amount: z.union([z.string(), z.number()]).optional(),
        note: z.string().trim().max(255).nullable().optional(),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    if (input.paymentDate && input.paymentDate > todayString()) {
      throw new AppError(422, "Tanggal pembayaran tidak boleh di masa depan.");
    }

    const payment = await prisma.$transaction(
      async (transaction) => {
        const before = await transaction.payment.findUniqueOrThrow({
          where: { id: routeParam(request, "id") },
        });
        const nextAmount =
          input.amount === undefined ? before.amount : validatePositive(input.amount);
        const summary = await getPayrollSummary(transaction, before.userId, {
          excludePaymentId: before.id,
        });
        ensureNonNegativeBalance(summary.totalEarned, summary.totalPaid.plus(nextAmount));
        const updated = await transaction.payment.update({
          where: { id: before.id },
          data: {
            paymentDate: input.paymentDate ? dateOnly(input.paymentDate) : undefined,
            amount: nextAmount,
            note: input.note,
          },
        });
        await writeAudit(transaction, {
          actorId: request.auth!.sub,
          entityType: "Payment",
          entityId: updated.id,
          action: "UPDATE",
          beforeData: before,
          afterData: updated,
          reason: input.reason,
        });
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    response.json({ payment: serialize(payment) });
  }),
);

router.delete(
  "/payroll/payments/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({ reason: z.string().trim().min(3).max(255) })
      .parse(request.body);
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    await prisma.$transaction(async (transaction) => {
      await transaction.payment.delete({ where: { id: payment.id } });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "Payment",
        entityId: payment.id,
        action: "DELETE",
        beforeData: payment,
        reason: input.reason,
      });
    });
    response.status(204).send();
  }),
);

async function reportData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const [summary, entries, legacyEntries, payments] = await Promise.all([
    getPayrollSummary(prisma, userId),
    prisma.workEntry.findMany({
      where: {
        userId,
        status: "APPROVED",
        OR: [
          { automationReason: null },
          { automationReason: { not: LEGACY_HOURLY_MIGRATION_REASON } },
        ],
      },
      include: { items: { include: { product: true } } },
      orderBy: { workDate: "asc" },
    }),
    prisma.jamKerja.findMany({
      where: { username: user.username, status: "SELESAI" },
      orderBy: { jamMulai: "asc" },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { paymentDate: "asc" },
    }),
  ]);
  return { user, summary, entries, legacyEntries, payments };
}

router.get(
  "/reports/payroll/:userId.xlsx",
  asyncRoute(async (request, response) => {
    const data = await reportData(routeParam(request, "userId"));
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Absensi";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Ringkasan");
    summarySheet.columns = [{ width: 28 }, { width: 24 }];
    summarySheet.addRows([
      ["LAPORAN GAJI - ABSENSI"],
      ["Nama", data.user.name],
      ["Username", data.user.username],
      ["Total pekerjaan", data.summary.totalWorkCount],
      ["Total item", data.summary.totalItems],
      ["Upah jam-jaman", Number(data.summary.hourlyEarned)],
      ["Upah harian", Number(data.summary.dailyEarned)],
      ["Upah borongan", Number(data.summary.pieceworkEarned)],
      ["Total pendapatan", Number(data.summary.totalEarned)],
      ["Total pembayaran", Number(data.summary.totalPaid)],
      ["Sisa gaji", Number(data.summary.balance)],
    ]);
    summarySheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF12335D" } };
    summarySheet.mergeCells("A1:B1");
    [6, 7, 8, 9, 10, 11].forEach((row) => {
      summarySheet.getCell(row, 2).numFmt = '"Rp" #,##0';
    });

    const workSheet = workbook.addWorksheet("Pekerjaan");
    workSheet.columns = [
      { header: "Tanggal", key: "date", width: 16 },
      { header: "Jenis", key: "mode", width: 16 },
      { header: "Jam masuk", key: "clockIn", width: 20 },
      { header: "Jam pulang", key: "clockOut", width: 20 },
      { header: "Jumlah item", key: "items", width: 16 },
      { header: "Nominal", key: "amount", width: 20 },
      { header: "Catatan", key: "note", width: 45 },
    ];
    data.entries.forEach((entry) =>
      workSheet.addRow({
        date: entry.workDate.toISOString().slice(0, 10),
        mode: entry.mode === "DAILY" ? "Harian" : "Borongan",
        clockIn: entry.clockIn ?? "",
        clockOut: entry.clockOut ?? "",
        items: entry.items.reduce((total, item) => total + item.quantity, 0),
        amount: Number(entry.finalAmount),
        note: entry.note ?? "",
      }),
    );
    workSheet.getColumn("amount").numFmt = '"Rp" #,##0';

    const hourlySheet = workbook.addWorksheet("Jam-jaman");
    hourlySheet.columns = [
      { header: "Tanggal", key: "date", width: 16 },
      { header: "Jam mulai", key: "start", width: 22 },
      { header: "Jam selesai", key: "end", width: 22 },
      { header: "Total jam", key: "hours", width: 16 },
      { header: "Tarif/jam", key: "rate", width: 20 },
      { header: "Upah", key: "amount", width: 20 },
    ];
    data.legacyEntries.forEach((entry) =>
      hourlySheet.addRow({
        date: entry.tanggal.toISOString().slice(0, 10),
        start: entry.jamMulai,
        end: entry.jamSelesai ?? "",
        hours: entry.totalJam,
        rate: Number(data.summary.hourlyRate),
        amount: entry.totalJam * Number(data.summary.hourlyRate),
      }),
    );
    hourlySheet.getColumn("rate").numFmt = '"Rp" #,##0';
    hourlySheet.getColumn("amount").numFmt = '"Rp" #,##0';

    const paymentSheet = workbook.addWorksheet("Pembayaran");
    paymentSheet.columns = [
      { header: "Tanggal", key: "date", width: 16 },
      { header: "Nominal", key: "amount", width: 20 },
      { header: "Keterangan", key: "note", width: 45 },
    ];
    data.payments.forEach((payment) =>
      paymentSheet.addRow({
        date: payment.paymentDate.toISOString().slice(0, 10),
        amount: Number(payment.amount),
        note: payment.note ?? "",
      }),
    );
    paymentSheet.getColumn("amount").numFmt = '"Rp" #,##0';

    for (const sheet of [workSheet, hourlySheet, paymentSheet]) {
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF12335D" } };
      sheet.autoFilter = {
        from: "A1",
        to:
          sheet.name === "Pekerjaan"
            ? "G1"
            : sheet.name === "Jam-jaman"
              ? "F1"
              : "C1",
      };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    response.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="laporan-${data.user.username}.xlsx"`,
    );
    response.send(Buffer.from(buffer));
  }),
);

router.get(
  "/reports/payroll/:userId.pdf",
  asyncRoute(async (request, response) => {
    const data = await reportData(routeParam(request, "userId"));
    const pdf = await createPayrollSlipPdf(data);

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="slip-${data.user.username}.pdf"`,
    );
    response.send(pdf);
  }),
);

export const adminPayrollRouter = router;
