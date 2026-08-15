import { useState } from "react";
import { Button, Input } from "@heroui/react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  UserPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import WorkspacePageHeader from "../../components/common/WorkspacePageHeader";
import { useApi } from "../../hooks/useApi";
import { registerUser, type RegisterUserBody } from "../../services/users.service";
import { closeAlert, showApiError, showLoading, showSuccess } from "../../utils/alert";

type FieldErrors = Record<string, string>;

type AppError = Error & {
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
};

function isAppError(error: unknown): error is AppError {
  return typeof error === "object" && error !== null && "message" in error;
}

export default function RegisterUser() {
  const api = useApi();
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterUserBody>({
    username: "",
    password: "",
    namaLengkap: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});
    setLoading(true);

    try {
      showLoading("Membuat akun user...");
      await registerUser(api, {
        namaLengkap: form.namaLengkap.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });

      closeAlert();
      await showSuccess(
        "Akun user berhasil dibuat",
        `${form.namaLengkap.trim()} sekarang dapat login dengan username @${form.username.trim().toLowerCase()}.`,
      );
      navigate("/users", { replace: true });
    } catch (error) {
      let message = "Gagal mendaftarkan user.";
      const fields: FieldErrors = {};

      if (isAppError(error)) {
        message = error.message || message;

        for (const item of error.errors ?? []) {
          if (item.field && item.message) {
            fields[item.field] = item.message;
          }
        }
      }

      setErrorMsg(message);
      setFieldErrors(fields);
      closeAlert();
      await showApiError(error);
    } finally {
      setLoading(false);
    }
  }

  const inputClasses = {
    inputWrapper:
      "min-h-12 rounded-xl border border-default-200 bg-default-50/70 shadow-none transition-colors data-[hover=true]:border-primary/40 group-data-[focus=true]:border-primary group-data-[focus=true]:bg-content1",
    label: "font-semibold text-foreground-600",
    input: "text-foreground placeholder:text-foreground-300",
    description: "text-xs text-foreground-400",
    errorMessage: "text-xs",
  };

  return (
    <div data-workspace-page className="app-page-shell">
      <WorkspacePageHeader
        eyebrow="ARTECH • User management"
        title="Tambah pengguna baru"
        description="Buat akun kerja baru dan hubungkan pengguna dengan absensi, aktivitas, serta payroll."
        icon={UserPlus}
        actions={
          <Button
            as={Link}
            to="/users"
            variant="flat"
            className="min-h-10 rounded-xl border border-white/15 bg-white/10 font-semibold text-white hover:bg-white/15"
            startContent={<ArrowLeft className="h-4 w-4" />}
          >
            Daftar user
          </Button>
        }
        metrics={[
          {
            label: "Role akun",
            value: "USER",
            icon: ShieldCheck,
            tone: "cyan",
          },
          {
            label: "Status awal",
            value: "Aktif",
            icon: CheckCircle2,
            tone: "emerald",
          },
          {
            label: "Keamanan",
            value: "Password wajib",
            icon: Lock,
            tone: "violet",
          },
        ]}
      />

      <section className="overflow-hidden rounded-[26px] border border-default-200/80 bg-content1 shadow-[0_16px_45px_rgba(15,23,42,.08)]">
        <form onSubmit={onSubmit}>
          <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="px-5 py-7 sm:px-8 sm:py-8">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Informasi akun
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                  Identitas pengguna
                </h2>
                <p className="mt-1 text-sm leading-6 text-foreground-500">
                  Isi nama, username, dan password awal untuk pengguna.
                </p>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/25 dark:bg-danger-500/10 dark:text-danger-300"
                >
                  <p className="font-semibold">Akun belum dapat dibuat.</p>
                  <p className="mt-1 leading-6">{errorMsg}</p>
                </div>
              )}

              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Nama lengkap"
                    labelPlacement="outside"
                    placeholder="Adhi"
                    autoComplete="name"
                    value={form.namaLengkap}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, namaLengkap: value }))
                    }
                    isInvalid={Boolean(fieldErrors.namaLengkap)}
                    errorMessage={fieldErrors.namaLengkap}
                    startContent={<UserCircle2 className="h-4 w-4 text-foreground-400" />}
                    classNames={inputClasses}
                    isRequired
                  />

                  <Input
                    label="Username"
                    labelPlacement="outside"
                    placeholder="adhi"
                    description="Gunakan huruf kecil tanpa spasi."
                    autoComplete="username"
                    value={form.username}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        username: value.toLowerCase().replace(/\s/g, ""),
                      }))
                    }
                    isInvalid={Boolean(fieldErrors.username)}
                    errorMessage={fieldErrors.username}
                    startContent={<ShieldCheck className="h-4 w-4 text-foreground-400" />}
                    classNames={inputClasses}
                    isRequired
                  />
                </div>

                <Input
                  label="Password awal"
                  labelPlacement="outside"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  description="Pengguna dapat mengganti password setelah berhasil login."
                  autoComplete="new-password"
                  value={form.password}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, password: value }))
                  }
                  isInvalid={Boolean(fieldErrors.password)}
                  errorMessage={fieldErrors.password}
                  startContent={<Lock className="h-4 w-4 text-foreground-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="grid h-9 w-9 place-items-center rounded-lg text-foreground-400 transition hover:bg-default-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  classNames={inputClasses}
                  isRequired
                />
              </div>
            </div>

            <aside className="border-t border-default-200/70 bg-default-50/55 px-5 py-7 sm:px-8 lg:border-l lg:border-t-0 lg:px-6 lg:py-8">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>

              <h3 className="mt-4 font-bold text-foreground">Setelah akun dibuat</h3>
              <p className="mt-1 text-xs leading-5 text-foreground-500">
                Akun langsung tersedia pada daftar pengguna dan siap dikonfigurasi.
              </p>

              <div className="mt-5 space-y-4">
                {[
                  "Role awal ditetapkan sebagai USER.",
                  "Terhubung dengan absensi dan payroll.",
                  "Hak akses tambahan diatur dari detail user.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <p className="text-xs leading-5 text-foreground-600">{item}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-default-200/70 bg-content1 px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
            <Button
              as={Link}
              to="/users"
              variant="flat"
              className="min-h-11 rounded-xl px-6 font-semibold"
            >
              Batal
            </Button>

            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              isDisabled={loading}
              className="min-h-11 rounded-xl px-6 font-semibold shadow-sm"
              startContent={!loading ? <KeyRound className="h-4 w-4" /> : undefined}
            >
              Buat akun user
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
