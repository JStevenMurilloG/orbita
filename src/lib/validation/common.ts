import { z } from "zod";
import { isValidTimeZone } from "@/lib/dates/zone";
import { COURSE_COLORS } from "@/lib/design/course-colors";

/** Esquemas Zod comunes, compartidos entre cliente y servidor. */

export const uuidSchema = z.uuid({ message: "Identificador inválido." });

/** Fecha civil `YYYY-MM-DD` que además existe en el calendario. */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD.")
  .refine((value) => {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }, "La fecha no existe.");

/** Hora de pared `HH:mm` (24 h). */
export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa el formato HH:mm (24 horas).");

export const timeZoneSchema = z
  .string()
  .min(1, "Elige una zona horaria.")
  .refine(isValidTimeZone, "Zona horaria no válida.");

export const courseColorSchema = z.enum(COURSE_COLORS, { message: "Color no válido." });

/** Texto recortado con longitud acotada; cadena vacía → error. */
export function requiredText(max: number, label = "Este campo") {
  return z
    .string()
    .trim()
    .min(1, `${label} es obligatorio.`)
    .max(max, `${label} admite como máximo ${max} caracteres.`);
}

/** Texto opcional: cadena vacía se normaliza a `null`. */
export function optionalText(max: number, label = "Este campo") {
  return z
    .string()
    .trim()
    .max(max, `${label} admite como máximo ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value))
    .nullish();
}
