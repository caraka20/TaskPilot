import type { AxiosInstance } from "axios";

export type LoginResponse = {
  token: string;
  user: {
    username: string;
    namaLengkap: string;
    role: "OWNER" | "USER";
    totalJamKerja: number;
    totalGaji: number;
  };
};

export async function login(api: AxiosInstance, username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post("/api/users/login", { username, password });
  // backend kamu: { status, message, data: { token, user } }
  return data.data as LoginResponse;
}

export async function logout(api: AxiosInstance): Promise<void> {
  try {
    await api.post("/api/users/logout");
  } catch {
    // ignore network or 4xx here; FE tetap reset token
  }
}