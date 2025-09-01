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
} from "@heroui/react";
import type { CustomerDetail } from "../../../utils/customer";
import { fmtRp } from "../../../utils/customer";

type Props = {
  data: CustomerDetail;
  /** Opsional: override password jika tidak ada di data */
  password?: string;
  /** Tampilkan / sembunyikan Ringkasan Tagihan (OWNER=true, USER=false) */
  showBilling?: boolean;
};

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

/** Util: normalisasi nomor HP Indonesia jadi format wa.me */
function normalizePhoneForWa(raw?: string): string | null {
  if (!raw) return null;
  // ambil digit saja
  let digits = (raw.match(/\d+/g) || []).join("");
  if (!digits) return null;

  // buang leading 0 yang berlebihan
  if (digits.startsWith("00")) {
    // contoh 0062 -> 62
    while (digits.startsWith("00")) digits = digits.slice(2);
  }

  // +62, 62, 0
  if (digits.startsWith("62")) {
    return digits; // sudah benar
  }
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  // kalau sudah 8xxxxxxxxx (tanpa 0) asumsikan nomor lokal, tambahkan 62
  if (digits.length >= 8 && !digits.startsWith("1")) {
    return "62" + digits;
  }
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

/** Kartu highlight untuk NIM / Password */
function HighlightTile(props: {
  label: string;
  value: string;
  masked?: boolean;
  onToggleMask?: () => void;
  copyHint?: string;
  disabled?: boolean;
  onCopied?: () => void;
  justCopied?: boolean;   // ⬅ tetap dipakai
  copiedText?: string;    // ⬅ tetap dipakai
}) {
  const {
    label,
    value,
    masked,
    onToggleMask,
    copyHint = "Salin",
    disabled,
    onCopied,
    justCopied,
    copiedText = "Disalin!",
  } = props;

  const display =
    masked && value
      ? "•".repeat(Math.max(8, Math.min(16, value.length)))
      : value || "—";

  const copy = async () => {
    if (disabled || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      onCopied?.();
    } catch (e){console.log(e);
    }
  };

  return (
    <div className="relative min-w-[220px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="absolute inset-x-0 -top-px h-1 rounded-t-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />
      <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-slate-900">
          {display}
        </span>

        {onToggleMask && (
          <Tooltip content={masked ? "Tampilkan" : "Sembunyikan"}>
            <Button isIconOnly size="sm" variant="light" onPress={onToggleMask}>
              {masked ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
                  <path d="M9.88 4.62A10.73 10.73 0 0 1 12 5c7 0 11 7 11 7a18.6 18.6 0 0 1-4.24 4.69" />
                  <path d="M6.24 6.24A18.6 18.6 0 0 0 1 12s4 7 11 7a10.8 10.8 0 0 0 2.12-.22" />
                </svg>
              )}
            </Button>
          </Tooltip>
        )}

        {/* ⬇️ Toast-nya kini nempel ke tombol salin */}
        <div className="relative">
          {justCopied && (
            <div className="absolute right-0 -top-2 rounded-full bg-emerald-500/95 px-2.5 py-1
                            text-[11px] font-semibold text-white shadow-lg ring-1 ring-emerald-600/40">
              {copiedText}
            </div>
          )}
          <Tooltip content={copyHint}>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              isDisabled={disabled}
              onPress={copy}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <rect x="4" y="4" width="11" height="11" rx="2" />
              </svg>
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}


export default function CustomerDetailCard({ data, password, showBilling }: Props) {
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState<"nim" | "pass" | "wa" | null>(null);

  // password dari BE bisa di data.password; fallback ke prop password
  const passValue =
    typeof (data as any).password === "string"
      ? (data as any).password
      : password ?? "";

  const createdAt = useMemo(
    () => new Date(data.createdAt).toLocaleString("id-ID"),
    [data.createdAt]
  );

  const total = data.totalBayar ?? 0;
  const sudah = data.sudahBayar ?? 0;
  const sisa = data.sisaBayar ?? Math.max(total - sudah, 0);
  const progress = total > 0 ? Math.min(100, (sudah / total) * 100) : 0;

  const canShowBilling = !!showBilling;

  const waLink = buildWaLink(data.noWa, data.namaCustomer);
  const displayNoWa = data.noWa || "—";

  const copyWa = async () => {
    if (!data.noWa) return;
    try {
      await navigator.clipboard.writeText(data.noWa);
      setCopied("wa");
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* noop */
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-md">
      <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />
      <CardHeader className="flex flex-col gap-3 pt-4">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                {data.namaCustomer}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip size="sm" variant="flat" color="primary">
                TUTON: {data.tutonCourseCount ?? 0}
              </Chip>
              <Chip size="sm" variant="flat">
                {data.jurusan}
              </Chip>
              <Chip
                size="sm"
                variant="flat"
                color={data.hasKaril ? "success" : "default"}
              >
                KARIL: {data.hasKaril ? "Ya" : "Tidak"}
              </Chip>
              <Chip size="sm" variant="flat">
                {data.jenis}
              </Chip>
            </div>
          </div>

          {/* Highlight NIM & Password */}
          <div className="flex flex-wrap gap-3">
            <HighlightTile
              label="NIM"
              value={String(data.nim ?? "")}
              copyHint={copied === "nim" ? "Disalin!" : "Salin NIM"}
              onCopied={() => {
                setCopied("nim");
                setTimeout(() => setCopied(null), 1200);
              }}
              justCopied={copied === "nim"}
              copiedText="NIM disalin!"
            />
            <HighlightTile
              label="Password (E-Learning)"
              value={passValue}
              masked={!showPass}
              onToggleMask={() => setShowPass((s) => !s)}
              copyHint={copied === "pass" ? "Disalin!" : "Salin Password"}
              disabled={!passValue}
              onCopied={() => {
                setCopied("pass");
                setTimeout(() => setCopied(null), 1200);
              }}
              justCopied={copied === "pass"}
              copiedText="Password disalin!"
            />
          </div>
        </div>
      </CardHeader>

      <CardBody className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
        {/* Kolom kiri: Info akun */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-indigo-600">
            Info Akun
          </div>

          {/* No. WA dengan UX yang bisa diklik + tombol chat + salin */}
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-slate-500">No. WA</span>
            <div className="flex items-center gap-2">
              {waLink ? (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-600 hover:underline"
                  title="Buka WhatsApp"
                >
                  {displayNoWa}
                </a>
              ) : (
                <span className="font-medium">{displayNoWa}</span>
              )}

              {waLink && (
                <Tooltip content="Chat di WhatsApp">
                  <Button
                    as="a"
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    isIconOnly
                    size="sm"
                    variant="flat"
                    className="bg-emerald-50"
                  >
                    {/* WhatsApp icon */}
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="currentColor"
                    >
                      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.85a11.64 11.64 0 0 0 1.62 5.98L0 24l6.37-1.67a11.8 11.8 0 0 0 5.67 1.45h0c6.54 0 11.85-5.3 11.85-11.85 0-3.17-1.24-6.15-3.37-8.28Zm-8.48 18.3h0a9.8 9.8 0 0 1-4.95-1.36l-.35-.21-3.78 1 .99-3.69-.23-.38a9.84 9.84 0 0 1-1.5-5.23C2.22 6.4 6.4 2.22 11.86 2.22a9.62 9.62 0 0 1 6.83 2.83 9.62 9.62 0 0 1 2.83 6.83c0 5.46-4.18 9.74-9.48 9.9Zm5.44-7.35c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.18-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.46-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.53.08-.81.38-.27.3-1.06 1.04-1.06 2.53s1.08 2.93 1.23 3.13c.15.2 2.12 3.23 5.16 4.53.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.44.25-.7.25-1.3.18-1.44-.07-.15-.27-.23-.57-.38Z" />
                    </svg>
                  </Button>
                </Tooltip>
              )}

              <Tooltip content={copied === "wa" ? "Disalin!" : "Salin nomor"}>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={copyWa}
                  isDisabled={!data.noWa}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <rect x="4" y="4" width="11" height="11" rx="2" />
                  </svg>
                </Button>
              </Tooltip>
            </div>
          </div>

          <Row label="Jenis" value={data.jenis} />
          <Divider className="my-4" />
          <Row label="Dibuat" value={createdAt} />
        </div>

        {/* Kolom kanan: Ringkasan Tagihan (OWNER only) */}
        {canShowBilling && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-indigo-600">
              Ringkasan Tagihan
            </div>
            <Row label="Total Bayar" value={fmtRp(total)} />
            <Row label="Sudah Bayar" value={fmtRp(sudah)} />
            <Row label="Sisa Bayar" value={fmtRp(sisa)} />
            <div className="mt-3">
              <Progress
                aria-label="Progress pembayaran"
                value={progress}
                color={progress >= 100 ? "success" : progress > 0 ? "primary" : "default"}
                className="w-full"
              />
              <div className="mt-1 text-right text-xs text-slate-500">
                {progress.toFixed(0)}%
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
