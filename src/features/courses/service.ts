import "server-only";
import { getTerm } from "@/features/terms/service";
import type { Term } from "@/features/terms/types";
import { isCourseColor } from "@/lib/design/course-colors";
import { AppError } from "@/lib/errors";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import type { CreateCourseInput, UpdateCourseInput } from "./schemas";
import type { Course } from "./types";

const COURSE_COLUMNS =
  "id, user_id, term_id, name, code, description, color, icon, room, credits, position, deleted_at, created_at, updated_at";

function toCourse(row: Tables<"courses">): Course {
  return { ...row, color: isCourseColor(row.color) ? row.color : "slate" };
}

/** El trimestre debe ser propio y no estar archivado (la BD lo vuelve a comprobar). */
async function getWritableTerm(supabase: ServerSupabaseClient, termId: string): Promise<Term> {
  const term = await getTerm(supabase, termId);
  if (term.status === "archived") throw new AppError("TERM_ARCHIVED");
  return term;
}

/** Clases visibles (fuera de la papelera) de un trimestre, en su orden manual. */
export async function listCourses(
  supabase: ServerSupabaseClient,
  termId: string,
): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("term_id", termId)
    .is("deleted_at", null)
    .order("position")
    .order("created_at");
  if (error) throw error;
  return data.map(toCourse);
}

/** Una clase propia y fuera de la papelera; ajena, inexistente o borrada → NOT_FOUND. */
export async function getCourse(supabase: ServerSupabaseClient, id: string): Promise<Course> {
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
  return toCourse(data);
}

/** Clase propia cuyo trimestre admite cambios (para escribir en sus hijos: docentes…). */
export async function getWritableCourse(
  supabase: ServerSupabaseClient,
  id: string,
): Promise<Course> {
  const course = await getCourse(supabase, id);
  await getWritableTerm(supabase, course.term_id);
  return course;
}

export async function createCourse(
  supabase: ServerSupabaseClient,
  input: CreateCourseInput,
): Promise<Course> {
  await getWritableTerm(supabase, input.term_id);
  // user_id lo pone la BD (default auth.uid()) y la FK compuesta exige que el trimestre sea
  // del mismo usuario; position la asigna el trigger (al final del trimestre).
  const { data, error } = await supabase
    .from("courses")
    .insert(input)
    .select(COURSE_COLUMNS)
    .single();
  if (error) throw error;
  return toCourse(data);
}

export async function updateCourse(
  supabase: ServerSupabaseClient,
  input: UpdateCourseInput,
): Promise<Course> {
  const { id, ...fields } = input;
  await getWritableCourse(supabase, id);

  const { data, error } = await supabase
    .from("courses")
    .update(fields)
    .eq("id", id)
    .is("deleted_at", null)
    .select(COURSE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
  return toCourse(data);
}

/** Borrado suave: la clase va a la papelera (restaurable; purga a los 30 días, plan §26). */
export async function softDeleteCourse(
  supabase: ServerSupabaseClient,
  id: string,
): Promise<Course> {
  await getWritableCourse(supabase, id);

  // La BD sustituye el valor por now().
  const { data, error } = await supabase
    .from("courses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select(COURSE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
  return toCourse(data);
}

/** Deshace un borrado suave (el "Deshacer" del aviso; la papelera completa llega en MVP2). */
export async function restoreCourse(supabase: ServerSupabaseClient, id: string): Promise<Course> {
  const { data: row, error: readError } = await supabase
    .from("courses")
    .select("term_id")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle();
  if (readError) throw readError;
  if (!row) throw new AppError("NOT_FOUND");
  await getWritableTerm(supabase, row.term_id);

  const { data, error } = await supabase
    .from("courses")
    .update({ deleted_at: null })
    .eq("id", id)
    .select(COURSE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
  return toCourse(data);
}

/**
 * Guarda el orden manual de las clases de un trimestre. Debe incluir exactamente las clases
 * visibles del trimestre (si no, la lista del cliente está desactualizada → CONFLICT).
 */
export async function reorderCourses(
  supabase: ServerSupabaseClient,
  input: { term_id: string; course_ids: string[] },
): Promise<void> {
  await getWritableTerm(supabase, input.term_id);
  const current = await listCourses(supabase, input.term_id);
  const expected = new Set(current.map((course) => course.id));
  const received = new Set(input.course_ids);
  if (
    received.size !== input.course_ids.length ||
    received.size !== expected.size ||
    [...received].some((id) => !expected.has(id))
  ) {
    throw new AppError("CONFLICT", {
      message: "La lista de clases cambió. Recarga la página e inténtalo de nuevo.",
    });
  }

  const { error } = await supabase.rpc("reorder_courses", {
    p_term_id: input.term_id,
    p_course_ids: input.course_ids,
  });
  if (error) throw error;
}
