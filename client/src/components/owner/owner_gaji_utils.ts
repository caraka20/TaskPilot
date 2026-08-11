import type { AxiosInstance } from "axios";
import type { GajiItem } from "../../services/gaji.service";

export type OwnerListQuery = {
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
  username?: string;
  "tanggalBayar.gte"?: string;
  "tanggalBayar.lte"?: string;
};

export type OwnerListResult = {
  data: GajiItem[];
  total: number;
  perPage?: number;
  page?: number;
};

/** GET /api/gaji (OWNER) */
export async function getAllGaji(
  api: AxiosInstance,
  query: OwnerListQuery
): Promise<OwnerListResult> {
  const { data } = await api.get("/api/gaji", { params: query });
  const items: GajiItem[] = (data?.data ?? []) as GajiItem[];
  const total: number = Number(data?.total ?? items.length ?? 0);
  return {
    data: items,
    total,
    perPage: Number(data?.perPage ?? query.limit ?? 10),
    page: Number(data?.page ?? query.page ?? 1),
  };
}
