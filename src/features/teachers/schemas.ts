import { z } from "zod";
import { optionalText, requiredText, uuidSchema } from "@/lib/validation/common";
import { isValidPhone } from "./utils";

export const TEACHER_NAME_MAX = 100;
export const TEACHER_EMAIL_MAX = 254;
export const TEACHER_PHONE_MAX = 30;
export const TEACHER_OFFICE_MAX = 100;
export const TEACHER_OFFICE_HOURS_MAX = 500;
export const TEACHER_NOTES_MAX = 2000;

/** Correo opcional: vacío → `null`. */
const emailSchema = z
  .string()
  .trim()
  .max(TEACHER_EMAIL_MAX, `El correo admite como máximo ${TEACHER_EMAIL_MAX} caracteres.`)
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Escribe un correo válido, p. ej. nombre@universidad.edu.",
  )
  .transform((value) => (value === "" ? null : value))
  .nullish();

/** Teléfono opcional: dígitos, espacios, paréntesis, puntos, guiones y "+" inicial. */
const phoneSchema = z
  .string()
  .trim()
  .max(TEACHER_PHONE_MAX, `El teléfono admite como máximo ${TEACHER_PHONE_MAX} caracteres.`)
  .refine(
    (value) => value === "" || isValidPhone(value),
    "Escribe un teléfono válido, p. ej. +57 601 555 0101.",
  )
  .transform((value) => (value === "" ? null : value))
  .nullish();

/** Campos editables de un docente (mismos límites que los CHECK de `teachers`). */
const teacherFields = {
  full_name: requiredText(TEACHER_NAME_MAX, "El nombre"),
  email: emailSchema,
  phone: phoneSchema,
  office: optionalText(TEACHER_OFFICE_MAX, "La oficina"),
  office_hours: optionalText(TEACHER_OFFICE_HOURS_MAX, "El horario de atención"),
  notes: optionalText(TEACHER_NOTES_MAX, "La información adicional"),
};

export const teacherFormSchema = z.object(teacherFields);

export const createTeacherSchema = z.object({
  ...teacherFields,
  /** Clase a la que se asigna como docente principal al crearlo (opcional). */
  course_id: uuidSchema.optional(),
});

export const updateTeacherSchema = z.object({ id: uuidSchema, ...teacherFields });

export const courseTeacherSchema = z.object({ course_id: uuidSchema, teacher_id: uuidSchema });

export type TeacherFormValues = z.input<typeof teacherFormSchema>;
export type TeacherFormOutput = z.output<typeof teacherFormSchema>;
export type CreateTeacherInput = z.output<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.output<typeof updateTeacherSchema>;
