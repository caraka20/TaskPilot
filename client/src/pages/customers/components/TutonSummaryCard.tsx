import { Card, CardHeader, CardBody, Progress } from "@heroui/react";
import type { TutonSummary } from "../../../utils/customer";

export default function TutonSummaryCard({ data }: { data?: TutonSummary }) {
  if (!data) return null;
  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-1">
        <div className="text-lg font-semibold">Tuton Summary</div>
        <div className="text-foreground-500 text-sm">
          {data.totalCourses} course · {data.totalCompleted}/{data.totalItems} item selesai
        </div>
      </CardHeader>
      <CardBody className="flex flex-col gap-3">
        <Progress
          aria-label="Overall Progress"
          value={Math.round((data.overallProgress ?? 0) * 100)}
          showValueLabel
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.courses.map((c) => (
            <Card key={c.courseId}>
              <CardHeader className="font-medium">{c.matkul}</CardHeader>
              <CardBody className="text-sm">
                <div>Total Items: {c.totalItems}</div>
                <div>Completed: {c.completedItems}</div>
                <div>Diskusi: {c.breakdown.DISKUSI.selesai}/{c.breakdown.DISKUSI.total} (avg {c.breakdown.DISKUSI.nilaiAvg ?? "-"})</div>
                <div>Absen: {c.breakdown.ABSEN.selesai}/{c.breakdown.ABSEN.total}</div>
                <div>Tugas: {c.breakdown.TUGAS.selesai}/{c.breakdown.TUGAS.total} (avg {c.breakdown.TUGAS.nilaiAvg ?? "-"})</div>
              </CardBody>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
