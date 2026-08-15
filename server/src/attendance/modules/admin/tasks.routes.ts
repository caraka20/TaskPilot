import { Router } from "express";
import { z } from "zod";
import { dateOnly, todayString } from "../../lib/date";
import { AppError, asyncRoute, routeParam } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";
import { writeAudit } from "../../services/audit.service";

const router = Router();

router.get(
  "/tasks/templates",
  asyncRoute(async (request, response) => {
    const includeInactive = request.query.includeInactive === "true";
    const templates = await prisma.taskTemplate.findMany({
      where: includeInactive ? {} : { isActive: true, deletedAt: null },
      include: { _count: { select: { schedules: true } } },
      orderBy: [{ isActive: "desc" }, { title: "asc" }],
    });
    response.json({ templates: serialize(templates) });
  }),
);

router.post(
  "/tasks/templates",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        title: z.string().trim().min(2).max(160),
        description: z.string().trim().max(5_000).optional(),
      })
      .parse(request.body);
    const template = await prisma.taskTemplate.create({
      data: { ...input, description: input.description || null, createdById: request.auth!.sub },
    });
    await writeAudit(prisma, {
      actorId: request.auth!.sub,
      entityType: "TaskTemplate",
      entityId: template.id,
      action: "CREATE",
      afterData: template,
    });
    response.status(201).json({ template: serialize(template) });
  }),
);

router.patch(
  "/tasks/templates/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        title: z.string().trim().min(2).max(160).optional(),
        description: z.string().trim().max(5_000).nullable().optional(),
        isActive: z.boolean().optional(),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    const before = await prisma.taskTemplate.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    const template = await prisma.taskTemplate.update({
      where: { id: before.id },
      data: {
        title: input.title,
        description: input.description,
        isActive: input.isActive,
        ...(input.isActive === true ? { deletedAt: null } : {}),
      },
    });
    await writeAudit(prisma, {
      actorId: request.auth!.sub,
      entityType: "TaskTemplate",
      entityId: template.id,
      action: "UPDATE",
      beforeData: before,
      afterData: template,
      reason: input.reason,
    });
    response.json({ template: serialize(template) });
  }),
);

router.delete(
  "/tasks/templates/:id",
  asyncRoute(async (request, response) => {
    const input = z.object({ reason: z.string().trim().min(3).max(255) }).parse(request.body);
    await prisma.$transaction(async (transaction) => {
      const before = await transaction.taskTemplate.findUniqueOrThrow({
        where: { id: routeParam(request, "id") },
      });
      const template = await transaction.taskTemplate.update({
        where: { id: before.id },
        data: { isActive: false, deletedAt: new Date() },
      });
      await transaction.taskSchedule.updateMany({
        where: { templateId: template.id, startDate: { gte: dateOnly(todayString()) } },
        data: { isActive: false },
      });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "TaskTemplate",
        entityId: template.id,
        action: "SOFT_DELETE",
        beforeData: before,
        afterData: template,
        reason: input.reason,
      });
    });
    response.status(204).send();
  }),
);

router.get(
  "/tasks/assignments",
  asyncRoute(async (request, response) => {
    const taskDate = dateOnly(String(request.query.date ?? todayString()));
    const userId = request.query.userId ? String(request.query.userId) : undefined;
    const assignments = await prisma.taskOccurrence.findMany({
      where: { taskDate, userId },
      include: {
        user: { select: { id: true, name: true, username: true } },
        schedule: { include: { template: true } },
      },
      orderBy: [{ user: { name: "asc" } }, { createdAt: "asc" }],
    });
    response.json({ assignments: serialize(assignments) });
  }),
);

router.post(
  "/tasks/assignments",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        templateId: z.string().min(1),
        taskDate: z.string(),
        userIds: z.array(z.string().min(1)).min(1).max(200).refine(
          (ids) => new Set(ids).size === ids.length,
          "User tidak boleh dipilih lebih dari sekali.",
        ),
      })
      .parse(request.body);
    const taskDate = dateOnly(input.taskDate);
    const assignment = await prisma.$transaction(async (transaction) => {
      const template = await transaction.taskTemplate.findFirstOrThrow({
        where: { id: input.templateId, isActive: true, deletedAt: null },
      });
      const validUserCount = await transaction.user.count({
        where: { id: { in: input.userIds }, role: "USER", isActive: true, deletedAt: null },
      });
      if (validUserCount !== input.userIds.length) {
        throw new AppError(422, "Salah satu user tidak ditemukan atau sudah tidak aktif.");
      }
      const schedule = await transaction.taskSchedule.create({
        data: {
          templateId: template.id,
          recurrence: "ONCE",
          startDate: taskDate,
          endDate: taskDate,
          createdById: request.auth!.sub,
          assignedUsers: { create: input.userIds.map((userId) => ({ userId })) },
          occurrences: {
            create: input.userIds.map((userId) => ({ userId, taskDate })),
          },
        },
        include: { assignedUsers: true, occurrences: true, template: true },
      });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "TaskAssignment",
        entityId: schedule.id,
        action: "ASSIGN",
        afterData: schedule,
        reason: `Penugasan ${input.taskDate} untuk ${input.userIds.length} pengguna`,
      });
      return schedule;
    });
    response.status(201).json({ assignment: serialize(assignment) });
  }),
);

router.delete(
  "/tasks/assignments/:scheduleId",
  asyncRoute(async (request, response) => {
    const input = z.object({ reason: z.string().trim().min(3).max(255) }).parse(request.body);
    const scheduleId = routeParam(request, "scheduleId");
    await prisma.$transaction(async (transaction) => {
      const before = await transaction.taskSchedule.findUniqueOrThrow({
        where: { id: scheduleId },
        include: { occurrences: true, assignedUsers: true },
      });
      await transaction.taskSchedule.delete({ where: { id: scheduleId } });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "TaskAssignment",
        entityId: scheduleId,
        action: "DELETE",
        beforeData: before,
        reason: input.reason,
      });
    });
    response.status(204).send();
  }),
);

export const adminTasksRouter = router;
