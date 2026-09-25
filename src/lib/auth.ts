import "server-only";
import { cache } from "react";
import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = { id: string; email: string | null };

/**
 * Usuario autenticado de la petición actual, o `null`.
 * `getClaims()` valida la firma del JWT (no se fía de la cookie sin verificar).
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
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
