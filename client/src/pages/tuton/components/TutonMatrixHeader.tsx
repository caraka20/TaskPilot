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
    <CardHeader className="flex items-center justify-between">
      <div className="text-[18px] font-semibold tracking-tight">Tuton Matrix (per Akun)</div>
      <div className="flex items-center gap-2">
        <Chip size="sm" variant="flat" className="bg-default-100">{courseCount} course</Chip>
        {typeof doneCount === "number" && typeof totalCount === "number" && (
          <Chip size="sm" variant="flat" className="bg-default-100">
            Selesai: {doneCount}/{totalCount}
          </Chip>
        )}
        <Chip size="sm" variant="flat" className="bg-default-100">{changedCount} perubahan</Chip>
        <Button variant="flat" className="bg-default-100" onPress={onReset} isDisabled={changedCount === 0}>
          Batal
        </Button>
        <Button color="success" onPress={onSave} isDisabled={changedCount === 0}>
          Simpan
        </Button>
      </div>
    </CardHeader>
  );
}
