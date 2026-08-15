import { Router } from "express";
import { asyncRoute } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";
import {
  getCompanyPayrollSummary,
  LEGACY_HOURLY_MIGRATION_REASON,
} from "../../services/payroll.service";
import { today } from "../../lib/date";

const router = Router();

type LegacyWorkerRow = { username: string };
type AttendanceWorkerRow = { user: { username: string } };
type AcademicDetailRow = {
  tugas1: boolean;
  tugas2: boolean;
  tugas3: boolean;
  tugas4: boolean;
};

const completedTasks = (detail: {
  tugas1: boolean;
  tugas2: boolean;
  tugas3: boolean;
  tugas4: boolean;
}) => [detail.tugas1, detail.tugas2, detail.tugas3, detail.tugas4].filter(Boolean).length;

type PayrollPeriod = "week" | "month" | "year";

function payrollRange(raw: unknown) {
  const key: PayrollPeriod = raw === "week" || raw === "year" ? raw : "month";
  const current = today();
  let from: Date;
  let to: Date;

  if (key === "week") {
    const offsetFromMonday = (current.getUTCDay() + 6) % 7;
    from = new Date(current);
    from.setUTCDate(from.getUTCDate() - offsetFromMonday);
    to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 7);
  } else if (key === "year") {
    from = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
    to = new Date(Date.UTC(current.getUTCFullYear() + 1, 0, 1));
  } else {
    from = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));
    to = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1));
  }

  return { key, from, to };
}

router.get(
  "/dashboard",
  asyncRoute(async (request, response) => {
    const period = payrollRange(request.query.period);
    const [
      activeUsers,
      pendingApprovals,
      payroll,
      customerMoney,
      outstandingCustomers,
      tutonCustomers,
      karilCustomers,
      metodeCustomers,
      tutonProgress,
      karilDetails,
      metodeDetails,
      legacyWorkers,
      attendanceWorkers,
      recentEntries,
      recentCustomerPayments,
      recentCustomers,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: "USER", isActive: true, deletedAt: null },
      }),
      prisma.workEntry.count({ where: { status: "PENDING" } }),
      getCompanyPayrollSummary(prisma, { range: { from: period.from, to: period.to } }),
      prisma.customer.aggregate({
        _count: { _all: true },
        _sum: { totalBayar: true, sudahBayar: true, sisaBayar: true },
      }),
      prisma.customer.count({ where: { sisaBayar: { gt: 0 } } }),
      prisma.customer.count({ where: { layananTuton: true } }),
      prisma.customer.count({ where: { layananKaril: true } }),
      prisma.customer.count({ where: { layananMetodePenelitian: true } }),
      prisma.tutonCourse.aggregate({
        _count: { _all: true },
        _sum: { totalItems: true, completedItems: true },
      }),
      prisma.karilDetail.findMany({
        select: { tugas1: true, tugas2: true, tugas3: true, tugas4: true },
      }),
      prisma.metodePenelitianDetail.findMany({
        select: { tugas1: true, tugas2: true, tugas3: true, tugas4: true },
      }),
      prisma.jamKerja.findMany({
        where: {
          jamSelesai: null,
          status: { in: ["AKTIF", "JEDA"] },
        },
        select: { username: true },
        distinct: ["username"],
      }),
      prisma.workEntry.findMany({
        where: { status: "IN_PROGRESS" },
        select: { userId: true, user: { select: { username: true } } },
        distinct: ["userId"],
      }),
      prisma.workEntry.findMany({
        where: {
          OR: [
            { automationReason: null },
            { automationReason: { not: LEGACY_HOURLY_MIGRATION_REASON } },
          ],
        },
        include: { user: { select: { name: true, username: true } } },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.customerPayment.findMany({
        select: {
          id: true,
          amount: true,
          tanggalBayar: true,
          catatan: true,
          customer: { select: { id: true, namaCustomer: true, nim: true } },
        },
        orderBy: [{ tanggalBayar: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
      prisma.customer.findMany({
        select: {
          id: true,
          namaCustomer: true,
          nim: true,
          layananTuton: true,
          layananKaril: true,
          layananMetodePenelitian: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const workingUsernames = new Set([
      ...legacyWorkers.map((row: LegacyWorkerRow) => row.username),
      ...attendanceWorkers.map((row: AttendanceWorkerRow) => row.user.username),
    ]);
    const karilDone = karilDetails.reduce(
      (sum: number, detail: AcademicDetailRow) => sum + completedTasks(detail),
      0,
    );
    const metodeDone = metodeDetails.reduce(
      (sum: number, detail: AcademicDetailRow) => sum + completedTasks(detail),
      0,
    );

    response.json(
      serialize({
        activeUsers,
        workingNow: workingUsernames.size,
        pendingApprovals,
        totalItems: payroll.totalItems,
        totalEarned: payroll.totalEarned,
        totalPaid: payroll.totalPaid,
        balance: payroll.balance,
        payroll: {
          ...payroll,
          period: {
            key: period.key,
            from: period.from,
            to: period.to,
          },
          sources: {
            hourly: payroll.hourlyEarned,
            daily: payroll.dailyEarned,
            piecework: payroll.pieceworkEarned,
          },
        },
        customers: {
          total: customerMoney._count._all,
          outstandingCount: outstandingCustomers,
          totalBilling: customerMoney._sum.totalBayar ?? 0,
          totalReceived: customerMoney._sum.sudahBayar ?? 0,
          outstanding: customerMoney._sum.sisaBayar ?? 0,
          services: {
            tuton: tutonCustomers,
            karil: karilCustomers,
            metode: metodeCustomers,
          },
        },
        academic: {
          tuton: {
            courses: tutonProgress._count._all,
            completed: tutonProgress._sum.completedItems ?? 0,
            total: tutonProgress._sum.totalItems ?? 0,
          },
          karil: {
            records: karilDetails.length,
            completed: karilDone,
            total: karilDetails.length * 4,
          },
          metode: {
            records: metodeDetails.length,
            completed: metodeDone,
            total: metodeDetails.length * 4,
          },
        },
        recentEntries,
        recentCustomerPayments,
        recentCustomers,
      }),
    );
  }),
);

export const adminDashboardRouter = router;
