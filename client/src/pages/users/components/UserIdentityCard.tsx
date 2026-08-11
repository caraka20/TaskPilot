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
    <Card className="relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-[linear-gradient(125deg,rgba(99,102,241,.075),transparent_42%)] shadow-[0_20px_55px_-40px_rgba(79,70,229,.5)] dark:border-indigo-400/15 dark:bg-[linear-gradient(125deg,rgba(129,140,248,.09),transparent_45%)]">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-indigo-500 via-cyan-500 to-emerald-400" aria-hidden />
          <CardBody className="relative p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar dengan cincin gradient */}
              <div className="shrink-0">
                <div className="rounded-2xl bg-indigo-50 p-1 dark:bg-indigo-500/15">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary font-bold text-white shadow-sm sm:h-16 sm:w-16">
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
                  <div className="flex items-center gap-3 rounded-2xl border border-default-200 bg-content2/60 p-3.5">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-foreground-500">Total Jam (semua)</div>
                      <div className="text-base font-semibold truncate">{totalJam}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-default-200 bg-content2/60 p-3.5">
                    <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
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
  );
}
