import { Prisma, type PrismaClient } from "../../generated/prisma";

type Database = PrismaClient | Prisma.TransactionClient;

export async function getProductRate(
  db: Database,
  userId: string,
  productId: string,
  workDate: Date,
) {
  const [customRate, product] = await Promise.all([
    db.userProductRate.findFirst({
      where: {
        userId,
        productId,
        effectiveFrom: { lte: workDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: workDate } }],
      },
      orderBy: { effectiveFrom: "desc" },
    }),
    db.product.findUniqueOrThrow({ where: { id: productId } }),
  ]);

  return customRate?.rate ?? product.baseRate ?? new Prisma.Decimal(0);
}

export async function getDailyRate(
  db: Database,
  userId: string,
  workDate: Date,
) {
  const [history, user] = await Promise.all([
    db.dailyRateHistory.findFirst({
      where: {
        userId,
        effectiveFrom: { lte: workDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: workDate } }],
      },
      orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    }),
    db.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);
  return history?.amount ?? user.dailyRate;
}
