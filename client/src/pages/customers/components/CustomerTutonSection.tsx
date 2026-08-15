import TutonMatrixTable from "../../tuton/components/TutonMatrixTable";

type Props = {
  show: boolean;
  summary: any;
  customerId: number;
  onChanged: () => void;
};

export default function CustomerTutonSection({ show, summary, customerId, onChanged }: Props) {
  if (!show) return null;

  const courses = Array.isArray(summary?.courses) ? summary.courses : [];

  return (
    <section
      aria-label="Matriks pengerjaan Tuton"
      className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_14px_38px_-30px_rgba(15,23,42,.35)] dark:border-slate-800 dark:bg-slate-900"
    >
      <TutonMatrixTable
        customerId={customerId}
        courses={courses}
        onSaved={onChanged}
        {...({ showScores: true } as any)}
      />
    </section>
  );
}
