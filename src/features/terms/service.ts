import "server-only";
import { AppError } from "@/lib/errors";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { CreateTermInput, UpdateTermInput } from "./schemas";
import type { Term, TermSummary, TermTransition } from "./types";
import { confirmNameMatches, nextTermStatus } from "./utils";

const TERM_COLUMNS =
  "id, user_id, name, year, start_date, end_date, timezone, status, description, finished_at, archived_at, created_at, updated_at";

const TRANSITION_CONFLICTS: Record<TermTransition, string> = {
  finish: "Solo se puede finalizar un trimestre en curso.",
  reopen: "Solo se puede reabrir un trimestre finalizado.",
  archive: "Este trimestre ya está archivado.",
  unarchive: "Este trimestre no está archivado.",
};

/** Trimestres del usuario (RLS), del más reciente al más antiguo. */
export async function listTerms(supabase: ServerSupabaseClient): Promise<Term[]> {
  const { data, error } = await supabase
    .from("terms")
    .select(TERM_COLUMNS)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** ¿El usuario tiene al menos un trimestre? (decide si mostrar el onboarding). */
export async function hasAnyTerm(supabase: ServerSupabaseClient): Promise<boolean> {
  const { count, error } = await supabase
    .from("terms")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Un trimestre propio; ajeno o inexistente → NOT_FOUND (no revela existencia). */
export async function getTerm(supabase: ServerSupabaseClient, id: string): Promise<Term> {
  const { data, error } = await supabase
    .from("terms")
    .select(TERM_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
  return data;
}

/**
 * Otros trimestres cuyas fechas se cruzan con las indicadas. El solapamiento se permite
 * (cursos intersemestrales, doble programa) pero se avisa (plan §12).
 */
export async function findOverlappingTerms(
  supabase: ServerSupabaseClient,
  range: { start_date: string; end_date: string },
  excludeId?: string,
): Promise<TermSummary[]> {
  let query = supabase
    .from("terms")
    .select("id, name, year, status, start_date, end_date")
    .lte("start_date", range.end_date)
    .gte("end_date", range.start_date);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(({ id, name, year, status }) => ({ id, name, year, status }));
}

export async function createTerm(
  supabase: ServerSupabaseClient,
  userId: string,
  input: CreateTermInput,
): Promise<{ term: Term; overlaps: TermSummary[] }> {
  const { make_active: makeActive, ...fields } = input;
  const overlaps = await findOverlappingTerms(supabase, fields);

  // user_id lo pone la BD (default auth.uid()); el trigger terms_after_insert lo activa
  // si el usuario aún no tiene trimestre activo.
  const { data, error } = await supabase.from("terms").insert(fields).select(TERM_COLUMNS).single();
  if (error) throw error;

  if (makeActive) await setActiveTerm(supabase, userId, data.id);
  return { term: data, overlaps };
}

export async function updateTerm(
  supabase: ServerSupabaseClient,
  input: UpdateTermInput,
): Promise<{ term: Term; overlaps: TermSummary[] }> {
  const { id, ...fields } = input;
  const current = await getTerm(supabase, id);
  if (current.status === "archived") throw new AppError("TERM_ARCHIVED");

  const { data, error } = await supabase
    .from("terms")
    .update(fields)
    .eq("id", id)
    .select(TERM_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
  return { term: data, overlaps: await findOverlappingTerms(supabase, fields, id) };
}

/** Finalizar, reabrir, archivar o desarchivar. La BD vuelve a validar la transición. */
export async function transitionTerm(
  supabase: ServerSupabaseClient,
  id: string,
  transition: TermTransition,
): Promise<Term> {
  const current = await getTerm(supabase, id);
  const status = nextTermStatus(current.status, transition);
  if (!status) {
    if (current.status === "archived") throw new AppError("TERM_ARCHIVED");
    throw new AppError("CONFLICT", { message: TRANSITION_CONFLICTS[transition] });
  }

  const { data, error } = await supabase
    .from("terms")
    .update({ status })
    .eq("id", id)
    .select(TERM_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
  return data;
}

/**
 * Eliminación física (acción excepcional): exige escribir el nombre del trimestre.
 * Borra en cascada todo lo que cuelga de él.
 */
export async function deleteTerm(
  supabase: ServerSupabaseClient,
  input: { id: string; confirm_name: string },
): Promise<void> {
  const term = await getTerm(supabase, input.id);
  if (!confirmNameMatches(term.name, input.confirm_name)) {
    throw new AppError("VALIDATION", {
      message: "El nombre no coincide.",
      fields: { confirm_name: ["El nombre no coincide con el del trimestre."] },
    });
  }

  const { data, error } = await supabase
    .from("terms")
    .delete()
    .eq("id", input.id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
}

/**
 * Cambia el trimestre activo del perfil. Se permite cualquiera propio, incluso archivado
 * (se consulta en modo lectura). La FK compuesta rechaza trimestres ajenos (→ NOT_FOUND).
 */
export async function setActiveTerm(
  supabase: ServerSupabaseClient,
  userId: string,
  termId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ active_term_id: termId })
    .eq("id", userId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
}
