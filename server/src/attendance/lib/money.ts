import { Prisma } from "../../generated/prisma";
import { AppError } from "./http";

export type MoneyInput = string | number | Prisma.Decimal;

export const money = (value: MoneyInput) => {
  let result: Prisma.Decimal;
  try {
    result = new Prisma.Decimal(value).toDecimalPlaces(2);
  } catch {
    throw new AppError(422, "Nominal tidak valid.");
  }
  if (result.isNegative()) throw new AppError(422, "Nominal tidak boleh negatif.");
  return result;
};
