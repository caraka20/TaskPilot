import { Button } from "@heroui/react";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export default function OwnerGajiPagination({ page, totalPages, total, loading = false, onPrev, onNext }: Props) {
  return (
    <div className="mt-2 flex flex-col gap-3 px-4 pb-5 sm:mt-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-6">
      <div className="text-center text-sm text-foreground-500 sm:text-left">
        Total {total} entri · Halaman {page} dari {totalPages}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <Button
          variant="flat"
          isDisabled={page <= 1 || loading}
          onPress={onPrev}
          aria-label="Halaman sebelumnya"
          className="min-h-11 min-w-28"
        >
          Sebelumnya
        </Button>
        <span className="hidden text-sm text-foreground-500 sm:inline" aria-hidden>
          {page} / {totalPages}
        </span>
        <Button
          variant="flat"
          isDisabled={page >= totalPages || loading}
          onPress={onNext}
          aria-label="Halaman berikutnya"
          className="min-h-11 min-w-28"
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}
