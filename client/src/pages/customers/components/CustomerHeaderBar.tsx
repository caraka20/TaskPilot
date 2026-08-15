import { useState } from "react";
import { Button, Tooltip } from "@heroui/react";
import {
  BookOpen,
  Check,
  Copy,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Layers3,
  MessageCircle,
  PencilLine,
  UserRound,
} from "lucide-react";
import WorkspacePageHeader from "../../../components/common/WorkspacePageHeader";
import type { CustomerDetail as DetailType } from "../../../utils/customer";
import type { CustomerLayanan } from "../../../utils/customer";
import { useAuthStore } from "../../../store/auth.store";
import CustomerUpdateModal from "./CustomerUpdateModal";

type Props = {
  data: DetailType;
  jenisNormalized: string;
  isKarilLike: boolean;
  karilLabel: "KARIL";
  showTutonMatrix: boolean;
  singleCourseId: number | null;
  password?: string;
  onUpdated?: () => void;
};

function normalizePhoneForWa(raw?: string): string | null {
  if (!raw) return null;
  let digits = (raw.match(/\d+/g) || []).join("");
  if (!digits) return null;
  while (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits.length >= 8 ? `62${digits}` : null;
}

function formatCreatedAt(input?: string | number | Date): string {
  if (!input) return "Tanggal pendaftaran belum tersedia";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Tanggal pendaftaran belum tersedia";
  return `Terdaftar ${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;
}

function CredentialValue({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const display = !value ? "—" : secret && !visible ? "•".repeat(Math.min(10, value.length)) : value;

  async function copyValue() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="min-w-0 truncate font-mono text-sm font-bold text-white">{display}</span>
      {secret ? (
        <Tooltip content={visible ? "Sembunyikan password" : "Tampilkan password"}>
          <Button
            isIconOnly
            type="button"
            variant="light"
            aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
            className="h-7 min-h-7 w-7 min-w-7 shrink-0 text-slate-300 hover:bg-white/10 hover:text-white"
            onPress={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </Tooltip>
      ) : null}
      <Tooltip content={copied ? "Sudah disalin" : `Salin ${label}`}>
        <Button
          isIconOnly
          type="button"
          variant="light"
          aria-label={`Salin ${label}`}
          isDisabled={!value}
          className="h-7 min-h-7 w-7 min-w-7 shrink-0 text-slate-300 hover:bg-white/10 hover:text-white"
          onPress={copyValue}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
        </Button>
      </Tooltip>
    </div>
  );
}

export default function CustomerHeaderBar({
  data,
  password,
  jenisNormalized,
  isKarilLike,
  showTutonMatrix,
  onUpdated,
}: Props) {
  const [showUpdate, setShowUpdate] = useState(false);
  const role = useAuthStore((state) => state.role);
  const isOwner = role === "OWNER";
  const passValue = typeof data.password === "string" ? data.password : password ?? "";
  const phone = normalizePhoneForWa(data.noWa);
  const registeredLabel = formatCreatedAt(data.createdAt);
  const programLabel = data.jurusan?.trim() || "Program studi belum diisi";
  const services: CustomerLayanan[] = data.layanan?.length
    ? data.layanan
    : [
        ...(showTutonMatrix || jenisNormalized === "TUTON" ? ["TUTON" as const] : []),
        ...(isKarilLike || jenisNormalized === "KARIL" ? ["KARIL" as const] : []),
      ];
  const serviceLabels: Record<CustomerLayanan, string> = {
    TUTON: "Tuton",
    KARIL: "Karya Ilmiah",
    METODE_PENELITIAN: "Metode Penelitian",
  };
  const serviceSummary = services.length
    ? services.map((service) => serviceLabels[service]).join(" • ")
    : "Belum ada layanan";

  return (
    <>
      <WorkspacePageHeader
        eyebrow="ARTECH • Customer workspace"
        title={data.namaCustomer}
        description={`${programLabel} • ${registeredLabel}`}
        icon={UserRound}
        actions={(
          <div className="flex items-center gap-2">
            {data.noWa && phone ? (
              <Button
                as="a"
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noreferrer"
                variant="flat"
                className="min-h-10 rounded-xl border border-white/15 bg-white/10 px-4 font-bold text-white backdrop-blur data-[hover=true]:bg-white/15"
                startContent={<MessageCircle className="h-4 w-4 text-emerald-200" />}
              >
                {data.noWa}
              </Button>
            ) : null}
            {isOwner ? (
              <Button
                type="button"
                variant="flat"
                className="min-h-10 rounded-xl border border-white/15 bg-white/10 px-4 font-bold text-white backdrop-blur data-[hover=true]:bg-white/15"
                startContent={<PencilLine className="h-4 w-4 text-cyan-200" />}
                onPress={() => setShowUpdate(true)}
              >
                Edit customer
              </Button>
            ) : null}
          </div>
        )}
        metrics={[
          {
            label: "NIM",
            value: <CredentialValue label="NIM" value={String(data.nim ?? "")} />,
            icon: IdCard,
            tone: "cyan",
          },
          {
            label: "Password",
            value: <CredentialValue label="Password" value={passValue} secret />,
            icon: KeyRound,
            tone: "emerald",
          },
          {
            label: "Layanan aktif",
            value: <span className="block truncate">{serviceSummary}</span>,
            icon: services.includes("TUTON") ? BookOpen : Layers3,
            tone: "violet",
          },
        ]}
      />

      {isOwner ? (
        <CustomerUpdateModal
          open={showUpdate}
          onOpenChange={setShowUpdate}
          data={data}
          onUpdated={onUpdated}
        />
      ) : null}
    </>
  );
}
