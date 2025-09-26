// client/src/pages/customers/components/InvalidIdCard.tsx
import { Card, CardBody } from "@heroui/react";

export default function InvalidIdCard() {
  return (
    <div className="mx-auto max-w-6xl px-3 md:px-6">
      <Card className="border rounded-2xl shadow-sm">
        <CardBody>Parameter ID tidak valid.</CardBody>
      </Card>
    </div>
  );
}
