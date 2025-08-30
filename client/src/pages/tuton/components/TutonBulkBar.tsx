// client/src/pages/tuton/components/TutonBulkBar.tsx
import { Button, Input, Chip, Tooltip } from "@heroui/react";
import { CheckSquare, SquareDashed, PlusCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function TutonBulkBar({
  total,
  selectedCount,
  onSelectAll,
  onBulkSelesai,
  onBulkBelum,
  onBulkNilai,
  onInit,
  onOverwrite,
}: {
  total: number;
  selectedCount: number;
  onSelectAll: (on: boolean) => void;
  onBulkSelesai: () => void;
  onBulkBelum: () => void;
  onBulkNilai: (nilai: number | null) => void;
  onInit: () => void;
  onOverwrite: () => void;
}) {
  const [nilai, setNilai] = useState<string>("");

  const parsedNilai = () => {
    const t = nilai.trim();
    if (t === "") return null; // kosongkan nilai (null)
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip size="sm" variant="flat" className="bg-default-100">
        {selectedCount}/{total} dipilih
      </Chip>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="flat"
          className="bg-default-100"
          startContent={<SquareDashed className="h-4 w-4" />}
          onPress={() => onSelectAll(true)}
          isDisabled={total === 0}
        >
          Pilih semua
        </Button>
        <Button
          size="sm"
          variant="flat"
          className="bg-default-100"
          onPress={() => onSelectAll(false)}
          isDisabled={selectedCount === 0}
        >
          Hapus pilihan
        </Button>
      </div>

      <div className="w-px h-6 bg-default-200 mx-1" />

      <div className="flex items-center gap-2">
        <Tooltip content="Set item terpilih ke SELESAI">
          <Button
            size="sm"
            className="bg-emerald-600 text-white"
            startContent={<CheckSquare className="h-4 w-4" />}
            onPress={onBulkSelesai}
            isDisabled={selectedCount === 0}
          >
            Selesai
          </Button>
        </Tooltip>

        <Tooltip content="Set item terpilih ke BELUM">
          <Button
            size="sm"
            className="bg-default-200"
            onPress={onBulkBelum}
            isDisabled={selectedCount === 0}
          >
            Belum
          </Button>
        </Tooltip>
      </div>

      <div className="w-px h-6 bg-default-200 mx-1" />

      <div className="flex items-center gap-2">
        <Input
          size="sm"
          label="Nilai massal"
          placeholder="0–100 / kosong"
          value={nilai}
          onValueChange={setNilai}
          className="w-[150px]"
          variant="bordered"
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <Button
          size="sm"
          variant="flat"
          className="bg-default-100"
          onPress={() => onBulkNilai(parsedNilai())}
          isDisabled={selectedCount === 0}
        >
          Terapkan Nilai
        </Button>
      </div>

      <div className="w-px h-6 bg-default-200 mx-1" />

      <div className="flex items-center gap-2">
        <Tooltip content="Inisialisasi 19 item (tanpa menghapus)">
          <Button
            size="sm"
            startContent={<PlusCircle className="h-4 w-4" />}
            className="bg-sky-600 text-white"
            onPress={onInit}
          >
            Init Items
          </Button>
        </Tooltip>
        <Tooltip content="Regenerasi 19 item (hapus & buat ulang)">
          <Button
            size="sm"
            startContent={<RefreshCw className="h-4 w-4" />}
            className="bg-rose-600 text-white"
            onPress={onOverwrite}
          >
            Overwrite
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
