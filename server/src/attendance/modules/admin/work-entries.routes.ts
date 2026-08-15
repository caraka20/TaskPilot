import { Router } from "express";
import { Prisma, WorkMode, WorkStatus } from "../../../generated/prisma";
import { z } from "zod";
import { dateOnly, todayString } from "../../lib/date";
import { AppError, asyncRoute, routeParam } from "../../lib/http";
import { money } from "../../lib/money";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";
import { writeAudit } from "../../services/audit.service";
import {
  ensureNonNegativeBalance,
  getPayrollSummary,
} from "../../services/payroll.service";
import { getDailyRate, getProductRate } from "../../services/rate.service";
import { resolveWorkEntryFinalAmount } from "../../services/work-entry-amount.service";

const router = Router();
const itemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.coerce.number().int().positive(),
    }),
  )
  .max(50)
  .superRefine((items, context) => {
    const ids = items.map((item) => item.productId);
    if (ids.length !== new Set(ids).size) {
      context.addIssue({ code: "custom", message: "Produk tidak boleh berulang." });
    }
  });

const optionalDateTime = z
  .union([z.string().datetime(), z.literal(""), z.null()])
  .optional();

const parseDateTime = (value: string | null | undefined) =>
  value ? new Date(value) : value === null || value === "" ? null : undefined;

async function replaceItems(
  transaction: Prisma.TransactionClient,
  input: {
    entryId: string;
    userId: string;
    workDate: Date;
    items: Array<{ productId: string; quantity: number }>;
  },
) {
  await transaction.pieceworkItem.deleteMany({ where: { workEntryId: input.entryId } });
  let total = new Prisma.Decimal(0);
  for (const item of input.items) {
    const unitRate = await getProductRate(
      transaction,
      input.userId,
      item.productId,
      input.workDate,
    );
    const subtotal = unitRate.mul(item.quantity);
    total = total.plus(subtotal);
    await transaction.pieceworkItem.create({
      data: {
        workEntryId: input.entryId,
        productId: item.productId,
        quantity: item.quantity,
        unitRateSnapshot: unitRate,
        subtotal,
      },
    });
  }
  return total;
}

router.get(
  "/work-entries/pending-count",
  asyncRoute(async (_request, response) => {
    const pendingApprovals = await prisma.workEntry.count({
      where: { status: WorkStatus.PENDING },
    });
    response.json({ pendingApprovals });
  }),
);

router.get(
  "/work-entries",
  asyncRoute(async (request, response) => {
    const status = request.query.status
      ? z.nativeEnum(WorkStatus).parse(request.query.status)
      : undefined;
    const userId = request.query.userId ? String(request.query.userId) : undefined;
    const date = request.query.date ? dateOnly(String(request.query.date)) : undefined;
    const entries = await prisma.workEntry.findMany({
      where: { status, userId, workDate: date },
      include: {
        user: { select: { id: true, name: true, username: true } },
        items: { include: { product: true } },
      },
      orderBy: [{ workDate: "desc" }, { updatedAt: "desc" }],
    });
    response.json({ entries: serialize(entries) });
  }),
);

