import { Chip } from "@heroui/react";
import { currencyIDR } from "../../utils/format";

export default function MoneyPill({
  value,
  tone = "success",
}: {
  value: number;
  tone?: "success" | "warning" | "default";
}) {
  const color = tone === "success" ? "success" : tone === "warning" ? "warning" : "default";
  return (
    <Chip variant="flat" color={color} radius="sm" className="font-medium text-base">
      {currencyIDR.format(value || 0)}
    </Chip>
  );
}
