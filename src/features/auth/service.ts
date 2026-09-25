import "server-only";
import { AppError, mapAuthError } from "@/lib/errors";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ChangePasswordInput,
  EmailOnlyInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./schemas";

/**
 * Capa de dominio de autenticación (plan §7, §11): envuelve Supabase Auth.
 * Recibe el cliente de servidor (cookies) y datos ya validados.
 */

export async function signIn(supabase: ServerSupabaseClient, input: LoginInput): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) throw mapAuthError(error);
}

/**
 * Alta con confirmación por correo. Si el correo ya existe, Supabase responde igual
 * (sin enviar nada) para no permitir enumerar cuentas: la UI muestra siempre el mismo mensaje.
 */
export async function signUp(
  supabase: ServerSupabaseClient,
  input: RegisterInput,
  emailRedirectTo: string,
): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo,
      data: { full_name: input.full_name, timezone: input.timezone },
    },
  });
  if (error) throw mapAuthError(error);
}

export async function resendConfirmation(
  supabase: ServerSupabaseClient,
  input: EmailOnlyInput,
  emailRedirectTo: string,
): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: input.email,
    options: { emailRedirectTo },
  });
  if (error) throw mapAuthError(error);
}

/** Siempre "si el correo existe, te enviamos un enlace": solo se propaga el límite de envíos. */
export async function requestPasswordReset(
  supabase: ServerSupabaseClient,
  input: EmailOnlyInput,
  redirectTo: string,
): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, { redirectTo });
  if (!error) return;
  const appError = mapAuthError(error);
  if (appError.code === "RATE_LIMITED" || appError.code === "NETWORK") throw appError;
  console.warn("[auth] resetPasswordForEmail", error.code ?? error.message);
}

/** Nueva contraseña con la sesión de recuperación abierta por el enlace del correo. */
export async function resetPassword(
  supabase: ServerSupabaseClient,
  input: ResetPasswordInput,
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) throw mapAuthError(error, { password: "password" });
}

/**
 * Cambio de contraseña desde Configuración: se verifica la actual volviendo a iniciar sesión
 * (renueva la sesión, lo que además satisface `secure_password_change`) y luego se actualiza.
 */
export async function changePassword(
  supabase: ServerSupabaseClient,
  email: string,
  input: ChangePasswordInput,
): Promise<void> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: input.current_password,
  });
  if (signInError) {
    if (signInError.code === "invalid_credentials") {
      throw new AppError("VALIDATION", {
        cause: signInError,
        fields: { current_password: ["La contraseña actual no es correcta."] },
      });
    }
    throw mapAuthError(signInError);
  }

  const { error } = await supabase.auth.updateUser({ password: input.new_password });
  if (error) throw mapAuthError(error, { password: "new_password" });
}

/** Cambio de correo: Supabase envía confirmación al correo actual y al nuevo. */
export async function changeEmail(
  supabase: ServerSupabaseClient,
  currentEmail: string | null,
  input: EmailOnlyInput,
  emailRedirectTo: string,
): Promise<void> {
  if (currentEmail && input.email === currentEmail.toLowerCase()) {
    throw new AppError("VALIDATION", {
      fields: { email: ["Ese ya es tu correo actual."] },
    });
  }
  const { error } = await supabase.auth.updateUser({ email: input.email }, { emailRedirectTo });
  if (error) throw mapAuthError(error);
}

/** `local` = este dispositivo; `global` = todas las sesiones de la cuenta. */
export async function signOut(
  supabase: ServerSupabaseClient,
  scope: "local" | "global",
): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope });
  // Si la sesión ya no existe, el resultado es el mismo: el usuario queda fuera.
  if (error && mapAuthError(error).code !== "UNAUTHENTICATED") throw mapAuthError(error);
}
