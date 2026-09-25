import { z } from "zod";
import {
  dateStringSchema,
  optionalText,
  requiredText,
  timeZoneSchema,
  uuidSchema,
} from "@/lib/validation/common";

export const TERM_STATUSES = ["active", "finished", "archived"] as const;
export type TermStatus = (typeof TERM_STATUSES)[number];

export const TERM_NAME_MAX = 80;
export const TERM_DESCRIPTION_MAX = 1000;
export const TERM_YEAR_MIN = 2000;
export const TERM_YEAR_MAX = 2100;

function civilDate(message: string) {
  return z.string().min(1, message).pipe(dateStringSchema);
}

/** Campos editables de un trimestre (mismos límites que los CHECK de `terms`). */
const termFields = {
  name: requiredText(TERM_NAME_MAX, "El nombre"),
  year: z
    .number({ message: "Escribe el año." })
    .int("El año debe ser un número entero.")
    .min(TERM_YEAR_MIN, `El año debe estar entre ${TERM_YEAR_MIN} y ${TERM_YEAR_MAX}.`)
    .max(TERM_YEAR_MAX, `El año debe estar entre ${TERM_YEAR_MIN} y ${TERM_YEAR_MAX}.`),
  start_date: civilDate("Elige la fecha de inicio."),
  end_date: civilDate("Elige la fecha de fin."),
  timezone: timeZoneSchema,
  description: optionalText(TERM_DESCRIPTION_MAX, "La descripción"),
};

/** Fechas civiles `YYYY-MM-DD`: el orden lexicográfico coincide con el cronológico. */
function endNotBeforeStart(value: { start_date: string; end_date: string }) {
  return value.end_date >= value.start_date;
}

const dateOrderIssue = {
  path: ["end_date"],
  message: "La fecha de fin no puede ser anterior a la de inicio.",
};

export const termFormSchema = z.object(termFields).refine(endNotBeforeStart, dateOrderIssue);

export const createTermSchema = z
  .object({
    ...termFields,
    /** Pasar a usarlo como trimestre activo (el primero siempre lo es). */
    make_active: z.boolean().optional(),
  })
  .refine(endNotBeforeStart, dateOrderIssue);

export const updateTermSchema = z
  .object({ id: uuidSchema, ...termFields })
  .refine(endNotBeforeStart, dateOrderIssue);

export const termIdSchema = z.object({ id: uuidSchema });

export const deleteTermSchema = z.object({
  id: uuidSchema,
  confirm_name: z.string().trim().min(1, "Escribe el nombre del trimestre para confirmar."),
});

export const setActiveTermSchema = z.object({ term_id: uuidSchema });

export type TermFormValues = z.input<typeof termFormSchema>;
export type TermFormOutput = z.output<typeof termFormSchema>;
export type CreateTermInput = z.output<typeof createTermSchema>;
export type UpdateTermInput = z.output<typeof updateTermSchema>;
