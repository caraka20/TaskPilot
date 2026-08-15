import { Prisma, WorkMode } from "../../generated/prisma";
import { money } from "../lib/money";

export function resolveWorkEntryFinalAmount(input: {
  mode: WorkMode;
  calculated: Prisma.Decimal;
  requested?: string | number;
  manualAmount?: boolean;
}) {
  if (input.mode === WorkMode.PIECEWORK && !input.manualAmount) {
    return input.calculated;
  }

  return input.requested === undefined
    ? input.calculated
    : money(input.requested);
}
