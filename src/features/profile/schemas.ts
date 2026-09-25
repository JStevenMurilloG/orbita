import { z } from "zod";
import { requiredText, timeZoneSchema } from "@/lib/validation/common";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

export const themeSchema = z.enum(THEMES, { message: "Tema no válido." });

/** 1 = lunes … 7 = domingo (ISO), igual que la columna `week_starts_on`. */
export const weekStartsOnSchema = z
  .number({ message: "Elige un día." })
  .int()
  .min(1, "Elige un día.")
  .max(7, "Elige un día.");

export const updateProfileSchema = z.object({
  full_name: requiredText(100, "El nombre"),
  timezone: timeZoneSchema,
  week_starts_on: weekStartsOnSchema,
  theme: themeSchema,
});

export const updateThemeSchema = z.object({ theme: themeSchema });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
