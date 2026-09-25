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
