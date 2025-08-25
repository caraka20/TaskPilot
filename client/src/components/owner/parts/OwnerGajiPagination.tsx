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
    <div className="mt-3 flex items-center justify-between px-6 pb-6">
      <div className="text-sm text-foreground-500">Total {total} entri</div>
      <div className="flex items-center gap-2">
        <Button
          variant="flat"
          isDisabled={page <= 1 || loading}
          onPress={onPrev}
          aria-label="Halaman sebelumnya"
        >
          Prev
        </Button>
        <span className="text-sm text-foreground-500">
          {page} / {totalPages}
        </span>
        <Button
          variant="flat"
          isDisabled={page >= totalPages || loading}
          onPress={onNext}
          aria-label="Halaman berikutnya"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
