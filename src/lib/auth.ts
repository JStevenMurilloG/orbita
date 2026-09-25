import "server-only";
import { cache } from "react";
import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string | null;
  /** Método con el que se abrió la sesión (claim `amr` más reciente), p. ej. `password` u `otp`. */
  authMethod: { method: string; at: Date } | null;
};

type AmrClaim = Array<{ method?: string; timestamp?: number } | string> | undefined;

function latestAuthMethod(amr: AmrClaim): AuthUser["authMethod"] {
  let latest: AuthUser["authMethod"] = null;
  for (const entry of amr ?? []) {
    if (typeof entry === "string" || !entry.method || !entry.timestamp) continue;
    const at = new Date(entry.timestamp * 1000);
    if (!latest || at > latest.at) latest = { method: entry.method, at };
  }
  return latest;
}

/**
 * Usuario autenticado de la petición actual, o `null`.
 * `getClaims()` valida la firma del JWT (no se fía de la cookie sin verificar).
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return {
    id: data.claims.sub,
    email: (data.claims.email as string | undefined) ?? null,
    authMethod: latestAuthMethod(data.claims.amr as AmrClaim),
  };
});

/**
 * Exige sesión. Primera línea de toda Server Action y Route Handler (plan §10.3).
 * Nunca se acepta `user_id` desde el cliente.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getUser();
  if (!user) throw new AppError("UNAUTHENTICATED");
  return user;
}
