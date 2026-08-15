import { Router } from "express";
import { Prisma, RecurrenceType, WorkMode } from "../../../generated/prisma";
import { z } from "zod";
import { dateOnly, monthRange, today, todayString, toDateString } from "../../lib/date";
import { AppError, asyncRoute, routeParam } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";
import { getPayrollSummary } from "../../services/payroll.service";
import { getDailyRate, getProductRate } from "../../services/rate.service";

const router = Router();

type TaskScheduleRow = {
  id: string;
  recurrence: RecurrenceType;
  startDate: Date;
};

const pieceworkItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      quantity: z.coerce.number().int().positive(),
    }),
  )
  .max(50)
  .superRefine((items, context) => {
    const ids = items.map((item) => item.productId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", message: "Produk yang sama tidak boleh dicatat dua kali." });
    }
  });

async function ensureTaskOccurrences(userId: string, taskDate: Date) {
  const schedules: TaskScheduleRow[] = await prisma.taskSchedule.findMany({
    where: {
      isActive: true,
      startDate: { lte: taskDate },
      OR: [{ endDate: null }, { endDate: { gte: taskDate } }],
      assignedUsers: { some: { userId } },
      template: { isActive: true, deletedAt: null },
    },
  });

  const matches = schedules.filter(
    (schedule: TaskScheduleRow) =>
      schedule.recurrence === RecurrenceType.ONCE &&
      toDateString(schedule.startDate) === toDateString(taskDate),
  );

  if (matches.length) {
    await prisma.taskOccurrence.createMany({
      data: matches.map((schedule: TaskScheduleRow) => ({
        scheduleId: schedule.id,
        userId,
        taskDate,
      })),
      skipDuplicates: true,
    });
  }
}

router.get(
  "/dashboard/me",
  asyncRoute(async (request, response) => {
    const workDate = today();
    await ensureTaskOccurrences(request.auth!.sub, workDate);
    const [workEntry, notes, payroll, tasks, dailyRate] = await Promise.all([
      prisma.workEntry.findUnique({
        where: { userId_workDate: { userId: request.auth!.sub, workDate } },
        include: { items: { include: { product: true } } },
      }),
      prisma.dashboardNote.findMany({
        where: { userId: request.auth!.sub, isActive: true },
        orderBy: { updatedAt: "desc" },
      }),
      getPayrollSummary(prisma, request.auth!.sub),
      prisma.taskOccurrence.findMany({
        where: { userId: request.auth!.sub, taskDate: workDate },
        include: { schedule: { include: { template: true } } },
        orderBy: { createdAt: "asc" },
      }),
      getDailyRate(prisma, request.auth!.sub, workDate),
    ]);
    response.json(serialize({ workEntry, notes, summary: payroll, tasks, dailyRate }));
  }),
);

router.get(
  "/work-entries/today",
  asyncRoute(async (request, response) => {
    const entry = await prisma.workEntry.findUnique({
      where: {
        userId_workDate: { userId: request.auth!.sub, workDate: today() },
      },
      include: { items: { include: { product: true } } },
    });
    response.json({ entry: serialize(entry) });
  }),
);

router.get(
  "/work-entries/me",
  asyncRoute(async (request, response) => {
    const entries = await prisma.workEntry.findMany({
      where: { userId: request.auth!.sub },
      include: { items: { include: { product: true } } },
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    });
    response.json({ entries: serialize(entries) });
  }),
);

router.post(
  "/work-entries/check-in",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        mode: z.nativeEnum(WorkMode),
        note: z.string().trim().max(2_000).optional(),
      })
      .parse(request.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.auth!.sub } });
    const workDate = today();
    const dailyRate =
      input.mode === WorkMode.DAILY
        ? await getDailyRate(prisma, user.id, workDate)
        : null;
    if (input.mode === WorkMode.DAILY && (!dailyRate || dailyRate.lessThanOrEqualTo(0))) {
      throw new AppError(
        422,
        "Tarif harian belum diatur. Hubungi owner sebelum memulai pekerjaan Harian.",
      );
    }
    const entry = await prisma.workEntry.create({
      data: {
        userId: user.id,
        workDate,
        mode: input.mode,
        clockIn: new Date(),
        note: input.note || null,
        dailyRateSnapshot: dailyRate,
        status: "IN_PROGRESS",
      },
    });
    response.status(201).json({ entry: serialize(entry) });
  }),
);

