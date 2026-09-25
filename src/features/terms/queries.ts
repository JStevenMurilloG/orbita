import "server-only";
import { cache } from "react";
import { getCurrentProfile } from "@/features/profile/queries";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listTerms } from "./service";
import type { Term } from "./types";

/** Trimestres del usuario de la petición actual (deduplicado por petición). */
export const getCurrentTerms = cache(async (): Promise<Term[]> => {
  const user = await getUser();
  if (!user) return [];
  return listTerms(await createClient());
});

/** Trimestre activo del perfil (`profiles.active_term_id`), o `null` si no hay. */
export const getActiveTerm = cache(async (): Promise<Term | null> => {
  const [profile, terms] = await Promise.all([getCurrentProfile(), getCurrentTerms()]);
  if (!profile?.active_term_id) return null;
  return terms.find((term) => term.id === profile.active_term_id) ?? null;
});
