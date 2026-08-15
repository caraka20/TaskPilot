import { useState } from "react";
import { Card, CardHeader, CardBody, Button, Input, Tooltip } from "@heroui/react";
import { BookOpenCheck, Plus, RotateCcw, Save } from "lucide-react";

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
    <Card className="overflow-hidden rounded-none border-0 bg-transparent shadow-none">
      <CardHeader className="flex flex-col gap-4 border-b border-slate-200/70 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-[#1b5278] ring-1 ring-sky-100 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/15">
            <BookOpenCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg">
                Matriks Tuton
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {m.normalized.length} mata kuliah
              </span>
              {m.changedCount > 0 ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200/70 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
                  {m.changedCount} perubahan belum disimpan
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Kelola status sesi, nilai, dan penanda salin dalam satu tabel.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-end">
          <div className="flex min-w-0 flex-1 items-end gap-2 lg:w-[350px]">
            <Input
              size="sm"
              label="Tambah mata kuliah"
              labelPlacement="outside"
              placeholder="Contoh: Ekonomi Mikro"
              value={matkul}
              onValueChange={setMatkul}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              variant="bordered"
              className="min-w-0 flex-1"
              classNames={{
                label: "text-[11px] font-bold text-slate-600 dark:text-slate-300",
                inputWrapper:
                  "min-h-10 rounded-xl border-slate-200 bg-slate-50 shadow-none data-[hover=true]:border-sky-300 group-data-[focus=true]:border-sky-500 dark:border-slate-700 dark:bg-slate-950/40",
              }}
            />
            <Tooltip content="Tambahkan mata kuliah baru">
              <Button
                size="sm"
                startContent={<Plus className="h-4 w-4" />}
                className="min-h-10 shrink-0 rounded-xl bg-[#1b5278] px-4 font-bold text-white shadow-[0_8px_18px_-12px_rgba(27,82,120,.8)]"
                isLoading={busyAdd}
                isDisabled={!matkul.trim() || busyAdd}
                onPress={handleAdd}
              >
                Tambah
              </Button>
            </Tooltip>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
            <Button
              size="sm"
              variant="flat"
              startContent={<RotateCcw className="h-3.5 w-3.5" />}
              className="min-h-10 rounded-xl bg-slate-100 px-4 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              onPress={m.handleCancelAll}
              isDisabled={m.changedCount === 0}
            >
              Batal
            </Button>
            <Button
              size="sm"
              startContent={<Save className="h-3.5 w-3.5" />}
              className="min-h-10 rounded-xl bg-emerald-600 px-4 font-bold text-white shadow-[0_8px_18px_-12px_rgba(5,150,105,.85)]"
              onPress={m.handleSaveAll}
              isDisabled={m.changedCount === 0}
            >
              Simpan
            </Button>
          </div>
        </div>
      </CardHeader>

      <BulkToolbar
        sesi={m.bulkSesi}
        setSesi={m.setBulkSesi}
        onBulkStatus={m.handleBulkStatus}
        onBulkCopas={m.handleBulkCopas}
      />

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
