import httpClient from "../lib/httpClient";
import { pingWorkActivity, ensureWorkActiveBeforeMutate } from "../utils/workActivity";

/** FE enums sinkron dgn BE */
export type StatusTugas = "BELUM" | "SELESAI";
export type JenisTugas = "DISKUSI" | "ABSEN" | "TUGAS";

/** COURSE */
export type AddCoursePayload = { matkul: string; generateItems?: boolean };
export type TutonCourseResponse = {
  id: number;
  customerId: number;
  matkul: string;
  totalItems: number;
  completedItems: number;
};

export type UpdateCoursePayload = Partial<{
  matkul: string;
  resetItems: boolean;
}>;

/** ITEMS */
export type TutonItemResponse = {
  id: number;
  courseId: number;
  jenis: JenisTugas | string;
  sesi: number;
  status: StatusTugas | string;
  nilai?: number | null;
  deskripsi?: string | null;
  selesaiAt?: string | null | Date;
  copas: boolean;
};

export type UpdateTutonItemPayload = Partial<{
  status: StatusTugas;
  nilai: number | null;
  deskripsi: string | null;
  copas: boolean;
}>;

export type BulkStatusItem = { itemId: number; status: StatusTugas };
export type BulkStatusRequest = { items: BulkStatusItem[] };
export type BulkNilaiRequest = { items: Array<{ itemId: number; nilai: number | null }> };

/** SUBJECTS */
export type SubjectEntry = {
  matkul: string;
  totalCourses: number;
  isConflict: boolean;
};

/** SCAN */
export type ScanFilters = {
  matkul?: string;
  jenis?: JenisTugas;
  sesi?: number;
  status?: StatusTugas;
  page?: number;
  pageSize?: number;
  /** Baru: filter copas. true=YA, false=TIDAK, undefined=SEMUA */
  copas?: boolean;
};

export type ScanRow = {
  itemId: number;
  courseId: number;
  customerId: number;
  customerName: string;
  matkul: string;
  jenis: JenisTugas;
  sesi: number;
  status: StatusTugas;
};

export type ScanResponse = {
  meta: { page: number; pageSize: number; total: number; hasNext: boolean };
  filters: { matkul: string | null; jenis: JenisTugas | null; sesi: number | null; status: StatusTugas };
  rows: ScanRow[];
};

/* -------------------- Courses (mutasi) -------------------- */
export async function addCourse(customerId: number, payload: AddCoursePayload) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "menambah matkul" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const { data } = await httpClient.post<{ data: TutonCourseResponse }>(
    `/api/customers/${customerId}/tuton-courses`,
    payload
  );
  pingWorkActivity();
  return data.data;
}

export async function updateCourse(courseId: number, payload: UpdateCoursePayload) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "mengubah matkul" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const { data } = await httpClient.patch<{ data: TutonCourseResponse }>(
    `/api/tuton-courses/${courseId}`,
    payload
  );
  pingWorkActivity();
  return data.data;
}

export async function deleteCourse(courseId: number) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "menghapus matkul" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const { data } = await httpClient.delete<{ data: { deleted: true } }>(
    `/api/tuton-courses/${courseId}`
  );
  pingWorkActivity();
  return data.data;
}

/* -------------------- Items -------------------- */
export async function listItems(courseId: number) {
  const { data } = await httpClient.get<{ data: TutonItemResponse[] }>(
    `/api/tuton-courses/${courseId}/items`
  );
  return data.data;
}

export async function updateItem(itemId: number, payload: UpdateTutonItemPayload) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "mengubah item Tuton" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const { data } = await httpClient.patch<{ data: TutonItemResponse }>(
    `/api/tuton-items/${itemId}`,
    payload
  );
  pingWorkActivity();
  return data.data;
}

export async function updateItemStatus(itemId: number, status: StatusTugas) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "mengubah status item" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const { data } = await httpClient.patch<{ data: TutonItemResponse }>(
    `/api/tuton-items/${itemId}/status`,
    { status }
  );
  pingWorkActivity();
  return data.data;
}

export async function updateItemNilai(itemId: number, nilai: number | null) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "mengubah nilai" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const { data } = await httpClient.patch<{ data: TutonItemResponse }>(
    `/api/tuton-items/${itemId}/nilai`,
    { nilai }
  );
  pingWorkActivity();
  return data.data;
}

export async function initItems(courseId: number, overwrite = false) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "inisialisasi item" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const { data } = await httpClient.post<{
    data: { courseId: number; created: boolean; totalItems: number; completedItems: number };
  }>(`/api/tuton-courses/${courseId}/items/init`, { overwrite });
  pingWorkActivity();
  return data.data;
}

