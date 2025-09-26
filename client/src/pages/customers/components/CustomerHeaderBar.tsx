// client/src/pages/customers/components/CustomerHeaderBar.tsx
import { Card, Chip } from "@heroui/react";
import BackButton from "../../../components/common/BackButton";
import { IdCard, GraduationCap, Tag } from "lucide-react";
import type { CustomerDetail as DetailType } from "../../../utils/customer";

type Props = {
  data: DetailType;
  jenisNormalized: string;
  isKarilLike: boolean; // tetap diterima dari parent, tidak dipakai
  karilLabel: "KARIL" | "TK"; // tetap diterima, tidak dipakai
  showTutonMatrix: boolean;    // tetap diterima, tidak dipakai
  singleCourseId: number | null; // tetap diterima, tidak dipakai
};

export default function CustomerHeaderBar({
  data,
  jenisNormalized,
}: Props) {
  const chipCls =
    "border border-default-200 bg-content2 text-foreground " +
    "shadow-[0_1px_0_rgba(0,0,0,0.03)] " +
    "dark:border-neutral-800 dark:bg-neutral-900/50 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]";

  return (
    <Card className="rounded-2xl overflow-hidden shadow-md border border-default-100 bg-content1">
      <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-content2 to-content1 dark:from-content2 dark:to-content1">
        <div className="flex items-center gap-4">
          <BackButton variant="flat" tone="sky" tooltip="Kembali" />

          <div className="flex items-center gap-3">
            <span className="h-9 w-[3px] rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]" />
            <div className="flex flex-col">
              <div
                className="text-[17px] sm:text-lg font-semibold tracking-tight"
                style={{ color: "var(--hdr-title)" }}
              >
                Customer Detail
              </div>
              <p
                className="text-[13px] sm:text-sm !leading-snug"
                style={{ color: "var(--hdr-subtitle)" }}
              >
                Profil customer, tagihan, dan progres layanan.
              </p>
            </div>
          </div>
        </div>

        {/* hanya chip info, tanpa tombol aksi */}
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="flat" className={chipCls} startContent={<Tag className="h-3.5 w-3.5" />}>
            {jenisNormalized || "—"}
          </Chip>

          {data.nim && (
            <Chip size="sm" variant="flat" className={chipCls} startContent={<IdCard className="h-3.5 w-3.5" />}>
              NIM: <span className="ml-1 font-medium">{data.nim}</span>
            </Chip>
          )}

          {data.jurusan && (
            <Chip size="sm" variant="flat" className={chipCls} startContent={<GraduationCap className="h-3.5 w-3.5" />}>
              {data.jurusan}
            </Chip>
          )}
        </div>
      </div>
    </Card>
  );
}
