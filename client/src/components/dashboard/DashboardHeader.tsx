// client/src/components/dashboard/DashboardHeader.tsx
import { Button, Chip } from "@heroui/react";

type Props = {
  title?: string;
  role: string;
  onRefresh: () => void;
};

export default function DashboardHeader({ title = "Dashboard", role, onRefresh }: Props) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <Chip variant="flat">{role}</Chip>
        <Button size="sm" color="primary" onPress={onRefresh}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
