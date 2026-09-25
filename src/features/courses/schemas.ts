import { z } from "zod";
import { courseColorSchema, optionalText, requiredText, uuidSchema } from "@/lib/validation/common";
import { isSingleEmoji } from "./utils";

export const COURSE_NAME_MAX = 100;
export const COURSE_CODE_MAX = 30;
export const COURSE_DESCRIPTION_MAX = 2000;
export const COURSE_ROOM_MAX = 50;
export const COURSE_ICON_MAX = 16;
export const COURSE_CREDITS_MAX = 999.9;

/** Emoji opcional: vacío → `null`; si hay algo, debe ser un único emoji. */
const iconSchema = z
  .string()
  .trim()
  .max(COURSE_ICON_MAX, "Usa un solo emoji.")
  .refine((value) => value === "" || isSingleEmoji(value), "Usa un solo emoji.")
  .transform((value) => (value === "" ? null : value))
  .nullish();

/**
 * Créditos opcionales: el formulario envía texto ("3", "4,5"); el servidor recibe el número
 * ya normalizado. Mismos límites que `numeric(4,1) CHECK (credits >= 0)`.
 */
export const creditsSchema = z
  .union([z.number(), z.string().trim()])
  .nullish()
  .transform((value, ctx) => {
    if (value === null || value === undefined || value === "") return null;
    const number = typeof value === "number" ? value : Number(value.replace(",", "."));
    if (!Number.isFinite(number)) {
      ctx.addIssue({ code: "custom", message: "Escribe un número, p. ej. 3 o 4,5." });
      return z.NEVER;
    }
    if (number < 0 || number > COURSE_CREDITS_MAX) {
      ctx.addIssue({ code: "custom", message: "Los créditos deben estar entre 0 y 999,9." });
      return z.NEVER;
    }
    if (Math.abs(number * 10 - Math.round(number * 10)) > 1e-9) {
      ctx.addIssue({ code: "custom", message: "Usa como máximo un decimal." });
      return z.NEVER;
    }
    return Math.round(number * 10) / 10;
  });

/** Campos editables de una clase (mismos límites que los CHECK de `courses`). */
const courseFields = {
  name: requiredText(COURSE_NAME_MAX, "El nombre"),
  code: optionalText(COURSE_CODE_MAX, "El código"),
  description: optionalText(COURSE_DESCRIPTION_MAX, "La descripción"),
  color: courseColorSchema,
  icon: iconSchema,
  room: optionalText(COURSE_ROOM_MAX, "El aula"),
  credits: creditsSchema,
};

export const courseFormSchema = z.object(courseFields);

export const createCourseSchema = z.object({ term_id: uuidSchema, ...courseFields });

export const updateCourseSchema = z.object({ id: uuidSchema, ...courseFields });

export const courseIdSchema = z.object({ id: uuidSchema });

export const reorderCoursesSchema = z.object({
  term_id: uuidSchema,
  course_ids: z.array(uuidSchema).min(1).max(200),
});

export type CourseFormValues = z.input<typeof courseFormSchema>;
export type CourseFormOutput = z.output<typeof courseFormSchema>;
export type CreateCourseInput = z.output<typeof createCourseSchema>;
export type UpdateCourseInput = z.output<typeof updateCourseSchema>;
