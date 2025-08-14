import { useState } from "react";
import { Card, CardBody, Input, Button, Link, Spacer, Chip } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useAuthStore } from "../store/auth.store";
import { login as loginSvc } from "../services/auth.service";

type FieldErrors = Record<string, string>;

type AppError = Error & { code?: string; errors?: Array<{ field: string; message: string }>; };
function isAppError(e: unknown): e is AppError { return typeof e === "object" && e !== null && "message" in e; }

export default function LoginPage() {
  const api = useApi();
  const navigate = useNavigate();
  const { setToken, setUsername, setRole } = useAuthStore();

  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCode(undefined);
    setFieldErrors({});

    if (!username || !password) {
      setErrorMsg("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await loginSvc(api, username, password);
      // ✅ Simpan semua yang diperlukan supaya setelah refresh tetap OWNER
      setToken(res.token);
      setUsername(res.user?.username ?? username);
      setRole(res.user?.role ?? "");
      navigate("/customers", { replace: true });
    } catch (err: unknown) {
      let msg = "Login gagal";
      let code: string | undefined;
      const fErrs: FieldErrors = {};

      if (isAppError(err)) {
        msg = err.message || msg;
        code = err.code;
        if (Array.isArray(err.errors)) {
          for (const item of err.errors) {
            if (item?.field && item?.message) fErrs[item.field] = item.message;
          }
        }
      }
      setErrorMsg(msg);
      setErrorCode(code);
      setFieldErrors(fErrs);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center">
      <Card className="w-full max-w-md">
        <CardBody className="p-6">
          <h1 className="text-2xl font-semibold">Masuk</h1>
          <Spacer y={4} />

          {errorMsg && (
            <div className="mb-4 rounded-large border border-danger/30 bg-danger/10 p-3 text-danger-600" role="alert">
              <div className="flex items-center gap-2">
                <strong className="tracking-tight">Error:</strong>
                <span>{errorMsg}</span>
                {errorCode && (
                  <Chip size="sm" color="danger" variant="flat">{errorCode}</Chip>
                )}
              </div>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="mt-2 list-disc ps-5 text-sm">
                  {Object.entries(fieldErrors).map(([f, m]) => (
                    <li key={f}><span className="font-medium">{f}</span>: {m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form className="grid gap-4" onSubmit={onSubmit}>
            <Input label="Username" value={username} onChange={(e) => { setU(e.target.value); if (fieldErrors.username) setFieldErrors((s) => ({ ...s, username: "" })); }} isInvalid={!!fieldErrors.username} errorMessage={fieldErrors.username} autoFocus />
            <Input label="Password" type="password" value={password} onChange={(e) => { setP(e.target.value); if (fieldErrors.password) setFieldErrors((s) => ({ ...s, password: "" })); }} isInvalid={!!fieldErrors.password} errorMessage={fieldErrors.password} />
            <Button color="primary" type="submit" isLoading={loading}>Masuk</Button>
          </form>

          <Spacer y={2} />
          <div className="text-sm text-foreground-500">
            Ganti Base URL / Token manual? {" "}
            <Link href="/settings" underline="hover" color="primary">Buka Settings</Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
