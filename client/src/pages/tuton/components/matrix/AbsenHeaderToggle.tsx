import { Button } from "@heroui/react";

export default function AbsenHeaderToggle({
  sesi,
  target, // "SELESAI" | "BELUM"
  onToggle,
}: {
  sesi: number;
  target: "SELESAI" | "BELUM";
  onToggle: (sesi: number) => void;
}) {
  const isDone = target === "SELESAI";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="font-medium">S{String(sesi)}</div>
      <Button
        size="sm"
        radius="full"
        aria-label={`Toggle absen sesi ${sesi}`}
        className={[
          "h-6 px-3 text-[11px]",
          isDone ? "bg-emerald-600 text-white" : "bg-default-200 text-foreground-700",
        ].join(" ")}
        onPress={() => onToggle(sesi)}
        title={isDone ? "Set Absen → SELESAI" : "Set Absen → BELUM"}
      >
        {isDone ? "Absen ✓" : "Absen —"}
      </Button>
    </div>
  );
}
