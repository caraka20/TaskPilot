export type Role = "ADMIN" | "USER";
export type WorkMode = "DAILY" | "PIECEWORK";
export type WorkStatus = "IN_PROGRESS" | "PENDING" | "APPROVED" | "REJECTED";
export type RecurrenceType = "ONCE" | "DAILY" | "WEEKLY";
export type TaskStatus = "OPEN" | "COMPLETED";

export type User = {
  id: string;
  name: string;
  username: string;
  role: Role;
  dailyRate: string;
  isActive: boolean;
  avatarUrl?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  _count?: { productRates: number; workEntries: number };
};

export type Product = {
  id: string;
  name: string;
  unit: string;
  baseRate: string;
  rate?: string;
  isActive: boolean;
  deletedAt?: string | null;
  _count?: { userRates: number; workItems: number };
  userRates?: UserProductRate[];
};

export type UserProductRate = {
  id: string;
  userId: string;
  productId: string;
  rate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type PieceworkItem = {
  id: string;
  productId: string;
  quantity: number;
  unitRateSnapshot: string;
  subtotal: string;
  product?: Product;
};

export type WorkEntry = {
  id: string;
  userId: string;
  workDate: string;
  mode: WorkMode;
  status: WorkStatus;
  clockIn: string | null;
  clockOut: string | null;
  note: string | null;
  dailyRateSnapshot: string | null;
  finalAmount: string;
  submittedAt: string | null;
  approvedAt: string | null;
  correctionReason: string | null;
  user?: Pick<User, "id" | "name" | "username">;
  items: PieceworkItem[];
};

export type PayrollSummary = {
  totalEarned: string;
  totalPaid: string;
  balance: string;
  hourlyHours: number;
  hourlyRate: string;
  hourlyEarned: string;
  hourlySessionCount: number;
  dailyEarned: string;
  dailyCount: number;
  pieceworkEarned: string;
  pieceworkCount: number;
  attendanceEarned: string;
  attendanceCount: number;
  totalWorkCount: number;
  totalItems: number;
};

export type Payment = {
  id: string;
  userId: string;
  paymentDate: string;
  amount: string;
  note: string | null;
  createdAt: string;
};

export type DashboardNote = {
  id: string;
  userId: string;
  title: string | null;
  message: string;
  isActive: boolean;
  updatedAt: string;
  user?: Pick<User, "id" | "name" | "username">;
};

export type TaskOccurrence = {
  id: string;
  taskDate: string;
  status: TaskStatus;
  completedAt: string | null;
  user?: Pick<User, "id" | "name" | "username">;
  schedule: {
    id: string;
    template: { id: string; title: string; description: string | null };
  };
};

export type TaskSchedule = {
  id: string;
  templateId: string;
  recurrence: RecurrenceType;
  startDate: string;
  endDate: string | null;
  weekdays: number[] | null;
  isActive: boolean;
  assignedUsers: Array<{
    userId: string;
    user?: Pick<User, "id" | "name" | "username">;
  }>;
};

export type TaskTemplate = {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  deletedAt: string | null;
  schedules?: TaskSchedule[];
  _count?: { schedules: number };
};

export type CalendarData = {
  month: string;
  entries: WorkEntry[];
  tasks: TaskOccurrence[];
};

export type AuditLog = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  reason: string | null;
  createdAt: string;
  actor: Pick<User, "name" | "username">;
};
