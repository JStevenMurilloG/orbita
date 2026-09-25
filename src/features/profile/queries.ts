import "server-only";
import { cache } from "react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "./service";

/** Perfil del usuario de la petición actual (deduplicado por petición), o `null` sin sesión. */
export const getCurrentProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  return getProfile(await createClient(), user.id);
});
