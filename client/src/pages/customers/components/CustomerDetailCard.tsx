// client/src/pages/customers/components/CustomerDetailCard.tsx
import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Chip,
  Button,
  Tooltip,
  Divider,
  Progress,
  Avatar,
} from "@heroui/react";
import type { CustomerDetail } from "../../../utils/customer";
import { fmtRp } from "../../../utils/customer";
import { useAuthStore } from "../../../store/auth.store";
import CustomerUpdateModal from "./CustomerUpdateModal";
import { User, Copy } from "lucide-react";

/* ================= Helpers ================= */
function Row({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-foreground-500">{label}</span>
      <span className={`font-semibold ${className || "text-foreground"}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function normalizePhoneForWa(raw?: string): string | null {
  if (!raw) return null;
  let digits = (raw.match(/\d+/g) || []).join("");
  if (!digits) return null;
  while (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.length >= 8 && !digits.startsWith("1")) return "62" + digits;
  return digits;
}

function buildWaLink(noWa?: string, nama?: string): string | null {
  const normalized = normalizePhoneForWa(noWa);
  if (!normalized) return null;
  const greet =
    nama && nama.trim()
      ? `Halo ${nama.trim()}, saya ingin menanyakan pesanan/layanan.`
      : "Halo, saya ingin menanyakan pesanan/layanan.";
  const text = encodeURIComponent(greet);
  return `https://wa.me/${normalized}?text=${text}`;
}

function formatHariTglBln(input: string | number | Date): string {
  const d = new Date(input);
  const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${hari}, ${dd}/${mm}`;
}

/** Chip khusus untuk NIM/Password */
function DataChip({
  label,
  value,
  color,
  copyHint,
  justCopied,
  onCopied,
}: {
  label: string;
  value: string;
  color: string;
  copyHint: string;
  justCopied: boolean;
  onCopied: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      onCopied();
    } catch (err) {
      console.error("Gagal salin:", err);
    }
  };

  return (
    <Chip
      variant="flat"
      color={color as any}
      className="flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-mono"
      endContent={
      <Tooltip content={copyHint}>
        <Button isIconOnly size="sm" variant="light" onPress={copy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>

      }
    >
      <span className="font-semibold">{label}:</span> {value || "—"}
      {justCopied && (
        <span className="ml-2 text-[10px] text-emerald-500 font-semibold">✔</span>
      )}
    </Chip>
  );
}

/* ================= Component ================= */
type Props = {
  data: CustomerDetail;
  password?: string;
  showBilling?: boolean;
  onUpdated?: () => void;
};

export default function CustomerDetailCard({
  data,
  password,
  showBilling,
  onUpdated,
}: Props) {
  const [copied, setCopied] = useState<"nim" | "pass" | "wa" | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  const { role } = useAuthStore();
  const isOwner = (role || "").toUpperCase() === "OWNER";

  const passValue =
    typeof (data as any).password === "string"
      ? (data as any).password
      : password ?? "";

  const createdAtLabel = useMemo(
    () => formatHariTglBln(data.createdAt),
    [data.createdAt]
  );

  const total = data.totalBayar ?? 0;
  const sudah = data.sudahBayar ?? 0;
  const sisa = data.sisaBayar ?? Math.max(total - sudah, 0);
  const progress = total > 0 ? Math.min(100, (sudah / total) * 100) : 0;

  const jenisLabel = data.jenis || (data.hasKaril ? "KARIL" : "TUTON");

  const copyWa = async () => {
    if (!data.noWa) return;
    try {
      await navigator.clipboard.writeText(data.noWa);
      setCopied("wa");
      setTimeout(() => setCopied(null), 1200);
    } catch (err) {
      console.error("[Clipboard] gagal salin WA:", err);
    }
  };

  return (
    <>
      <div className="mt-6 mb-2 text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
        Detail Customer
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Info Akun */}
        <Card className="overflow-hidden border border-default-200 dark:border-neutral-800 bg-content1 dark:bg-neutral-900 shadow-md">
          <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />

          <CardHeader className="flex flex-col gap-3 pt-4">
            <div className="flex items-center gap-3 justify-between w-full">
              <div className="flex items-center gap-3">
                <Avatar
                  icon={<User className="h-6 w-6 text-white" />}
                  className="h-14 w-14 text-lg font-semibold bg-gradient-to-r from-sky-500 to-indigo-500"
                />
                <div>
                  <div className="text-xl font-semibold tracking-tight">
                    <span className="bg-gradient-to-r from-sky-600 to-indigo-600 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      {data.namaCustomer}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {data.jurusan && <Chip size="sm">{data.jurusan}</Chip>}
                    <Chip size="sm" color="secondary">
                      {jenisLabel}
                    </Chip>
                  </div>
                </div>
              </div>

              {isOwner && (
                <Button
                  color="primary"
                  variant="shadow"
                  className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow"
                  onPress={() => setShowUpdate(true)}
                >
                  Update Customer
                </Button>
              )}
            </div>
          </CardHeader>

          <CardBody>
            {/* NIM & Password Chips */}
            <div className="flex flex-wrap gap-3 mb-4">
              <DataChip
                label="NIM"
                value={String(data.nim ?? "")}
                color="primary"
                copyHint={copied === "nim" ? "Disalin!" : "Salin NIM"}
                justCopied={copied === "nim"}
                onCopied={() => {
                  setCopied("nim");
                  setTimeout(() => setCopied(null), 1200);
                }}
              />
              <DataChip
                label="Password"
                value={passValue}
                color="secondary"
                copyHint={copied === "pass" ? "Disalin!" : "Salin Password"}
                justCopied={copied === "pass"}
                onCopied={() => {
                  setCopied("pass");
                  setTimeout(() => setCopied(null), 1200);
                }}
              />
            </div>

            <Divider className="my-3" />

            {/* ==== No. WA dengan logo ==== */}
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-foreground-500">No. WA</span>
              {data.noWa ? (
                <div className="flex items-center gap-2">
                  <a
                    href={buildWaLink(data.noWa, data.namaCustomer) || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium hover:underline text-emerald-600 dark:text-emerald-400"
                  >
                    {/* Logo WA hijau */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-[#25D366]"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.113.551 4.174 1.598 5.986L0 24l6.227-1.634A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zM12 22a9.93 9.93 0 01-5.091-1.387l-.364-.217-3.694.97.987-3.649-.238-.374A9.94 9.94 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm5.094-7.256c-.273-.137-1.616-.797-1.867-.887-.251-.09-.434-.137-.616.137-.182.273-.707.887-.866 1.07-.159.182-.318.205-.591.068-.273-.137-1.154-.425-2.197-1.352-.812-.724-1.361-1.618-1.52-1.891-.159-.273-.017-.421.12-.558.123-.123.273-.318.41-.477.137-.159.182-.273.273-.455.091-.182.046-.341-.023-.477-.068-.137-.616-1.489-.844-2.043-.228-.545-.457-.47-.616-.479l-.525-.009c-.182 0-.477.068-.727.341-.25.273-.955.933-.955 2.273s.977 2.637 1.113 2.818c.137.182 1.923 2.935 4.655 4.113.651.282 1.159.45 1.555.575.653.207 1.246.178 1.716.108.523-.078 1.616-.659 1.844-1.296.228-.637.228-1.182.159-1.296-.068-.114-.25-.182-.523-.319z" />
                    </svg>
                    {data.noWa}
                  </a>

                  <Tooltip content={copied === "wa" ? "Disalin!" : "Salin nomor"}>
                    <Button isIconOnly size="sm" variant="light" onPress={copyWa}>
                      <Copy className="h-4 w-4 text-foreground" />
                    </Button>
                  </Tooltip>
                </div>
              ) : (
                <span className="font-medium">—</span>
              )}
            </div>

            <Row label="Dibuat" value={createdAtLabel} />
          </CardBody>
        </Card>

        {/* Card Ringkasan Tagihan */}
        {isOwner && showBilling && (
          <Card className="overflow-hidden border border-default-200 dark:border-neutral-800 bg-content1 dark:bg-neutral-900 shadow-md">
            <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500" />
            <CardHeader>
              <div className="text-lg font-semibold text-foreground">
                Ringkasan Tagihan
              </div>
            </CardHeader>
            <CardBody>
              <Row label="Total Bayar" value={fmtRp(total)} className="text-primary" />
              <Row label="Sudah Bayar" value={fmtRp(sudah)} className="text-success" />
              <Row label="Sisa Bayar" value={fmtRp(sisa)} className="text-danger" />

              <div className="mt-3">
                <Progress
                  aria-label="Progress pembayaran"
                  value={progress}
                  className="w-full"
                  color={progress >= 100 ? "success" : progress > 0 ? "primary" : "default"}
                />
                <div className="mt-1 text-right text-xs text-foreground-500">
                  {progress.toFixed(0)}%
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {isOwner && (
        <CustomerUpdateModal
          open={showUpdate}
          onOpenChange={setShowUpdate}
          data={data}
          onUpdated={onUpdated}
        />
      )}
    </>
  );
}
