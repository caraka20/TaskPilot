import { Button, Chip } from "@heroui/react";
import { Link } from "react-router-dom";
import { Users, UserPlus, Activity } from "lucide-react";

export default function UserListHeader({
  role,
  countAktif,
  countJeda,
}: {
  role: string;
  countAktif: number;
  countJeda: number;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary shadow-sm dark:bg-primary-100/15">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Pengguna
          </h1>
          <p className="mt-0.5 text-sm text-foreground-500">
            Ringkasan jam kerja dan gaji setiap pengguna
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            color="success"
            className="h-8 shadow-sm"
          >
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" /> Aktif
            </span>
            <span className="ml-1 font-bold">{countAktif}</span>
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            color="warning"
            className="h-8 shadow-sm"
          >
            Jeda <span className="ml-1 font-bold">{countJeda}</span>
          </Chip>
        </div>

        {role === "OWNER" && (
          <Button
            as={Link}
            to="/users/register"
            color="primary"
            className="h-11 w-full rounded-xl font-semibold shadow-sm min-[420px]:w-auto"
            startContent={<UserPlus className="h-4 w-4" />}
          >
            Tambah pengguna
          </Button>
        )}
      </div>
    </header>
  );
}
