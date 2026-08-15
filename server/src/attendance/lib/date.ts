import { AppError } from "./http";

const attendanceTimezone = process.env.ATTENDANCE_TIMEZONE || process.env.TZ || "Asia/Jakarta";

export const dateOnly = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(422, "Format tanggal harus YYYY-MM-DD.");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(422, "Tanggal tidak valid.");
  }
  return date;
};

export const todayString = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: attendanceTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const today = () => dateOnly(todayString());

export const toDateString = (date: Date) => date.toISOString().slice(0, 10);

export const monthRange = (value: string) => {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw new AppError(422, "Format bulan harus YYYY-MM.");
  }
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (month < 1 || month > 12) throw new AppError(422, "Bulan tidak valid.");
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
};
