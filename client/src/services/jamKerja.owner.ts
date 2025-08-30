import type { AxiosInstance } from "axios";

type StartRow = { id: number; username: string; jamMulai: string; status: "AKTIF" };
type Envelope<T> = { status: "success" | "error"; data?: T; message?: string };

export async function startJamKerjaForUser(api: AxiosInstance, username: string) {
  // ⬇️ kirim body JSON, jangan null
  const { data } = await api.post<Envelope<StartRow>>(
    "/api/jam-kerja/start",
    { username } // OWNER target user via BODY (server juga tetap menerima ?username)
  );
  if (data?.status !== "success") throw new Error(data?.message ?? "Gagal mulai sesi");
  return data.data as StartRow;
}
