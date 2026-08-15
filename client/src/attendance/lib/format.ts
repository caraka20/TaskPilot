export const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatDate = (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
    ...options,
  }).format(new Date(value));

export const formatMonthYear = (value: string | Date) =>
  new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(typeof value === "string" ? new Date(`${value}-01T00:00:00.000Z`) : value);

export const formatTime = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value))
    : "—";

export const todayInput = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const workModeLabel = (mode: string) =>
  mode === "DAILY" ? "Harian" : "Borongan";

export const workStatusLabel = (status: string) =>
  ({
    IN_PROGRESS: "Sedang bekerja",
    PENDING: "Menunggu pemeriksaan",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
  })[status] ?? status;
