import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";

const LOCALE = "es-CO";

/** "miércoles, 1 de octubre" en la zona indicada. */
export function formatLongDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(instant);
}

/** "08:00" (24 h) en la zona indicada. */
export function formatTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(instant);
}

/** "hace 5 minutos" / "en 3 días". */
export function formatRelative(instant: Date, now: Date = new Date()): string {
  return formatDistanceStrict(instant, now, { addSuffix: true, locale: es });
}

/** Fecha civil `YYYY-MM-DD` como instante UTC: el día no depende de ninguna zona. */
function civilDateToUtc(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const civilDateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "13 de jul de 2026" para una fecha civil (sin zona: inicio de trimestre, entregas…). */
export function formatCivilDate(date: string): string {
  return civilDateFormat.format(civilDateToUtc(date));
}

/** "13 de jul al 2 de oct de 2026": rango de fechas civiles, sin repetir el año si coincide. */
export function formatCivilDateRange(start: string, end: string): string {
  return civilDateFormat.formatRange(civilDateToUtc(start), civilDateToUtc(end));
}
