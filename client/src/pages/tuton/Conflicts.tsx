// client/src/pages/tuton/Conflicts.tsx
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button } from "@heroui/react";
import BackButton from "../../components/common/BackButton";
import { listConflicts, getConflictByMatkul, type ConflictGroupResponse } from "../../services/tuton.service";

export default function TutonConflicts() {
  const [groups, setGroups] = useState<ConflictGroupResponse[]>([]);
  const [detail, setDetail] = useState<ConflictGroupResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const g = await listConflicts();
      setGroups(g);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-3 md:px-6 py-4">
      <Card className="rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-500" />
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton variant="flat" />
            <div className="text-lg font-semibold">Tuton Conflicts</div>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Card className="border rounded-xl">
            <CardHeader className="font-medium">Daftar Matkul Terduplikasi</CardHeader>
            <CardBody>
              <Table aria-label="conflicts" removeWrapper isStriped>
                <TableHeader>
                  <TableColumn>Matkul</TableColumn>
                  <TableColumn className="w-[120px]">Total</TableColumn>
                  <TableColumn className="text-right w-[160px]">Aksi</TableColumn>
                </TableHeader>
                <TableBody isLoading={loading} emptyContent="Tidak ada konflik.">
                  {groups.map((g) => (
                    <TableRow key={g.matkul}>
                      <TableCell>{g.matkul}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">{g.total}</Chip>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="flat" onPress={async () => setDetail(await getConflictByMatkul(g.matkul))}>
                          Lihat detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {detail && (
            <Card className="border rounded-xl">
              <CardHeader className="font-medium">
                Detail Konflik — <span className="ml-1 text-indigo-600">{detail.matkul}</span>
              </CardHeader>
              <CardBody>
                <Table aria-label="conflict detail" removeWrapper>
                  <TableHeader>
                    <TableColumn>Customer</TableColumn>
                    <TableColumn className="w-[160px]">CourseId</TableColumn>
                    <TableColumn className="w-[120px]">Duplikat?</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {detail.customers.map((c) => (
                      <TableRow key={c.courseId}>
                        <TableCell>{c.namaCustomer}</TableCell>
                        <TableCell>
                          <code className="text-slate-700">{c.courseId}</code>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" color={c.isDuplicate ? "warning" : "default"} variant="flat">
                            {c.isDuplicate ? "Ya" : "Tidak"}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