export async function bulkUpdateStatus(courseId: number, payload: { items: { itemId: number; status: StatusTugas }[] }) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "bulk update status" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const safe = {
    items: (payload.items || []).filter(
      (it) => typeof it.itemId === "number" && (it.status === "BELUM" || it.status === "SELESAI")
    ),
  };
  const { data } = await httpClient.post<{ data: { updated: number } }>(
    `/api/tuton-courses/${courseId}/items/bulk-status`,
    safe
  );
  pingWorkActivity();
  return data.data;
}

export async function bulkUpdateNilai(courseId: number, payload: { items: Array<{ itemId: number; nilai: number | null }> }) {
  const ok = await ensureWorkActiveBeforeMutate({ feature: "bulk update nilai" });
  if (!ok) throw new Error("Mulai jam kerja dulu.");
  const { data } = await httpClient.post<{ data: { updated: number } }>(
    `/api/tuton-courses/${courseId}/items/bulk-nilai`,
    payload
  );
  pingWorkActivity();
  return data.data;
}

/* -------------------- Summary & Conflicts -------------------- */
export type CourseSummaryResponse = {
  courseId: number;
  matkul: string;
  totalItems: number;
  completedItems: number;
  progress: number;
  byJenis: {
    DISKUSI: { total: number; done: number; avgNilai: number | null };
    ABSEN: { total: number; done: number };
    TUGAS: { total: number; done: number; avgNilai: number | null };
  };
  updatedAt: string;
};

export type ConflictCustomerEntry = {
  customerId: number;
  courseId: number;
  namaCustomer: string;
  createdAt: string;
  isDuplicate: boolean;
};
export type ConflictGroupResponse = {
  matkul: string;
  total: number;
  customers: ConflictCustomerEntry[];
};

export async function getCourseSummary(courseId: number) {
  const res = await httpClient.get<{ data: CourseSummaryResponse }>(
    `/api/tuton-courses/${courseId}/summary`,
    { validateStatus: (s) => (s >= 200 && s < 300) || s === 404 }
  );
  if (res.status === 404) {
    return {
      courseId,
      matkul: "",
      totalItems: 0,
      completedItems: 0,
      progress: 0,
      byJenis: {
        DISKUSI: { total: 0, done: 0, avgNilai: null },
        ABSEN: { total: 0, done: 0 },
        TUGAS: { total: 0, done: 0, avgNilai: null },
      },
      updatedAt: new Date().toISOString(),
    } as CourseSummaryResponse;
  }
  return res.data.data;
}

export async function listConflicts() {
  const { data } = await httpClient.get<{ data: ConflictGroupResponse[] }>(
    `/api/tuton-courses/conflicts`
  );
  return data.data;
}

export async function getConflictByMatkul(matkul: string) {
  const { data } = await httpClient.get<{ data: ConflictGroupResponse }>(
    `/api/tuton-courses/conflicts/${encodeURIComponent(matkul)}`
  );
  return data.data;
}

/* -------------------- Subjects & Scan (FITUR BARU) -------------------- */
export async function listSubjects(q?: string) {
  const { data } = await httpClient.get<{ data: SubjectEntry[] }>(`/api/tuton/subjects`, {
    params: q ? { q } : undefined,
  });
  return data.data;
}

export async function scanTuton(filters: ScanFilters) {
  const { data } = await httpClient.get<{ data: any }>(`/api/tuton/scan`, {
    params: filters,
  });
  return data.data;
}

/* -------------------- Helpers untuk skor per jenis -------------------- */
export async function listItemsByJenis(
  courseId: number,
  jenis: Exclude<JenisTugas, "ABSEN"> | JenisTugas
) {
  const all = await listItems(courseId);
  const j = (jenis || "").toString().toUpperCase();
  return all.filter((it) => (it.jenis || "").toString().toUpperCase() === j);
}

export async function listCompletedItemsByJenis(
  courseId: number,
  jenis: Exclude<JenisTugas, "ABSEN"> | JenisTugas
) {
  const items = await listItemsByJenis(courseId, jenis);
  return items.filter((it) => (it.status || "").toString().toUpperCase() === "SELESAI");
}

export async function setScoreForJenis(
  courseId: number,
  jenis: Exclude<JenisTugas, "ABSEN">,
  score: number | null
) {
  const targets = await listCompletedItemsByJenis(courseId, jenis);
  if (!targets.length) return { updated: 0 };
  const res = await bulkUpdateNilai(courseId, {
    items: targets.map((it) => ({ itemId: it.id, nilai: score })),
  });
  pingWorkActivity();
  return res;
}
