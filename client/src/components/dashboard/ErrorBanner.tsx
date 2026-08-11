// client/src/components/dashboard/ErrorBanner.tsx
import { Card, CardBody } from "@heroui/react";

export default function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <Card className="border-danger-200 bg-danger-50">
      <CardBody>
        <p className="text-danger-600 text-sm">{message}</p>
      </CardBody>
    </Card>
  );
}
