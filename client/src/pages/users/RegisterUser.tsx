// src/pages/users/RegisterUser.tsx
import { useState } from "react";
import {
  Card, CardBody, CardHeader, CardFooter,
  Input, Button, Chip, Divider
} from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { registerUser, type RegisterUserBody } from "../../services/users.service";
import {
  UserPlus, UserCircle2, Lock, ShieldCheck, Eye, EyeOff, X
} from "lucide-react";
import { useThemeStore } from "../../store/theme.store";

type FieldErrors = Record<string, string>;
type AppError = Error & { code?: string; errors?: Array<{ field: string; message: string }> };
const isAppError = (e: unknown): e is AppError =>
  typeof e === "object" && e !== null && "message" in e;

export default function RegisterUser() {
  const api = useApi();
  const navigate = useNavigate();
  const { dark } = useThemeStore();

  const [form, setForm] = useState<RegisterUserBody>({
    username: "",
    password: "",
    namaLengkap: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCode(undefined);
    setFieldErrors({});
    setLoading(true);
    try {
      await registerUser(api, form);
      navigate("/users", { replace: true });
    } catch (err) {
      let msg = "Gagal mendaftarkan user";
      let code: string | undefined;
      const f: FieldErrors = {};
      if (isAppError(err)) {
        msg = err.message || msg;
        code = err.code;
        for (const fe of err.errors ?? []) {
          if (fe.field && fe.message) f[fe.field] = fe.message;
        }
      }
      setErrorMsg(msg);
      setErrorCode(code);
      setFieldErrors(f);
    } finally {
      setLoading(false);
    }
  }

  /* ===== Styling helpers ===== */
  const cardBg = dark ? "rgba(15,23,42,0.82)" : "rgba(248,250,252,0.95)";
  const cardBorder = dark ? "#334155" : "#e5e7eb";

  const inputWrapper =
    "!bg-white/95 !border !border-slate-200 " +
    "data-[hover=true]:!bg-white/95 data-[hover=true]:!border-indigo-300 " +
    "dark:!bg-[#0f1a2e] dark:!border-slate-600 " +
    "dark:data-[hover=true]:!bg-[#0f1a2e] dark:data-[hover=true]:!border-sky-400/60 " +
    "focus-within:!border-indigo-500 dark:focus-within:!border-sky-400 " +
    "rounded-xl transition-colors";

  const inputText =
    "!text-slate-900 dark:!text-slate-100 " +
    "placeholder:text-slate-500 dark:placeholder:text-slate-400";

  // Label selalu muted/gelap di kedua mode
  const labelMuted = "!text-slate-700 dark:!text-slate-400";

  return (
    <div className="relative">
      {/* Dekor halus */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl
                        bg-gradient-to-br from-indigo-400/20 via-sky-400/15 to-emerald-400/15
                        dark:from-indigo-500/15 dark:via-sky-500/10 dark:to-emerald-500/10" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full blur-3xl
                        bg-gradient-to-tr from-rose-400/10 via-fuchsia-400/10 to-indigo-400/10
                        dark:from-rose-500/10 dark:via-fuchsia-500/10 dark:to-indigo-500/10" />
      </div>

      {/* Card form */}
      <div className="min-h-[72vh] grid place-items-center px-3">
        <Card
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
          className="relative w-full max-w-xl rounded-3xl overflow-hidden backdrop-blur border
                     ring-1 ring-black/5 dark:ring-white/5
                     shadow-[0_16px_60px_-12px_rgba(2,6,23,0.25)]"
        >
          {/* Tombol X pojok kanan atas */}
          <div className="absolute right-3 top-3 z-20">
            <Button
              isIconOnly
              type="button"
              variant="light"
              color="danger"
              className="rounded-xl border border-danger/30 bg-danger/10
                         hover:bg-danger/20 dark:border-danger/25"
              onPress={() => navigate("/users")}
              onClick={() => navigate("/users")}
              aria-label="Kembali"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <CardHeader className="px-6 pt-6">
            <div className="flex w-full items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl
                              bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500
                              text-white shadow-sm">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight">Register User</h1>
                <p className="text-xs text-foreground-500">
                  Buat akun baru untuk tim kamu. Role default: <span className="font-medium">USER</span>.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardBody className="px-6 pb-2">
            {errorMsg && (
              <div
                className="mb-4 rounded-2xl border border-danger/30 dark:border-danger/40
                           bg-danger/10 dark:bg-danger/15 p-3
                           text-danger-600 dark:text-danger-400"
                role="alert"
              >
                <div className="flex items-center gap-2">
                  <strong>Error:</strong>
                  <span>{errorMsg}</span>
                  {errorCode && <Chip size="sm" color="danger" variant="flat">{errorCode}</Chip>}
                </div>
                {Object.keys(fieldErrors).length > 0 && (
                  <ul className="mt-2 list-disc ps-5 text-sm">
                    {Object.entries(fieldErrors).map(([k, v]) => (
                      <li key={k}><span className="font-medium">{k}</span>: {v}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <form className="grid gap-4" onSubmit={onSubmit}>
              <Input
                variant="bordered"
                size="lg"
                label="Nama Lengkap"
                placeholder="adhi"
                value={form.namaLengkap}
                onChange={(e) => setForm((s) => ({ ...s, namaLengkap: e.target.value }))}
                isInvalid={!!fieldErrors.namaLengkap}
                errorMessage={fieldErrors.namaLengkap}
                startContent={<UserCircle2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                classNames={{ inputWrapper, input: inputText, label: labelMuted }}
              />

              <Input
                variant="bordered"
                size="lg"
                label="Username"
                placeholder="mis. adhi"
                value={form.username}
                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                isInvalid={!!fieldErrors.username}
                errorMessage={fieldErrors.username}
                startContent={<ShieldCheck className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                classNames={{ inputWrapper, input: inputText, label: labelMuted }}
              />

              <Input
                variant="bordered"
                size="lg"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="minimal 8 karakter"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                isInvalid={!!fieldErrors.password}
                errorMessage={fieldErrors.password}
                startContent={<Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="outline-none hover:opacity-80"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    )}
                  </button>
                }
                classNames={{ inputWrapper, input: inputText, label: labelMuted }}
              />

              <Button
                type="submit"
                color="primary"
                size="lg"
                radius="lg"
                isLoading={loading}
                className="mt-1 font-semibold"
                startContent={<UserPlus className="h-5 w-5" />}
              >
                Simpan User
              </Button>
            </form>
          </CardBody>

          <CardFooter className="px-6 pb-6">
            <div className="w-full">
              <Divider className="mb-3" />
              <p className="text-xs text-foreground-500">
                Dengan membuat akun, kamu menyetujui kebijakan internal dan tanggung jawab akses data.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