router.post(
  "/work-entries",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        userId: z.string().min(1),
        workDate: z.string(),
        mode: z.nativeEnum(WorkMode),
        clockIn: optionalDateTime,
        clockOut: optionalDateTime,
        note: z.string().trim().max(2_000).optional(),
        items: itemsSchema.default([]),
        finalAmount: z.union([z.string(), z.number()]).optional(),
        manualAmount: z.boolean().optional().default(false),
        status: z.enum([WorkStatus.PENDING, WorkStatus.APPROVED]).default(WorkStatus.PENDING),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    if (input.workDate > todayString()) {
      throw new AppError(422, "Absensi tidak dapat dibuat untuk tanggal mendatang.");
    }
    if (input.mode === WorkMode.PIECEWORK && input.items.length === 0) {
      throw new AppError(422, "Absensi borongan membutuhkan minimal satu produk.");
    }

    const workDate = dateOnly(input.workDate);
    const entry = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.user.findUniqueOrThrow({ where: { id: input.userId } });
      const dailySnapshot =
        input.mode === WorkMode.DAILY
          ? await getDailyRate(transaction, input.userId, workDate)
          : null;
      if (input.mode === WorkMode.DAILY && (!dailySnapshot || dailySnapshot.lessThanOrEqualTo(0))) {
        throw new AppError(
          422,
          "Tarif Harian user belum diatur. Simpan tarif Harian pada detail user sebelum mencatat absensi.",
        );
      }
      const created = await transaction.workEntry.create({
        data: {
          userId: input.userId,
          workDate,
          mode: input.mode,
          clockIn: parseDateTime(input.clockIn),
          clockOut: parseDateTime(input.clockOut),
          note: input.note || null,
          dailyRateSnapshot: dailySnapshot,
          finalAmount: input.mode === WorkMode.DAILY ? dailySnapshot ?? 0 : 0,
          status: input.status,
          submittedAt: new Date(),
          approvedById: input.status === WorkStatus.APPROVED ? request.auth!.sub : null,
          approvedAt: input.status === WorkStatus.APPROVED ? new Date() : null,
          correctionReason: input.reason,
        },
      });
      const calculated =
        input.mode === WorkMode.PIECEWORK
          ? await replaceItems(transaction, {
              entryId: created.id,
              userId: input.userId,
              workDate,
              items: input.items,
            })
          : dailySnapshot ?? new Prisma.Decimal(0);
      const finalAmount = resolveWorkEntryFinalAmount({
        mode: input.mode,
        calculated,
        requested: input.finalAmount,
        manualAmount: input.manualAmount,
      });
      const updated = await transaction.workEntry.update({
        where: { id: created.id },
        data: { finalAmount },
        include: {
          user: { select: { id: true, name: true, username: true } },
          items: { include: { product: true } },
        },
      });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "WorkEntry",
        entityId: updated.id,
        action: "CREATE_BACKDATED",
        afterData: updated,
        reason: input.reason,
      });
      return updated;
    });
    response.status(201).json({ entry: serialize(entry) });
  }),
);

router.patch(
  "/work-entries/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        workDate: z.string().optional(),
        mode: z.nativeEnum(WorkMode).optional(),
        clockIn: optionalDateTime,
        clockOut: optionalDateTime,
        note: z.string().trim().max(2_000).nullable().optional(),
        items: itemsSchema.optional(),
        finalAmount: z.union([z.string(), z.number()]).optional(),
        manualAmount: z.boolean().optional().default(false),
        status: z.nativeEnum(WorkStatus).optional(),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    if (input.workDate && input.workDate > todayString()) {
      throw new AppError(422, "Absensi tidak dapat dipindahkan ke tanggal mendatang.");
    }

    const entry = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const before = await transaction.workEntry.findUniqueOrThrow({
        where: { id: routeParam(request, "id") },
        include: { items: true },
      });
      const workDate = input.workDate ? dateOnly(input.workDate) : before.workDate;
      const mode = input.mode ?? before.mode;
      const status = input.status ?? before.status;
      if (mode === WorkMode.PIECEWORK && input.mode && !input.items?.length && !before.items.length) {
        throw new AppError(422, "Absensi borongan membutuhkan minimal satu produk.");
      }

      let dailySnapshot = before.dailyRateSnapshot;
      let calculated = before.finalAmount;
      if (mode === WorkMode.DAILY) {
        if (
          before.mode !== mode ||
          input.workDate ||
          !dailySnapshot ||
          dailySnapshot.lessThanOrEqualTo(0)
        ) {
          dailySnapshot = await getDailyRate(transaction, before.userId, workDate);
          calculated = dailySnapshot;
        }
        if (!dailySnapshot || dailySnapshot.lessThanOrEqualTo(0)) {
          throw new AppError(
            422,
            "Tarif Harian user belum diatur. Simpan tarif Harian pada detail user sebelum menyimpan koreksi.",
          );
        }
        await transaction.pieceworkItem.deleteMany({ where: { workEntryId: before.id } });
      } else {
        dailySnapshot = null;
        if (input.items) {
          calculated = await replaceItems(transaction, {
            entryId: before.id,
            userId: before.userId,
            workDate,
            items: input.items,
          });
        }
      }

      const finalAmount = resolveWorkEntryFinalAmount({
        mode,
        calculated,
        requested: input.finalAmount,
        manualAmount: input.manualAmount,
      });
      const currentSummary = await getPayrollSummary(transaction, before.userId, {
        excludeWorkId: before.status === WorkStatus.APPROVED ? before.id : undefined,
      });
      const nextEarnings =
        status === WorkStatus.APPROVED
          ? currentSummary.totalEarned.plus(finalAmount)
          : currentSummary.totalEarned;
      ensureNonNegativeBalance(nextEarnings, currentSummary.totalPaid);

      const updated = await transaction.workEntry.update({
        where: { id: before.id },
        data: {
          workDate,
          mode,
          clockIn: parseDateTime(input.clockIn),
          clockOut: parseDateTime(input.clockOut),
          note: input.note,
          dailyRateSnapshot: dailySnapshot,
          finalAmount,
          status,
          submittedAt: status === WorkStatus.IN_PROGRESS ? null : before.submittedAt ?? new Date(),
          approvedById:
            status === WorkStatus.APPROVED || status === WorkStatus.REJECTED
              ? request.auth!.sub
              : null,
          approvedAt:
            status === WorkStatus.APPROVED || status === WorkStatus.REJECTED
              ? new Date()
              : null,
          correctionReason: input.reason,
        },
        include: {
          user: { select: { id: true, name: true, username: true } },
          items: { include: { product: true } },
        },
      });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "WorkEntry",
        entityId: updated.id,
        action: "CORRECT",
        beforeData: before,
        afterData: updated,
        reason: input.reason,
      });
      return updated;
    });
    response.json({ entry: serialize(entry) });
  }),
);

