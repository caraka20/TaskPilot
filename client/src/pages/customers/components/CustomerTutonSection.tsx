import TutonMatrixTable from "../../tuton/components/TutonMatrixTable";

type Props = {
  show: boolean;
  summary: any;
  customerId: number;
  onChanged: () => void;
};

export default function CustomerTutonSection({ show, summary, customerId, onChanged }: Props) {
  if (!show || !summary) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Selalu tampilkan matrix; input tambah matkul ada di header matrix */}
      <TutonMatrixTable
        customerId={customerId}           // ✅ penting untuk add matkul
        courses={Array.isArray(summary?.courses) ? summary.courses : []}
        onSaved={onChanged}
        {...({ showScores: true } as any)}
      />
    </div>
  );
}
