import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@heroui/react";
import { CalendarDays, GraduationCap, MessageCircle, PencilLine } from "lucide-react";
import type { CustomerDetail } from "../../../utils/customer";
import { useAuthStore } from "../../../store/auth.store";
import CustomerUpdateModal from "./CustomerUpdateModal";

function normalizePhoneForWa(raw?: string): string | null {
  if (!raw) return null;
  let digits = (raw.match(/\d+/g) || []).join("");
  if (!digits) return null;
  while (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits.length >= 8 ? `62${digits}` : digits;
}

function formatCreatedAt(input: string | number | Date): string {
  return new Date(input).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function InfoItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-default-50 px-4 py-3.5 dark:bg-default-100/45">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-content1 text-primary shadow-sm">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-foreground-400">{label}</p>
        <div className="mt-1 truncate text-sm font-bold text-foreground">{children}</div>
      </div>
    </div>
  );
}

type Props = {
  data: CustomerDetail;
  password?: string;
  onUpdated?: () => void;
};

export default function CustomerDetailCard({ data, onUpdated }: Props) {
  const [showUpdate, setShowUpdate] = useState(false);
  const role = useAuthStore((state) => state.role);
  const isOwner = role === "OWNER";
  const createdAtLabel = useMemo(() => formatCreatedAt(data.createdAt), [data.createdAt]);
  const phone = normalizePhoneForWa(data.noWa);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <InfoItem icon={<GraduationCap className="h-[18px] w-[18px]" />} label="Program studi">
          {data.jurusan || "Belum diisi"}
        </InfoItem>
        <InfoItem icon={<MessageCircle className="h-[18px] w-[18px]" />} label="WhatsApp">
          {data.noWa && phone ? (
            <a className="text-emerald-600 hover:underline dark:text-emerald-400" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
              {data.noWa}
            </a>
          ) : "Belum diisi"}
        </InfoItem>
        <InfoItem icon={<CalendarDays className="h-[18px] w-[18px]" />} label="Terdaftar">
          {createdAtLabel}
        </InfoItem>
      </div>

      {isOwner ? (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="flat"
            color="primary"
            className="min-h-11 w-full font-bold sm:w-auto"
            startContent={<PencilLine className="h-4 w-4" />}
            onPress={() => setShowUpdate(true)}
          >
            Edit identitas customer
          </Button>
        </div>
      ) : null}

      {isOwner ? (
        <CustomerUpdateModal open={showUpdate} onOpenChange={setShowUpdate} data={data} onUpdated={onUpdated} />
      ) : null}
    </>
  );
}
