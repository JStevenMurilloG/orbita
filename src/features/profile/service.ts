import "server-only";
import { AppError } from "@/lib/errors";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { UpdateProfileInput } from "./schemas";
import type { Profile } from "./types";

const PROFILE_COLUMNS =
  "id, full_name, timezone, week_starts_on, theme, active_term_id, onboarded_at, created_at, updated_at";

/** Perfil del usuario autenticado (RLS garantiza que solo puede leer el suyo). */
export async function getProfile(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(
  supabase: ServerSupabaseClient,
  userId: string,
  input: Partial<UpdateProfileInput>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  // 0 filas: el perfil no existe o no es del usuario (RLS) → no revelar nada.
  if (!data) throw new AppError("NOT_FOUND");
  return data as Profile;
}
