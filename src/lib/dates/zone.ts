import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

/** Zona por defecto cuando no se puede detectar la del navegador (plan §39 #9). */
export const DEFAULT_TIMEZONE = "America/Bogota";

/** ¿Es un identificador IANA reconocido por el runtime? */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Zona del navegador (solo en cliente), con fallback. */
export function detectBrowserTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Instante actual expresado en la zona indicada. */
export function nowInZone(timeZone: string, now: Date = new Date()): TZDate {
  return new TZDate(now.getTime(), timeZone);
}

/**
 * Fecha civil de "hoy" (YYYY-MM-DD) en la zona del usuario.
 * NUNCA usar la hora del servidor: Vercel corre en UTC (plan §27, regla 1).
 */
export function getToday(timeZone: string, now: Date = new Date()): string {
  return format(nowInZone(timeZone, now), "yyyy-MM-dd");
}

/** Día ISO de la semana (1 = lunes … 7 = domingo) de "hoy" en la zona dada. */
export function getTodayIsoWeekday(timeZone: string, now: Date = new Date()): number {
  const day = nowInZone(timeZone, now).getDay(); // 0 = domingo
  return day === 0 ? 7 : day;
}

/**
 * Convierte una fecha civil + hora de pared en una zona a un instante UTC.
 * Hora inexistente (salto de primavera) → se desplaza hacia delante;
 * hora ambigua (otoño) → primera ocurrencia (plan §27, regla 3).
 */
export function zonedWallTimeToInstant(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm, ss = 0] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, ss, timeZone).getTime());
}
