import { Card, CardBody, Chip } from "@heroui/react";
import { Clock, Wallet } from "lucide-react";

type Props = {
  namaLengkap: string;
  username: string;
  role: string; // "USER" | "OWNER" | string
  status?: "AKTIF" | "JEDA" | "OFF" | "SELESAI";
  totalJam: string;  // display-ready (mis. "18.6 jam")
  totalGaji: string; // display-ready (mis. "Rp. 217.700")
};

function initials(nameOrUser: string) {
  const s = (nameOrUser || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function roleChipColor(role: string): "primary" | "secondary" | "default" {
  const r = (role || "").toUpperCase();
  if (r === "OWNER") return "secondary";
  if (r === "USER") return "primary";
  return "default";
}

function statusChip(
  status?: Props["status"]
): { color: "success" | "warning" | "secondary" | "default"; label: string; dot: string } {
  switch (status) {
    case "AKTIF":
      return { color: "success", label: "AKTIF", dot: "bg-emerald-500" };
    case "JEDA":
      return { color: "warning", label: "JEDA", dot: "bg-amber-500" };
    case "SELESAI":
      return { color: "secondary", label: "SELESAI", dot: "bg-violet-500" };
    default:
      return { color: "default", label: "OFF", dot: "bg-gray-300" };
  }
}

export default function UserIdentityCard({
  namaLengkap,
  username,
  role,
  status,
  totalJam,
  totalGaji,
}: Props) {
  const s = statusChip(status);

  return (
    <div className="relative group">
      {/* Aura lembut bergradasi di belakang card */}
      <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-r from-indigo-400/15 via-fuchsia-400/15 to-emerald-400/15 blur-2xl opacity-70 group-hover:opacity-90 transition-opacity" />

      {/* Garis tepi gradasi tipis */}
      <div className="p-[1.5px] rounded-[26px] bg-gradient-to-r from-indigo-500/30 via-fuchsia-500/30 to-emerald-500/30">
        <Card
          shadow="sm"
          className="rounded-[24px] border border-default-200/70 overflow-hidden bg-background/90 backdrop-blur-sm"
        >
          {/* dekorasi radial haluuus */}
          <div className="pointer-events-none absolute -top-16 -right-20 h-40 w-40 rounded-full bg-gradient-to-br from-fuchsia-400/15 to-indigo-400/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-24 h-44 w-44 rounded-full bg-gradient-to-tr from-emerald-400/15 to-cyan-400/15 blur-2xl" />

          <CardBody className="relative p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar dengan cincin gradient */}
              <div className="shrink-0">
                <div className="p-[2px] rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-emerald-500">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-[14px] grid place-items-center bg-background text-foreground font-semibold text-lg shadow-sm">
                    {initials(namaLengkap || username)}
                  </div>
                </div>
              </div>

              {/* Identitas + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0">
                    <div className="text-lg sm:text-xl font-semibold leading-tight truncate">
                      {namaLengkap || username}
                    </div>
                    <div className="text-foreground-500 text-xs font-mono truncate">
                      @{username}
                    </div>
                  </div>

                  <Chip size="sm" variant="flat" color={roleChipColor(role)}>
                    {role}
                  </Chip>

                  <Chip size="sm" variant="flat" color={s.color}>
                    <span className="flex items-center gap-1.5">
                      <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </Chip>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-default-100 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 backdrop-blur-sm p-3.5 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-content2 text-foreground">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-foreground-500">Total Jam (semua)</div>
                      <div className="text-base font-semibold truncate">{totalJam}</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-default-100 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 backdrop-blur-sm p-3.5 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-content2 text-foreground">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-foreground-500">Total Gaji (semua)</div>
                      <div className="text-base font-semibold truncate">{totalGaji}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
