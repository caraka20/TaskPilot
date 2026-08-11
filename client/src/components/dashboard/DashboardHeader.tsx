// client/src/components/dashboard/DashboardHeader.tsx
import { Button, Chip } from "@heroui/react";
import { RefreshCw } from "lucide-react";

type Props = {
  title?: string;
  role: string;
  onRefresh: () => void;
};

export default function DashboardHeader({ title = "Dashboard", role, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Ringkasan</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Chip variant="flat">{role}</Chip>
        <Button
          color="primary"
          variant="flat"
          onPress={onRefresh}
          startContent={<RefreshCw className="h-4 w-4" />}
          className="min-h-11 flex-1 rounded-2xl sm:min-h-10 sm:flex-none"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
