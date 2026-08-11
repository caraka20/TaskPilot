import { useState } from "react";
import { Card, CardHeader, CardBody, Button, Chip, Input, Tooltip } from "@heroui/react";
import { Plus } from "lucide-react";

import BulkToolbar from "../components/matrix/BulkToolbar";
import useUnsavedBlocker from "../components/matrix/useUnsavedBlocker";
import MatrixTable from "../components/matrix/MatrixTable";
import { useMatrixState } from "../components/matrix/useMatrixState";
import { useConflictIds } from "../hooks/useConflictIds";
import type { MinimalCourse } from "../components/matrix/types";

// service/helper add matkul
import { addCourse } from "../../../services/tuton.service";
import { showApiError, showLoading, closeAlert, showSuccess } from "../../../utils/alert";

type Props = {
  customerId: number;
  courses?: MinimalCourse[];
  onSaved?: () => void;
};

export default function TutonMatrixTable({ customerId, courses = [], onSaved }: Props) {
  const m = useMatrixState(courses, onSaved);
  useUnsavedBlocker(m.changedCount > 0);

  const { conflictIds } = useConflictIds();

  // input Tambah Matkul
  const [matkul, setMatkul] = useState("");
  const [busyAdd, setBusyAdd] = useState(false);

  async function handleAdd() {
    const name = matkul.trim();
    if (!name || !customerId) return;
    setBusyAdd(true);
    showLoading("Menambahkan matkul…");
    try {
      await addCourse(customerId, { matkul: name, generateItems: true });
      closeAlert();
      await showSuccess("Matkul ditambahkan");
      setMatkul("");
      onSaved?.(); // refresh matrix
    } catch (e) {
      closeAlert();
      await showApiError(e);
    } finally {
      setBusyAdd(false);
    }
  }

  return (
    <Card className="mt-4 overflow-hidden rounded-2xl border border-default-200 shadow-md sm:mt-5">
      <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-sky-400" />

      <BulkToolbar
        sesi={m.bulkSesi}
        setSesi={m.setBulkSesi}
        onBulkStatus={m.handleBulkStatus}
        onBulkCopas={m.handleBulkCopas}
      />

      {/** Header: kiri judul, kanan (Tambah Matkul + aksi) */}
      <CardHeader className="flex flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        {/* Kiri: Judul */}
        <div className="text-[18px] font-semibold tracking-tight">Tuton Matrix (per Akun)</div>

        {/* Kanan: dikelompokkan agar di desktop berada di pojok kanan atas */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          {/* Tambah Matkul — diletakkan paling kanan (top-right) */}
          <div className="flex w-full items-end gap-2 sm:order-2 sm:w-auto">
            <Input
              size="sm"
              label="Tambah Matkul"
              placeholder="mis. Ekonomi Mikro"
              value={matkul}
              onValueChange={setMatkul}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              variant="bordered"
              className="w-full sm:w-[260px]"
            />
            <Tooltip content="Tambahkan matkul baru">
              <Button
                size="sm"
                startContent={<Plus className="h-4 w-4" />}
                className="min-h-11 shrink-0 text-white bg-gradient-to-r from-sky-500 to-indigo-500 shadow-sm sm:min-h-8"
                isLoading={busyAdd}
                onPress={handleAdd}
              >
                Tambah
              </Button>
            </Tooltip>
          </div>

          {/* Aksi Simpan/Batal + counter perubahan */}
          <div className="grid w-full grid-cols-2 items-center gap-2 sm:order-1 sm:flex sm:w-auto">
            <Chip size="sm" variant="flat" className="col-span-2 justify-center bg-default-100 sm:col-span-1">
              {m.changedCount} perubahan
            </Chip>
            <Button
              variant="flat"
              className="min-h-10 bg-default-100 sm:min-h-8"
              onPress={m.handleCancelAll}
              isDisabled={m.changedCount === 0}
            >
              Batal
            </Button>
            <Button className="min-h-10 sm:min-h-8" color="success" onPress={m.handleSaveAll} isDisabled={m.changedCount === 0}>
              Simpan
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <MatrixTable
          normalized={m.normalized}
          pairsByCourse={m.pairsByCourse}
          pairsVersion={m.pairsVersion}
          conflicts={m.conflicts}
          conflictIds={conflictIds}
          absenHeaderMode={m.absenHeaderMode}
          onToggleHeaderAbsen={m.handleHeaderAbsenToggle}
          isCopas={m.isCopas}
          toggleCopas={m.toggleCopas}
          copyMatkul={m.copyMatkul}
          copiedId={m.copiedId}
          markDirty={m.markDirty}
        />
      </CardBody>
    </Card>
  );
}
