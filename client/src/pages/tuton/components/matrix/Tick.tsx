import { Tooltip } from "@heroui/react";
import { Check } from "lucide-react";

export default function Tick({
  on,
  title,
  onClick,
  color = "emerald",
}: {
  on: boolean;
  title: string;
  onClick: () => void;
  color?: "emerald" | "sky" | "violet";
}) {
  const onCls = {
    emerald: "bg-emerald-500 border-emerald-600",
    sky: "bg-sky-500 border-sky-600",
    violet: "bg-violet-500 border-violet-600",
  }[color];

  return (
    <Tooltip content={title}>
      <button
        type="button"
        onClick={onClick}
        className={[
          "h-6 w-6 rounded-md border inline-flex items-center justify-center transition",
          on ? `${onCls} text-white shadow-sm` : "bg-white text-foreground-500 border-default-300 hover:bg-default-100",
        ].join(" ")}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}
