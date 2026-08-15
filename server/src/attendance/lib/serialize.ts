import { Prisma } from "../../generated/prisma";

export const serialize = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (_key, item) =>
      item instanceof Prisma.Decimal ? item.toString() : item,
    ),
  ) as T;
