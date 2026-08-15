import { Router } from "express";
import { z } from "zod";
import { today, toDateString } from "../../lib/date";
import { asyncRoute, routeParam } from "../../lib/http";
import { money } from "../../lib/money";
import { prisma } from "../../lib/prisma";
import { serialize } from "../../lib/serialize";
import { writeAudit } from "../../services/audit.service";

const router = Router();

router.get(
  "/products",
  asyncRoute(async (request, response) => {
    const includeInactive = request.query.includeInactive === "true";
    const products = await prisma.product.findMany({
      where: includeInactive ? {} : { deletedAt: null },
      include: { _count: { select: { userRates: true, workItems: true } } },
      orderBy: { name: "asc" },
    });
    response.json({ products: serialize(products) });
  }),
);

router.post(
  "/products",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        name: z.string().trim().min(2).max(120),
        unit: z.string().trim().min(1).max(30).default("pcs"),
        baseRate: z.union([z.string(), z.number()]).default(0),
      })
      .parse(request.body);
    const product = await prisma.product.create({
      data: { name: input.name, unit: input.unit, baseRate: money(input.baseRate) },
    });
    await writeAudit(prisma, {
      actorId: request.auth!.sub,
      entityType: "Product",
      entityId: product.id,
      action: "CREATE",
      afterData: product,
    });
    response.status(201).json({ product: serialize(product) });
  }),
);

router.patch(
  "/products/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        name: z.string().trim().min(2).max(120).optional(),
        unit: z.string().trim().min(1).max(30).optional(),
        baseRate: z.union([z.string(), z.number()]).optional(),
        isActive: z.boolean().optional(),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    const product = await prisma.product.update({
      where: { id: before.id },
      data: {
        name: input.name,
        unit: input.unit,
        baseRate: input.baseRate === undefined ? undefined : money(input.baseRate),
        isActive: input.isActive,
        ...(input.isActive === true ? { deletedAt: null } : {}),
      },
    });
    await writeAudit(prisma, {
      actorId: request.auth!.sub,
      entityType: "Product",
      entityId: product.id,
      action: "UPDATE",
      beforeData: before,
      afterData: product,
      reason: input.reason,
    });
    response.json({ product: serialize(product) });
  }),
);

router.delete(
  "/products/:id",
  asyncRoute(async (request, response) => {
    const input = z
      .object({ reason: z.string().trim().min(3).max(255) })
      .parse(request.body);
    const before = await prisma.product.findUniqueOrThrow({
      where: { id: routeParam(request, "id") },
    });
    const product = await prisma.product.update({
      where: { id: before.id },
      data: { isActive: false, deletedAt: new Date() },
    });
    await writeAudit(prisma, {
      actorId: request.auth!.sub,
      entityType: "Product",
      entityId: product.id,
      action: "SOFT_DELETE",
      beforeData: before,
      afterData: product,
      reason: input.reason,
    });
    response.status(204).send();
  }),
);

router.put(
  "/products/:productId/rates/:userId",
  asyncRoute(async (request, response) => {
    const input = z
      .object({
        rate: z.union([z.string(), z.number()]),
        reason: z.string().trim().min(3).max(255),
      })
      .parse(request.body);
    const productId = routeParam(request, "productId");
    const userId = routeParam(request, "userId");
    const rateValue = money(input.rate);
    const effectiveDate = today();

    const rate = await prisma.$transaction(async (transaction) => {
      await Promise.all([
        transaction.product.findUniqueOrThrow({ where: { id: productId } }),
        transaction.user.findUniqueOrThrow({ where: { id: userId } }),
      ]);
      const current = await transaction.userProductRate.findFirst({
        where: { userId, productId, effectiveTo: null },
        orderBy: { createdAt: "desc" },
      });

      let updated;
      if (current && toDateString(current.effectiveFrom) === toDateString(effectiveDate)) {
        updated = await transaction.userProductRate.update({
          where: { id: current.id },
          data: { rate: rateValue, createdById: request.auth!.sub },
        });
      } else {
        if (current) {
          await transaction.userProductRate.update({
            where: { id: current.id },
            data: { effectiveTo: effectiveDate },
          });
        }
        updated = await transaction.userProductRate.create({
          data: {
            userId,
            productId,
            rate: rateValue,
            effectiveFrom: effectiveDate,
            createdById: request.auth!.sub,
          },
        });
      }

      await writeAudit(transaction, {
        actorId: request.auth!.sub,
        entityType: "UserProductRate",
        entityId: updated.id,
        action: "SET_RATE",
        beforeData: current,
        afterData: updated,
        reason: input.reason,
      });
      return updated;
    });
    response.json({ rate: serialize(rate) });
  }),
);

export const adminProductsRouter = router;
