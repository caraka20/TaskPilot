import { Router } from "express";
import { z } from "zod";
import { asyncRoute, routeParam } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";
import { writeAudit } from "../../services/audit.service";

const router = Router();

router.get(
  "/notes",
  asyncRoute(async (_request, response) => {
    const notes = await prisma.dashboardNote.findMany({
      include: { user: { select: { id: true, name: true, username: true } } },
      orderBy: { updatedAt: "desc" },
    });
    response.json({ notes: serialize(notes) });
  }),
);

router.post(
  "/notes",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        userId: z.string().min(1),
        title: z.string().trim().max(120).optional(),
        message: z.string().trim().min(2).max(5_000),
      })
      .parse(request.body);
    const note = await prisma.dashboardNote.create({
      data: { ...input, title: input.title || null, createdById: request.auth!.sub },
      include: { user: { select: { id: true, name: true, username: true } } },
    });
    await writeAudit(prisma, {
      actorId: request.auth!.sub,
      entityType: "DashboardNote",
      entityId: note.id,
      action: "CREATE",
      afterData: note,
    });
    response.status(201).json({ note: serialize(note) });
  }),
);

router.patch(
  "/notes/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        title: z.string().trim().max(120).nullable().optional(),
        message: z.string().trim().min(2).max(5_000).optional(),
        isActive: z.boolean().optional(),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    const before = await prisma.dashboardNote.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    const note = await prisma.dashboardNote.update({
      where: { id: before.id },
      data: { title: input.title, message: input.message, isActive: input.isActive },
      include: { user: { select: { id: true, name: true, username: true } } },
    });
    await writeAudit(prisma, {
      actorId: request.auth!.sub,
      entityType: "DashboardNote",
      entityId: note.id,
      action: "UPDATE",
      beforeData: before,
      afterData: note,
      reason: input.reason,
    });
    response.json({ note: serialize(note) });
  }),
);

router.delete(
  "/notes/:id",
  asyncRoute(async (request, response) => {
    const input = z.object({ reason: z.string().trim().min(3).max(255) }).parse(request.body);
    const note = await prisma.dashboardNote.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    await prisma.$transaction(async (transaction) => {
      await transaction.dashboardNote.delete({ where: { id: note.id } });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "DashboardNote",
        entityId: note.id,
        action: "DELETE",
        beforeData: note,
        reason: input.reason,
      });
    });
    response.status(204).send();
  }),
);

export const adminNotesRouter = router;
