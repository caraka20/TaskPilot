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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">
            Users
          </h1>
        </div>
        <p className="text-sm text-foreground-500">Ringkasan jam kerja & gaji per pengguna</p>
      </div>

      <div className="flex items-center gap-2">
        <Chip size="sm" variant="flat" color="success" className="shadow-sm">
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" /> Aktif:
          </span>
          &nbsp;<span className="font-semibold">{countAktif}</span>
        </Chip>
        <Chip size="sm" variant="flat" color="warning" className="shadow-sm">
          Jeda: <span className="font-semibold">&nbsp;{countJeda}</span>
        </Chip>

        {role === "OWNER" && (
          <Button
            as={Link}
            to="/users/register"
            color="primary"
            className="shadow-md"
            startContent={<UserPlus className="h-4 w-4" />}
          >
            Register User
          </Button>
        )}
      </div>
    </div>
  );
}
