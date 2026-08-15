import { Router } from "express";
import { monthRange, todayString } from "../../lib/date";
import { asyncRoute } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";

const router = Router();

router.get(
  "/calendar",
  asyncRoute(async (request, response) => {
    const month = String(request.query.month ?? todayString().slice(0, 7));
    const userId = request.query.userId ? String(request.query.userId) : undefined;
    const { start, end } = monthRange(month);
    const [entries, tasks] = await Promise.all([
      prisma.workEntry.findMany({
        where: { userId, workDate: { gte: start, lt: end } },
        include: {
          user: { select: { id: true, name: true, username: true } },
          items: { include: { product: true } },
        },
        orderBy: [{ workDate: "asc" }, { user: { name: "asc" } }],
      }),
      prisma.taskOccurrence.findMany({
        where: { userId, taskDate: { gte: start, lt: end } },
        include: {
          user: { select: { id: true, name: true, username: true } },
          schedule: { include: { template: true } },
        },
        orderBy: [{ taskDate: "asc" }, { user: { name: "asc" } }],
      }),
    ]);
    response.json(serialize({ month, entries, tasks }));
  }),
);

export const adminCalendarRouter = router;
