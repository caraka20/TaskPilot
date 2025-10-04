// client/src/pages/customers/components/CustomerHeaderBar.tsx
import { Card, Chip, Button, Tooltip } from "@heroui/react";
import BackButton from "../../../components/common/BackButton";
import { IdCard, GraduationCap, Tag, KeyRound, Copy, Eye, EyeOff } from "lucide-react";
import type { CustomerDetail as DetailType } from "../../../utils/customer";
import { useState } from "react";

type Props = {
  data: DetailType;
  jenisNormalized: string;
  isKarilLike: boolean;
  karilLabel: "KARIL" | "TK";
  showTutonMatrix: boolean;
  singleCourseId: number | null;
  password?: string;
};

export default function CustomerHeaderBar({
  data,
  jenisNormalized,
  password,
}: Props) {
  const [copied, setCopied] = useState<"nim" | "pass" | null>(null);
  const [showPass, setShowPass] = useState(false);

  const chipCls =
    "relative border border-default-200 bg-gradient-to-r from-content1 to-content2 " +
    "text-foreground shadow-sm rounded-xl px-2.5 py-1 " +
    "dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-800";

  const handleCopy = async (text: string, type: "nim" | "pass") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  };

  const passValue =
    typeof (data as any).password === "string"
      ? (data as any).password
      : password ?? "";

  return (
    <Card className="rounded-2xl overflow-hidden shadow-md border border-default-100 bg-content1">
      {/* top gradient line */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-content2 to-content1 dark:from-content2 dark:to-content1">
        <div className="flex items-center gap-4">
          <BackButton variant="flat" tone="sky" tooltip="Kembali" />

          <div className="flex items-center gap-3">
            <span className="h-9 w-[3px] rounded-full bg-gradient-to-b from-sky-400 to-indigo-500 shadow" />
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

        {/* chips info */}
        <div className="flex flex-wrap items-center gap-2">
          <Chip size="sm" variant="flat" className={chipCls} startContent={<Tag className="h-3.5 w-3.5" />}>
            {jenisNormalized || "—"}
          </Chip>

          {data.nim && (
            <div className="relative">
              <Chip
                size="sm"
                variant="flat"
                className={
                  "flex items-center gap-1 pr-1 border bg-gradient-to-r from-sky-100 to-sky-200 text-sky-800 " +
                  "dark:from-sky-900 dark:to-sky-800 dark:text-sky-200 rounded-xl px-2.5 py-1"
                }
                startContent={<IdCard className="h-3.5 w-3.5" />}
              >
                <span className="font-semibold">NIM: {data.nim}</span>
                <Tooltip content="Salin NIM">
                  <Button
                    isIconOnly
                    size="sm"
                    className="h-6 w-6 min-w-0"
                    variant="light"
                    onPress={() => handleCopy(data.nim!, "nim")}
                  >
                    <Copy className="h-3.5 w-3.5 text-black dark:text-white" />
                  </Button>
                </Tooltip>

              </Chip>
              {copied === "nim" && (
                <div className="absolute -top-4 right-1 bg-emerald-500 text-white text-[11px] px-2 py-0.5 rounded-full shadow animate-fade">
                  ✔ Disalin!
                </div>
              )}
            </div>
          )}

          {passValue && (
            <div className="relative">
              <Chip
                size="sm"
                variant="flat"
                className={
                  "flex items-center gap-1 pr-1 border bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 " +
                  "dark:from-indigo-900 dark:to-indigo-800 dark:text-indigo-200 rounded-xl px-2.5 py-1"
                }
                startContent={<KeyRound className="h-3.5 w-3.5" />}
              >
                <span className="font-semibold">
                  Password:{" "}
                  {showPass
                    ? passValue
                    : "•".repeat(Math.min(8, passValue.length))}
                </span>
                <Tooltip content={showPass ? "Sembunyikan" : "Tampilkan"}>
                  <Button
                    isIconOnly
                    size="sm"
                    className="h-6 w-6 min-w-0"
                    variant="light"
                    onPress={() => setShowPass((s) => !s)}
                  >
                    {showPass ? (
                      <EyeOff className="h-3.5 w-3.5 text-black dark:text-white" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-black dark:text-white" />
                    )}
                  </Button>
                </Tooltip>

                <Tooltip content="Salin Password">
                  <Button
                    isIconOnly
                    size="sm"
                    className="h-6 w-6 min-w-0"
                    variant="light"
                    onPress={() => handleCopy(passValue, "pass")}
                  >
                    <Copy className="h-3.5 w-3.5 text-black dark:text-white" />
                  </Button>
                </Tooltip>

              </Chip>
              {copied === "pass" && (
                <div className="absolute -top-4 right-1 bg-emerald-500 text-white text-[11px] px-2 py-0.5 rounded-full shadow animate-fade">
                  ✔ Password disalin!
                </div>
              )}
            </div>
          )}

          {data.jurusan && (
            <Chip
              size="sm"
              variant="flat"
              className={chipCls}
              startContent={<GraduationCap className="h-3.5 w-3.5" />}
            >
              {data.jurusan}
            </Chip>
          )}
        </div>
      </div>
    </Card>
  );
}
