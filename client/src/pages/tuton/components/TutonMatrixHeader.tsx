import { Button, CardHeader, Chip } from "@heroui/react";

export default function TutonMatrixHeader({
  changedCount,
  courseCount,
  doneCount,
  totalCount,
  onReset,
  onSave,
}: {
  changedCount: number;
  courseCount: number;
  doneCount?: number;
  totalCount?: number;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <CardHeader className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div className="text-[18px] font-semibold tracking-tight">Tuton Matrix (per Akun)</div>
      <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
        <Chip size="sm" variant="flat" className="bg-default-100">{courseCount} course</Chip>
        {typeof doneCount === "number" && typeof totalCount === "number" && (
          <Chip size="sm" variant="flat" className="bg-default-100">
            Selesai: {doneCount}/{totalCount}
          </Chip>
        )}
        <Chip size="sm" variant="flat" className="bg-default-100">{changedCount} perubahan</Chip>
        <Button variant="flat" className="min-h-10 bg-default-100 sm:min-h-8" onPress={onReset} isDisabled={changedCount === 0}>
          Batal
        </Button>
        <Button className="min-h-10 sm:min-h-8" color="success" onPress={onSave} isDisabled={changedCount === 0}>
          Simpan
        </Button>
      </div>
    </CardHeader>
  );
}
