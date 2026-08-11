// client/src/components/jam-kerja/GajiPerJamCard.tsx
import { Card, CardHeader, CardBody } from "@heroui/react";

type Props = { gajiPerJam: number };

export default function GajiPerJamCard({ gajiPerJam }: Props) {
  const fmt = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  return (
    <Card>
      <CardHeader className="text-sm text-foreground-500">Gaji per Jam</CardHeader>
      <CardBody>
        <div className="text-2xl font-semibold">{fmt.format(gajiPerJam)}</div>
      </CardBody>
    </Card>
  );
}