router.patch(
  "/work-entries/:id/check-out",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        note: z.string().trim().max(2_000).optional(),
        items: pieceworkItemsSchema.default([]),
      })
      .parse(request.body);
    const oldEntry = await prisma.workEntry.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    if (
      oldEntry.userId !== request.auth!.sub ||
      toDateString(oldEntry.workDate) !== todayString()
    ) {
      throw new AppError(403, "User hanya dapat mengubah absensi hari ini.");
    }
    if (oldEntry.status !== "IN_PROGRESS") {
      throw new AppError(409, "Absensi sudah dikirim untuk diperiksa admin.");
    }
    if (oldEntry.mode === WorkMode.PIECEWORK && input.items.length === 0) {
      throw new AppError(422, "Tambahkan minimal satu hasil produksi.");
    }

    const entry = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      await transaction.pieceworkItem.deleteMany({ where: { workEntryId: oldEntry.id } });
      let dailyRateSnapshot = oldEntry.dailyRateSnapshot;
      if (
        oldEntry.mode === WorkMode.DAILY &&
        (!dailyRateSnapshot || dailyRateSnapshot.lessThanOrEqualTo(0))
      ) {
        dailyRateSnapshot = await getDailyRate(
          transaction,
          oldEntry.userId,
          oldEntry.workDate,
        );
        if (dailyRateSnapshot.lessThanOrEqualTo(0)) {
          throw new AppError(
            422,
            "Tarif harian belum diatur. Hubungi owner sebelum mengirim pekerjaan Harian.",
          );
        }
      }
      let total = dailyRateSnapshot ?? new Prisma.Decimal(0);

      if (oldEntry.mode === WorkMode.PIECEWORK) {
        total = new Prisma.Decimal(0);
        for (const item of input.items) {
          const product = await transaction.product.findFirst({
            where: { id: item.productId, isActive: true, deletedAt: null },
          });
          if (!product) throw new AppError(422, "Salah satu produk sudah tidak aktif.");
          const unitRate = await getProductRate(
            transaction,
            oldEntry.userId,
            item.productId,
            oldEntry.workDate,
          );
          const subtotal = unitRate.mul(item.quantity);
          total = total.plus(subtotal);
          await transaction.pieceworkItem.create({
            data: {
              workEntryId: oldEntry.id,
              productId: item.productId,
              quantity: item.quantity,
              unitRateSnapshot: unitRate,
              subtotal,
            },
          });
        }
      }

      return transaction.workEntry.update({
        where: { id: oldEntry.id },
        data: {
          clockOut: new Date(),
          note: input.note || oldEntry.note,
          dailyRateSnapshot,
          finalAmount: total,
          status: "PENDING",
          submittedAt: new Date(),
        },
        include: { items: { include: { product: true } } },
      });
    });
    response.json({ entry: serialize(entry) });
  }),
);

router.get(
  "/products",
  asyncRoute(async (request, response) => {
    const workDate = today();
    const products = await prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
    });
    const rows = await Promise.all(
      products.map(async (product) => ({
        id: product.id,
        name: product.name,
        unit: product.unit,
        baseRate: product.baseRate.toString(),
        isActive: product.isActive,
        rate: (
          await getProductRate(prisma, request.auth!.sub, product.id, workDate)
        ).toString(),
      })),
    );
    response.json({ products: rows });
  }),
);

router.get(
  "/tasks/me",
  asyncRoute(async (request, response) => {
    const taskDate = dateOnly(String(request.query.date ?? todayString()));
    await ensureTaskOccurrences(request.auth!.sub, taskDate);
    const tasks = await prisma.taskOccurrence.findMany({
      where: { userId: request.auth!.sub, taskDate },
      include: { schedule: { include: { template: true } } },
      orderBy: { createdAt: "asc" },
    });
    response.json({ tasks: serialize(tasks) });
  }),
);

router.patch(
  "/tasks/:id/complete",
  asyncRoute(async (request, response) => {
    const input = z.object({ completed: z.boolean() }).parse(request.body);
    const oldTask = await prisma.taskOccurrence.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    if (oldTask.userId !== request.auth!.sub) {
      throw new AppError(403, "Tugas ini bukan milik akunmu.");
    }
    const task = await prisma.taskOccurrence.update({
      where: { id: oldTask.id },
      data: {
        status: input.completed ? "COMPLETED" : "OPEN",
        completedAt: input.completed ? new Date() : null,
      },
      include: { schedule: { include: { template: true } } },
    });
    response.json({ task: serialize(task) });
  }),
);

router.get(
  "/notes/me",
  asyncRoute(async (request, response) => {
    const notes = await prisma.dashboardNote.findMany({
      where: { userId: request.auth!.sub, isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    response.json({ notes: serialize(notes) });
  }),
);

router.get(
  "/payroll/me",
  asyncRoute(async (request, response) => {
    const [summary, payments] = await Promise.all([
      getPayrollSummary(prisma, request.auth!.sub),
      prisma.payment.findMany({
        where: { userId: request.auth!.sub },
        orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
      }),
    ]);
    response.json(serialize({ summary, payments }));
  }),
);

router.get(
  "/calendar/me",
  asyncRoute(async (request, response) => {
    const month = String(request.query.month ?? todayString().slice(0, 7));
    const { start, end } = monthRange(month);
    const [entries, tasks] = await Promise.all([
      prisma.workEntry.findMany({
        where: { userId: request.auth!.sub, workDate: { gte: start, lt: end } },
        include: { items: { include: { product: true } } },
        orderBy: { workDate: "asc" },
      }),
      prisma.taskOccurrence.findMany({
        where: { userId: request.auth!.sub, taskDate: { gte: start, lt: end } },
        include: { schedule: { include: { template: true } } },
        orderBy: { taskDate: "asc" },
      }),
    ]);
    response.json(serialize({ month, entries, tasks }));
  }),
);

export const employeeRouter = router;
