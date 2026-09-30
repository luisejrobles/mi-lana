import { format } from "date-fns";
import { es } from "date-fns/locale";

// D7: day(spend_date) < cut_day → due `due_day` of the same month,
// otherwise `due_day` of the next month.
export function cardDueDate(cutDay: number, dueDay: number, from: Date): Date {
  const monthOffset = from.getDate() < cutDay ? 0 : 1;
  return new Date(from.getFullYear(), from.getMonth() + monthOffset, dueDay);
}

// "5 de noviembre"
export function formatLongDate(date: Date): string {
  return format(date, "d 'de' MMMM", { locale: es });
}

// "05/11/2026" — dd/mm/yyyy per spec.
export function formatShortDate(date: Date | string): string {
  return format(typeof date === "string" ? new Date(`${date}T00:00:00`) : date, "dd/MM/yyyy");
}

// "noviembre 2026"
export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: es });
}
