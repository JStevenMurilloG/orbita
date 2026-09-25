import { z } from "zod";
import { requiredText, timeZoneSchema } from "@/lib/validation/common";

/** Esquemas de autenticación, compartidos por formularios (cliente) y Server Actions. */

export const PASSWORD_MIN = 8;
/** bcrypt ignora lo que pase de 72 bytes: se limita para no dar una falsa sensación de seguridad. */
export const PASSWORD_MAX = 72;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu correo.")
  .max(254, "El correo es demasiado largo.")
  .pipe(z.email({ message: "Escribe un correo válido." }));

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`)
  .max(PASSWORD_MAX, `La contraseña admite como máximo ${PASSWORD_MAX} caracteres.`);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Escribe tu contraseña.").max(PASSWORD_MAX),
});

export const registerSchema = z.object({
  full_name: requiredText(100, "El nombre"),
  email: emailSchema,
  password: newPasswordSchema,
  timezone: timeZoneSchema,
});

export const emailOnlySchema = z.object({ email: emailSchema });

const PASSWORDS_DIFFER = "Las contraseñas no coinciden.";

export const resetPasswordSchema = z
  .object({ password: newPasswordSchema, confirm_password: z.string() })
  .refine((v) => v.password === v.confirm_password, {
    message: PASSWORDS_DIFFER,
    path: ["confirm_password"],
  });

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Escribe tu contraseña actual.").max(PASSWORD_MAX),
    new_password: newPasswordSchema,
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: PASSWORDS_DIFFER,
    path: ["confirm_password"],
  })
  .refine((v) => v.new_password !== v.current_password, {
    message: "La nueva contraseña debe ser distinta de la actual.",
    path: ["new_password"],
  });

export const signOutSchema = z.object({ scope: z.enum(["local", "global"]).default("local") });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmailOnlyInput = z.infer<typeof emailOnlySchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
