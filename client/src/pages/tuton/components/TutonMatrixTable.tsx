import { Card, CardHeader, CardBody, Button, Chip } from "@heroui/react";
import BulkToolbar from "./matrix/BulkToolbar";
import useUnsavedBlocker from "./matrix/useUnsavedBlocker";
import TutonNilaiModal from "./TutonNilaiModal";
import MatrixTable from "./matrix/MatrixTable";
import { useMatrixState } from "./matrix/useMatrixState";
import type { MinimalCourse } from "./matrix/types";

export default function TutonMatrixTable({
  courses = [],
  onSaved,
}: { courses?: MinimalCourse[]; onSaved?: () => void }) {
  const m = useMatrixState(courses, onSaved);
  useUnsavedBlocker(m.changedCount > 0);

  return (
    <Card className="mt-5 rounded-2xl border border-default-200 shadow-md overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-sky-400" />

      <BulkToolbar
        sesi={m.bulkSesi}
        setSesi={m.setBulkSesi}
        onBulkStatus={m.handleBulkStatus}   // auto-save + konfirmasi
        onBulkCopas={m.handleBulkCopas}     // auto-save + konfirmasi
      />

      <CardHeader className="flex items-center justify-between">
        <div className="text-[18px] font-semibold tracking-tight">Tuton Matrix (per Akun)</div>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" className="bg-default-100">{m.changedCount} perubahan</Chip>
          <Button variant="flat" className="bg-default-100" onPress={m.handleCancelAll} isDisabled={m.changedCount===0}>
            Batal
          </Button>
          <Button color="success" onPress={m.handleSaveAll} isDisabled={m.changedCount===0}>
            Simpan
          </Button>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <MatrixTable
          normalized={m.normalized}
          pairsByCourse={m.pairsByCourse}
          pairsVersion={m.pairsVersion}
          conflicts={m.conflicts}
          absenHeaderMode={m.absenHeaderMode}
          onToggleHeaderAbsen={m.handleHeaderAbsenToggle}
          isCopas={m.isCopas}
          toggleCopas={m.toggleCopas}
          copyMatkul={m.copyMatkul}
          copiedId={m.copiedId}
          markDirty={m.markDirty}
        />
      </CardBody>

      {m.nilaiModal && (
        <TutonNilaiModal
          open
          courseId={m.nilaiModal.courseId}
          matkul={m.nilaiModal.matkul}
          onClose={() => m.setNilaiModal(null)}
          onSaved={onSaved}
        />
      )}
    </Card>
  );
}
