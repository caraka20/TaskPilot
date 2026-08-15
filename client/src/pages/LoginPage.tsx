import { useEffect, useState, type FormEvent } from "react";
import { Button, Card, CardBody, Chip, Input } from "@heroui/react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useApi } from "../hooks/useApi";
import { login as loginService } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { useThemeStore } from "../store/theme.store";

type FieldErrors = Record<string, string>;
type AppError = Error & {
  code?: string;
  errors?: Array<{ field: string; message: string }>;
};
type LoginLocationState = {
  from?: { pathname?: string; search?: string };
};

function isAppError(error: unknown): error is AppError {
  return typeof error === "object" && error !== null && "message" in error;
}

export default function LoginPage() {
  const api = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, setToken, setUsername, setRole, setCanViewCustomerBilling, setAvatarUrl } = useAuthStore();
  const { dark, toggle } = useThemeStore();

  const [username, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const state = location.state as LoginLocationState | null;
  const fromPath = state?.from?.pathname;
  const destination =
    fromPath && fromPath !== "/login"
      ? `${fromPath}${state?.from?.search ?? ""}`
      : "/dashboard";

  useEffect(() => {
    if (token) navigate(destination, { replace: true });
  }, [destination, navigate, token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    setErrorCode(undefined);
    setFieldErrors({});

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setErrorMsg("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginService(api, cleanUsername, password);
      setToken(response.token);
      setUsername(response.user?.username ?? cleanUsername);
      setRole(response.user?.role ?? "");
      setCanViewCustomerBilling(Boolean(response.user?.canViewCustomerBilling));
      setAvatarUrl(response.user?.avatarUrl ?? "");
      navigate(destination, { replace: true });
    } catch (error: unknown) {
      let message = "Login gagal. Periksa kembali akun Anda.";
      let code: string | undefined;
      const nextFieldErrors: FieldErrors = {};

      if (isAppError(error)) {
        message = error.message || message;
        code = error.code;
        if (Array.isArray(error.errors)) {
          for (const item of error.errors) {
            if (item?.field && item?.message) {
              nextFieldErrors[item.field] = item.message;
            }
          }
        }
      }

      setErrorMsg(message);
      setErrorCode(code);
      setFieldErrors(nextFieldErrors);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/15" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/10" />

      <button
        type="button"
        onClick={toggle}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
        aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"}
      >
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <main className="relative mx-auto grid min-h-[calc(100dvh-3rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_.92fr]">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-3 rounded-2xl border border-indigo-200/70 bg-white/70 px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-500/20 dark:bg-slate-900/60 dark:text-indigo-300">
            <Sparkles className="h-5 w-5" />
            Ruang kerja yang rapi dan terpusat
          </div>
          <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">
            Kelola pekerjaan lebih tenang bersama
            <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">
              TaskPilot.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Pantau customer, Tuton, jam kerja, dan pembayaran dalam satu dashboard yang mudah dipahami.
          </p>

          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            {[
              "Data operasional tersusun",
              "Akses sesuai peran",
              "Nyaman di desktop dan HP",
              "Ringkasan progres real-time",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md pt-14 lg:pt-0">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img alt="" aria-hidden="true" className="h-12 w-12 drop-shadow-lg" src="/brand/taskpilot-mark.svg" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">TaskPilot</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Masuk ke ruang kerja Anda</p>
            </div>
          </div>

          <Card className="border border-white/60 bg-white/90 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90 dark:shadow-black/30">
            <CardBody className="p-5 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Selamat datang</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Gunakan akun TaskPilot untuk melanjutkan.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div
                  className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>Login belum berhasil</strong>
                    {errorCode && <Chip size="sm" color="danger" variant="flat">{errorCode}</Chip>}
                  </div>
                  <p className="mt-1">{errorMsg}</p>
                  {Object.keys(fieldErrors).length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 ps-5">
                      {Object.entries(fieldErrors).map(([field, message]) => (
                        <li key={field}>{message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <form className="mt-7 grid gap-4" onSubmit={onSubmit} noValidate>
                <Input
                  label="Username"
                  placeholder="Masukkan username"
                  value={username}
                  onValueChange={(value) => {
                    setUsernameInput(value);
                    if (fieldErrors.username) setFieldErrors((current) => ({ ...current, username: "" }));
                  }}
                  isInvalid={Boolean(fieldErrors.username)}
                  errorMessage={fieldErrors.username}
                  autoComplete="username"
                  autoCapitalize="none"
                  variant="bordered"
                  size="lg"
                  autoFocus
                />
                <Input
                  label="Password"
                  placeholder="Masukkan password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onValueChange={(value) => {
                    setPassword(value);
                    if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: "" }));
                  }}
                  isInvalid={Boolean(fieldErrors.password)}
                  errorMessage={fieldErrors.password}
                  autoComplete="current-password"
                  variant="bordered"
                  size="lg"
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />
                <Button
                  color="primary"
                  type="submit"
                  isLoading={loading}
                  className="mt-2 min-h-12 bg-gradient-to-r from-indigo-600 to-sky-500 text-base font-bold text-white shadow-lg shadow-indigo-500/20"
                >
                  Masuk ke TaskPilot
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Sesi Anda dilindungi dan hanya digunakan untuk akses aplikasi.
              </div>
            </CardBody>
          </Card>
        </section>
      </main>
    </div>
  );
}
