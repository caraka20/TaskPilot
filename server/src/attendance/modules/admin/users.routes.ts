import bcrypt from "bcrypt";
import { Router } from "express";
import { Role } from "../../../generated/prisma";
import { z } from "zod";
import { today, toDateString } from "../../lib/date";
import { AppError, asyncRoute, routeParam } from "../../lib/http";
import { money } from "../../lib/money";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../lib/password-policy";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";
import { writeAudit } from "../../services/audit.service";
import { getPayrollSummary } from "../../services/payroll.service";

const router = Router();
const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,50}$/);

router.get(
  "/users",
  asyncRoute(async (request, response) => {
    const search = String(request.query.search ?? "").trim();
    const includeInactive = request.query.includeInactive === "true";
    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        ...(!includeInactive ? { isActive: true, deletedAt: null } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { username: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        role: true,
        dailyRate: true,
        isActive: true,
        deletedAt: true,
        createdAt: true,
        _count: { select: { productRates: true, workEntries: true } },
      },
      orderBy: { name: "asc" },
    });
    response.json({ users: serialize(users) });
  }),
);

router.get(
  "/users/:id",
  asyncRoute(async (request, response) => {
    const id = routeParam(request, "id");
    const [user, summary, rates, rateHistory] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          role: true,
          dailyRate: true,
          isActive: true,
          deletedAt: true,
          createdAt: true,
        },
      }),
      getPayrollSummary(prisma, id),
      prisma.product.findMany({
        where: { deletedAt: null },
        include: {
          userRates: {
            where: { userId: id, effectiveTo: null },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.dailyRateHistory.findMany({
        where: { userId: id },
        orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
        take: 20,
      }),
    ]);
    response.json(serialize({ user, summary, rates, rateHistory }));
  }),
);

router.post(
  "/users",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        name: z.string().trim().min(2).max(120),
        username: usernameSchema,
        password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
        role: z.nativeEnum(Role).default(Role.USER),
        dailyRate: z.union([z.string(), z.number()]).default(0),
      })
      .parse(request.body);
    const dailyRate = money(input.dailyRate);

    const user = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: {
          name: input.name,
          namaLengkap: input.name,
          username: input.username,
          password: await bcrypt.hash(input.password, 12),
          role: input.role,
          dailyRate,
        },
      });
      await transaction.dailyRateHistory.create({
        data: {
          userId: created.id,
          amount: dailyRate,
          effectiveFrom: today(),
          createdById: request.auth!.sub,
        },
      });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "User",
        entityId: created.id,
        action: "CREATE",
        afterData: { ...created, password: "[HASHED]" },
      });
      return created;
    });
    const { password: _password, token: _token, ...safeUser } = user;
    response.status(201).json({ user: serialize(safeUser) });
  }),
);

router.patch(
  "/users/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        name: z.string().trim().min(2).max(120).optional(),
        username: usernameSchema.optional(),
        dailyRate: z.union([z.string(), z.number()]).optional(),
        isActive: z.boolean().optional(),
        role: z.nativeEnum(Role).optional(),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    const rate = input.dailyRate === undefined ? undefined : money(input.dailyRate);

    const user = await prisma.$transaction(async (transaction) => {
      const before = await transaction.user.findUniqueOrThrow({
        where: { id: routeParam(request, "id") },
      });
      const updated = await transaction.user.update({
        where: { id: before.id },
        data: {
          name: input.name,
          namaLengkap: input.name,
          username: input.username,
          dailyRate: rate,
          isActive: input.isActive,
          role: input.role,
          ...(input.isActive === true ? { deletedAt: null } : {}),
          ...(input.isActive === false ? { deletedAt: new Date(), token: null } : {}),
        },
      });

      if (rate !== undefined && !rate.equals(before.dailyRate)) {
        const effectiveDate = today();
        const current = await transaction.dailyRateHistory.findFirst({
          where: { userId: updated.id, effectiveTo: null },
          orderBy: { createdAt: "desc" },
        });
        if (current && toDateString(current.effectiveFrom) === toDateString(effectiveDate)) {
          await transaction.dailyRateHistory.update({
            where: { id: current.id },
            data: { amount: rate, createdById: request.auth!.sub },
          });
        } else {
          await transaction.dailyRateHistory.updateMany({
            where: { userId: updated.id, effectiveTo: null },
            data: { effectiveTo: effectiveDate },
          });
          await transaction.dailyRateHistory.create({
            data: {
              userId: updated.id,
              amount: rate,
              effectiveFrom: effectiveDate,
              createdById: request.auth!.sub,
            },
          });
        }
      }

      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "User",
        entityId: updated.id,
        action: "UPDATE",
        beforeData: before,
        afterData: updated,
        reason: input.reason,
      });
      return updated;
    });
    const { password: _password, token: _token, ...safeUser } = user;
    response.json({ user: serialize(safeUser) });
  }),
);

router.patch(
  "/users/:id/reset-password",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
        reason: z.string().trim().min(3).max(255).default("Reset password user"),
      })
      .parse(request.body);
    const userId = routeParam(request, "id");
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: userId },
        data: { password: await bcrypt.hash(input.newPassword, 12), token: null },
      });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "User",
        entityId: userId,
        action: "RESET_PASSWORD",
        reason: input.reason,
      });
    });
    response.json({ message: "Password baru berhasil disimpan." });
  }),
);

router.delete(
  "/users/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({ reason: z.string().trim().min(3).max(255) })
      .parse(request.body);
    const userId = routeParam(request, "id");
    if (userId === request.auth!.sub) {
      throw new AppError(409, "Admin tidak dapat menghapus akun yang sedang digunakan.");
    }
    await prisma.$transaction(async (transaction) => {
      const before = await transaction.user.findUniqueOrThrow({ where: { id: userId } });
      const updated = await transaction.user.update({
        where: { id: userId },
        data: { isActive: false, deletedAt: new Date(), token: null },
      });
      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "User",
        entityId: userId,
        action: "SOFT_DELETE",
        beforeData: before,
        afterData: updated,
        reason: input.reason,
      });
    });
    response.status(204).send();
  }),
);

export const adminUsersRouter = router;