router.patch(
  "/work-entries/:id/review",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        status: z.enum([WorkStatus.APPROVED, WorkStatus.REJECTED]),
        finalAmount: z.union([z.string(), z.number()]).optional(),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    const before = await prisma.workEntry.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    let dailyRateSnapshot = before.dailyRateSnapshot;
    if (
      input.status === WorkStatus.APPROVED &&
      before.mode === WorkMode.DAILY &&
      input.finalAmount === undefined &&
      (before.finalAmount.lessThanOrEqualTo(0) || !dailyRateSnapshot || dailyRateSnapshot.lessThanOrEqualTo(0))
    ) {
      dailyRateSnapshot = await getDailyRate(prisma, before.userId, before.workDate);
    }
    const finalAmount =
      input.status === WorkStatus.REJECTED
        ? new Prisma.Decimal(0)
        : input.finalAmount === undefined
          ? before.mode === WorkMode.DAILY && dailyRateSnapshot
            ? dailyRateSnapshot
            : before.finalAmount
          : money(input.finalAmount);
    const summary = await getPayrollSummary(prisma, before.userId, {
      excludeWorkId: before.status === WorkStatus.APPROVED ? before.id : undefined,
    });
    ensureNonNegativeBalance(
      input.status === WorkStatus.APPROVED
        ? summary.totalEarned.plus(finalAmount)
        : summary.totalEarned,
      summary.totalPaid,
    );
    const updated = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const entry = await transaction.workEntry.update({
        where: { id: before.id },
        data: {
          status: input.status,
          dailyRateSnapshot,
          finalAmount,
          approvedById: request.auth!.sub,
          approvedAt: new Date(),
          correctionReason: input.reason,
        },
        include: {
          user: { select: { id: true, name: true, username: true } },
          items: { include: { product: true } },
        },
      });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "WorkEntry",
        entityId: entry.id,
        action: input.status === WorkStatus.APPROVED ? "APPROVE" : "REJECT",
        beforeData: before,
        afterData: entry,
        reason: input.reason,
      });
      return entry;
    });
    response.json({ entry: serialize(updated) });
  }),
);

router.post(
  "/work-entries/bulk-approve",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        ids: z.array(z.string().min(1)).min(1).max(200),
        reason: z.string().trim().min(3).max(255).default("Persetujuan massal admin"),
      })
      .parse(request.body);
    const uniqueIds = [...new Set(input.ids)];
    const result = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const entries = await transaction.workEntry.findMany({
        where: { id: { in: uniqueIds }, status: WorkStatus.PENDING },
      });
      for (const entry of entries) {
        let dailyRateSnapshot = entry.dailyRateSnapshot;
        let finalAmount = entry.finalAmount;
        if (
          entry.mode === WorkMode.DAILY &&
          (finalAmount.lessThanOrEqualTo(0) || !dailyRateSnapshot || dailyRateSnapshot.lessThanOrEqualTo(0))
        ) {
          dailyRateSnapshot = await getDailyRate(
            transaction,
            entry.userId,
            entry.workDate,
          );
          finalAmount = dailyRateSnapshot;
        }
        const updated = await transaction.workEntry.update({
          where: { id: entry.id },
          data: {
            status: WorkStatus.APPROVED,
            dailyRateSnapshot,
            finalAmount,
            approvedById: request.auth!.sub,
            approvedAt: new Date(),
            correctionReason: input.reason,
          },
        });
        await writeAudit(transaction, {
          actorId: request.auth!.sub,
          entityType: "WorkEntry",
          entityId: entry.id,
          action: "APPROVE",
          beforeData: entry,
          afterData: updated,
          reason: input.reason,
        });
      }
      return { approved: entries.length, skipped: uniqueIds.length - entries.length };
    });
    response.json(result);
  }),
);

export const adminWorkEntriesRouter = router;
