import { describe, expect, it } from "vitest";
import { isAuthLikeError, mapAuthError, toAppError } from "..";

describe("mapAuthError", () => {
  it.each([
    ["invalid_credentials", "INVALID_CREDENTIALS", 401],
    ["email_not_confirmed", "EMAIL_NOT_CONFIRMED", 403],
    ["over_request_rate_limit", "RATE_LIMITED", 429],
    ["over_email_send_rate_limit", "RATE_LIMITED", 429],
    ["otp_expired", "LINK_INVALID", 400],
    ["flow_state_not_found", "LINK_INVALID", 400],
    ["bad_code_verifier", "LINK_INVALID", 400],
    ["session_not_found", "UNAUTHENTICATED", 401],
    ["reauthentication_needed", "UNAUTHENTICATED", 401],
    ["email_exists", "CONFLICT", 409],
    ["unexpected_failure", "INTERNAL", 500],
  ])("%s → %s", (authCode, appCode, status) => {
    const error = mapAuthError({ code: authCode, status: 400, message: "x" });
    expect(error.code).toBe(appCode);
    expect(error.httpStatus).toBe(status);
  });

  it("contraseña débil → error en el campo indicado", () => {
    const error = mapAuthError({ code: "weak_password" }, { password: "new_password" });
    expect(error.code).toBe("VALIDATION");
    expect(error.fields?.new_password?.[0]).toMatch(/débil/);
  });

  it("misma contraseña → error en el campo de contraseña", () => {
    const error = mapAuthError({ code: "same_password" });
    expect(error.fields?.password?.[0]).toBe("La nueva contraseña debe ser distinta de la actual.");
  });

  it("correo no válido → error en el campo de correo", () => {
    expect(mapAuthError({ code: "email_address_invalid" }).fields?.email).toHaveLength(1);
  });

  it("sesión revocada (AuthSessionMissingError) → UNAUTHENTICATED", () => {
    expect(mapAuthError({ name: "AuthSessionMissingError", status: 400 }).code).toBe(
      "UNAUTHENTICATED",
    );
  });

  it("fallo de red → NETWORK", () => {
    expect(mapAuthError({ name: "AuthRetryableFetchError", status: 0 }).code).toBe("NETWORK");
  });

  it("429 sin código → RATE_LIMITED", () => {
    expect(mapAuthError({ status: 429 }).code).toBe("RATE_LIMITED");
  });
});

describe("toAppError con errores de Auth", () => {
  it("reconoce errores de supabase-js por __isAuthError y no los trata como Postgres", () => {
    const authError = { __isAuthError: true, code: "invalid_credentials", message: "Invalid" };
    expect(isAuthLikeError(authError)).toBe(true);
    expect(toAppError(authError).code).toBe("INVALID_CREDENTIALS");
  });

  it("un error de Postgres sigue su propio mapeo", () => {
    expect(isAuthLikeError({ code: "23505", message: "dup" })).toBe(false);
    expect(toAppError({ code: "23505", message: "dup" }).code).toBe("CONFLICT");
  });
});
