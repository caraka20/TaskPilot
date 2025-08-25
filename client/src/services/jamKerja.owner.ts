// client/src/services/jamKerja.owner.ts
import type { AxiosInstance } from "axios";

type StartRow = { id: number; username: string; jamMulai: string; status: "AKTIF" };

export async function startJamKerjaForUser(api: AxiosInstance, username: string) {
  const { data } = await api.post<{ status: "success"|"error"; data?: StartRow; message?: string }>(
    "/api/jam-kerja/start",
    { username } // OWNER bisa mulai untuk user lain
  );
  if (data?.status !== "success") throw new Error(data?.message ?? "Gagal mulai sesi");
  return data.data as StartRow;
}
