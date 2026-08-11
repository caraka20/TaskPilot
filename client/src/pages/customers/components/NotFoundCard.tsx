// client/src/pages/customers/components/NotFoundCard.tsx
import { Card, CardBody } from "@heroui/react";

export default function NotFoundCard() {
  return (
    <div className="mx-auto max-w-6xl px-3 md:px-6">
      <Card className="bg-white shadow-md border rounded-2xl">
        <CardBody>
          <div className="text-danger">Data tidak ditemukan.</div>
        </CardBody>
      </Card>
    </div>
  );
}
