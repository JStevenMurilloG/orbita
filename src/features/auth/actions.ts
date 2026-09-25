"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env.public";
import { AppError, toResult, type Result } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  changePasswordSchema,
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  signOutSchema,
} from "./schemas";
import * as authService from "./service";
import { isRecentEmailLinkSession, safeNextPath } from "./utils";

/**
 * Enlace de vuelta para los flujos de Supabase que usan PKCE (plantillas por defecto).
 * Las plantillas propias de supabase/templates apuntan a /auth/confirm con token_hash.
 */
function callbackUrl(next: string): string {
  const url = new URL("/auth/callback", publicEnv.NEXT_PUBLIC_SITE_URL);
  url.searchParams.set("next", next);
  return url.toString();
}

// --- Acciones públicas (sin sesión) --------------------------------------------------------

export async function loginAction(input: unknown, next?: unknown): Promise<Result<never>> {
  const result = await toResult(async () => {
    const data = loginSchema.parse(input);
    await authService.signIn(await createClient(), data);
  });
  if (!result.ok) return result;
  // redirect() lanza una excepción de control: va fuera de toResult.
  redirect(safeNextPath(next));
}

export async function registerAction(input: unknown): Promise<Result<{ email: string }>> {
  return toResult(async () => {
    const data = registerSchema.parse(input);
    await authService.signUp(await createClient(), data, callbackUrl("/hoy"));
    return { email: data.email };
  });
}

export async function resendConfirmationAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    const data = emailOnlySchema.parse(input);
    await authService.resendConfirmation(await createClient(), data, callbackUrl("/hoy"));
    return null;
  });
}

export async function forgotPasswordAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    const data = emailOnlySchema.parse(input);
    await authService.requestPasswordReset(await createClient(), data, callbackUrl("/restablecer"));
    return null;
  });
}

// --- Acciones con sesión --------------------------------------------------------------------

/**
 * Requiere la sesión de recuperación abierta por el enlace del correo (reciente).
 * Con una sesión normal hay que usar changePasswordAction, que pide la contraseña actual.
 */
export async function resetPasswordAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    const user = await requireUser();
    if (!isRecentEmailLinkSession(user)) throw new AppError("LINK_INVALID");
    const data = resetPasswordSchema.parse(input);
    await authService.resetPassword(await createClient(), data);
    return null;
  });
}

export async function changePasswordAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    const user = await requireUser();
    const data = changePasswordSchema.parse(input);
    if (!user.email) throw new Error("La cuenta no tiene correo asociado.");
    await authService.changePassword(await createClient(), user.email, data);
    return null;
  });
}

export async function changeEmailAction(input: unknown): Promise<Result<{ email: string }>> {
  return toResult(async () => {
    const user = await requireUser();
    const data = emailOnlySchema.parse(input);
    await authService.changeEmail(
      await createClient(),
      user.email,
      data,
      callbackUrl("/configuracion/cuenta"),
    );
    return { email: data.email };
  });
}

export async function signOutAction(input?: unknown): Promise<Result<never>> {
  const result = await toResult(async () => {
    await requireUser();
    const { scope } = signOutSchema.parse(input ?? {});
    await authService.signOut(await createClient(), scope);
  });
  // Sin sesión el objetivo ya está cumplido: se lleva igualmente al login.
  if (!result.ok && result.error.code !== "UNAUTHENTICATED") return result;
  redirect("/login");
}
