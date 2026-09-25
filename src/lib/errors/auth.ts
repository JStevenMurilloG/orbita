import { AppError } from "./app-error";

/** Forma mínima de un error de Supabase Auth (`AuthError` de supabase-js). */
export type AuthLikeError = {
  code?: string;
  status?: number;
  message?: string;
  name?: string;
};

/** Campo del formulario al que se atribuyen los errores de contraseña/correo. */
type AuthErrorFields = { password?: string; email?: string };

/** supabase-js marca sus errores con `__isAuthError` (ver `isAuthError` de auth-js). */
export function isAuthLikeError(value: unknown): value is AuthLikeError {
  return typeof value === "object" && value !== null && "__isAuthError" in value;
}

/**
 * Mapeo central Supabase Auth → AppError (plan §28).
 * Los mensajes nunca revelan si un correo existe.
 */
export function mapAuthError(
  error: AuthLikeError,
  fields: AuthErrorFields = { password: "password", email: "email" },
): AppError {
  const passwordField = fields.password ?? "password";
  const emailField = fields.email ?? "email";

  switch (error.code) {
    case "invalid_credentials":
      return new AppError("INVALID_CREDENTIALS", { cause: error });
    case "email_not_confirmed":
      return new AppError("EMAIL_NOT_CONFIRMED", { cause: error });
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
    case "over_sms_send_rate_limit":
      return new AppError("RATE_LIMITED", { cause: error });
    case "weak_password":
      return new AppError("VALIDATION", {
        cause: error,
        fields: {
          [passwordField]: [
            "Esta contraseña es demasiado débil o aparece en filtraciones conocidas. Elige otra.",
          ],
        },
      });
    case "same_password":
      return new AppError("VALIDATION", {
        cause: error,
        fields: { [passwordField]: ["La nueva contraseña debe ser distinta de la actual."] },
      });
    case "email_address_invalid":
    case "email_address_not_authorized":
      return new AppError("VALIDATION", {
        cause: error,
        fields: { [emailField]: ["No podemos usar este correo. Revisa que esté bien escrito."] },
      });
    case "email_exists":
    case "user_already_exists":
      return new AppError("CONFLICT", {
        cause: error,
        message: "Ese correo ya está en uso.",
        fields: { [emailField]: ["Ese correo ya está en uso."] },
      });
    case "otp_expired":
    case "otp_disabled":
    case "flow_state_expired":
    case "flow_state_not_found":
    case "bad_code_verifier":
      return new AppError("LINK_INVALID", { cause: error });
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
    case "refresh_token_already_used":
    case "bad_jwt":
    case "no_authorization":
    case "user_not_found":
      return new AppError("UNAUTHENTICATED", { cause: error });
    case "reauthentication_needed":
    case "reauthentication_not_valid":
      return new AppError("UNAUTHENTICATED", {
        cause: error,
        message: "Por seguridad, inicia sesión de nuevo antes de cambiar tu contraseña.",
      });
  }

  // Sesión revocada (p. ej. "cerrar sesión en todos los dispositivos"): supabase-js no trae código.
  if (error.name === "AuthSessionMissingError") {
    return new AppError("UNAUTHENTICATED", { cause: error });
  }

  // Fallo de red o del servicio de Auth (supabase-js usa status 0 / AuthRetryableFetchError).
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return new AppError("NETWORK", { cause: error });
  }
  if (error.status === 429) return new AppError("RATE_LIMITED", { cause: error });

  return new AppError("INTERNAL", { cause: error });
}
