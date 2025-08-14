// src/pages/users/RegisterUser.tsx
import { useState } from "react";
import { Card, CardBody, Input, Button, Spacer, Chip } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { registerUser, type RegisterUserBody } from "../../services/users.service";
import BackButton from "../../components/common/BackButton";

type FieldErrors = Record<string, string>;
type AppError = Error & { code?: string; errors?: Array<{ field: string; message: string }> };
const isAppError = (e: unknown): e is AppError =>
  typeof e === "object" && e !== null && "message" in e;

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
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

  return (
    <div className="p-4 space-y-5">
    <BackButton to="/users" className="mb-2" />
    <div className="p-4 grid place-items-center">
      <Card className="w-full max-w-lg">
        <CardBody className="p-6">
          <h1 className="text-xl font-semibold">Register User</h1>
          <Spacer y={3} />

          {errorMsg && (
            <div className="mb-4 rounded-large border border-danger/30 bg-danger/10 p-3 text-danger-600" role="alert">
              <div className="flex items-center gap-2">
                <strong>Error:</strong>
                <span>{errorMsg}</span>
                {errorCode && <Chip size="sm" color="danger" variant="flat">{errorCode}</Chip>}
              </div>
              {Object.keys(fieldErrors).length > 0 && (
                <ul className="mt-2 list-disc ps-5 text-sm">
                  {Object.entries(fieldErrors).map(([k, v]) => (
                    <li key={k}>
                      <span className="font-medium">{k}</span>: {v}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form className="grid gap-4" onSubmit={onSubmit}>
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
              isInvalid={!!fieldErrors.username}
              errorMessage={fieldErrors.username}
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              isInvalid={!!fieldErrors.password}
              errorMessage={fieldErrors.password}
            />
            <Input
              label="Nama Lengkap"
              value={form.namaLengkap}
              onChange={(e) => setForm((s) => ({ ...s, namaLengkap: e.target.value }))}
              isInvalid={!!fieldErrors.namaLengkap}
              errorMessage={fieldErrors.namaLengkap}
            />
            <Button type="submit" color="primary" isLoading={loading}>
              Simpan
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
    </div>
  );
}
