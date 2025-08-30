import type { TutonItemResponse, StatusTugas } from "../../../../services/tuton.service";

export type MinimalCourse = {
  id?: number;
  courseId?: number;
  matkul?: string;
  totalItems?: number;
  completedItems?: number;
};

export type Pair = {
  courseId: number;
  matkul: string;
  sesi: number;
  absen?: TutonItemResponse;
  diskusi?: TutonItemResponse;
  tugas?: TutonItemResponse;
  pct: number;
};

export type Dirty = { itemId: number; status: StatusTugas };
