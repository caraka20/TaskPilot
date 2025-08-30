// Types & helpers khusus Customer (sinkron dgn BE tests)

export type CustomerJenis = "TUTON" | "KARIL" | "TK";

// tambahkan field optional ini di interface CustomerDetail
export interface CustomerItem {
  id: number;
  namaCustomer: string;
  noWa: string;
  nim: string;
  jurusan: string;
  jenis: string;
  totalBayar: number;
  sudahBayar: number;
  sisaBayar: number;
  tutonCourseCount: number;
  hasKaril: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  /** ← NEW: kalau BE kirim password, FE bisa tampilkan */
  password?: string;
}



export interface CustomerListResponse {
  items: CustomerItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CustomerDetail extends CustomerItem {
  hasKaril: boolean;
  tutonCourseCount: number;
}

export interface ListParams {
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: "namaCustomer" | "nim" | "createdAt";
  sortDir?: "asc" | "desc";
  /** ⬅️ NEW: filter jenis (boleh single atau multi) */
  jenis?: CustomerJenis | CustomerJenis[];
}

export interface CreateCustomerPayload {
  namaCustomer: string;
  noWa: string;
  nim: string;
  password: string;      // BE simpan apa adanya (sesuai test)
  jurusan: string;
  jenis: CustomerJenis;
  totalBayar?: number;
  sudahBayar?: number;
}

export interface AddPaymentPayload {
  amount: number;
  catatan?: string;
  tanggalBayar?: string; // ISO
}

export interface UpdateInvoicePayload {
  totalBayar: number;
}

export interface PaymentsListParams {
  page?: number;
  limit?: number;
  sortDir?: "asc" | "desc";
  start?: string; // ISO
  end?: string;   // ISO
}

export interface PaymentItem {
  id: number;
  amount: number;
  tanggalBayar: string;
  catatan?: string;
  createdAt: string;
}

export interface PaymentsListResponse {
  items: PaymentItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Tuton summary
export interface TutonJenisBreakdown {
  total: number; selesai: number; belum: number; nilaiAvg?: number | null;
}
export interface TutonCourseSummary {
  courseId: number;
  matkul: string;
  totalItems: number;
  completedItems: number;
  progress: number;
  breakdown: {
    DISKUSI: TutonJenisBreakdown;
    ABSEN: TutonJenisBreakdown;
    TUGAS: TutonJenisBreakdown;
  };
  createdAt: string;
  updatedAt: string;
}
export interface TutonSummary {
  customerId: number;
  namaCustomer: string;
  totalCourses: number;
  totalItems: number;
  totalCompleted: number;
  overallProgress: number;
  courses: TutonCourseSummary[];
}

// helpers
export function fmtRp(n?: number) {
  if (n == null) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
}
export function toISODateOnly(d?: Date | string) {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toISOString().slice(0, 10);
}
