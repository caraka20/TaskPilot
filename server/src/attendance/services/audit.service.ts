import type { Prisma, PrismaClient } from "../../generated/prisma";

type Database = PrismaClient | Prisma.TransactionClient;

type AuditInput = {
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeData?: unknown;
  afterData?: unknown;
  reason?: string;
};

const jsonValue = (value: unknown) =>
  value === undefined
    ? undefined
    : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);

export async function writeAudit(db: Database, input: AuditInput) {
  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      beforeData: jsonValue(input.beforeData),
      afterData: jsonValue(input.afterData),
      reason: input.reason,
    },
  });
}
