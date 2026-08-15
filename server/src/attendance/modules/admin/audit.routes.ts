import { Router } from "express";
import { asyncRoute } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";

const router = Router();

router.get(
  "/audit",
  asyncRoute(async (request, response) => {
    const limit = Math.min(200, Math.max(1, Number(request.query.limit ?? 50)));
    const entityType = request.query.entityType
      ? String(request.query.entityType)
      : undefined;
    const logs = await prisma.auditLog.findMany({
      where: { entityType },
      include: { actor: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    response.json({ logs: serialize(logs) });
  }),
);

export const adminAuditRouter = router;
