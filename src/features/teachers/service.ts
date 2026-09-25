import "server-only";
import { getWritableCourse } from "@/features/courses/service";
import { AppError } from "@/lib/errors";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import type { CreateTeacherInput, UpdateTeacherInput } from "./schemas";
import type { CourseTeacher, Teacher } from "./types";

const TEACHER_COLUMNS =
  "id, user_id, full_name, email, phone, office, office_hours, notes, created_at, updated_at";

/** Docentes del usuario (RLS) por nombre, para reutilizarlos entre clases y trimestres. */
export async function listTeachers(supabase: ServerSupabaseClient): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from("teachers")
    .select(TEACHER_COLUMNS)
    .order("full_name")
    .limit(1000);
  if (error) throw error;
  return data;
}

/** Docentes de una clase; el principal primero. */
export async function listCourseTeachers(
  supabase: ServerSupabaseClient,
  courseId: string,
): Promise<CourseTeacher[]> {
  const { data, error } = await supabase
    .from("course_teachers")
    .select(`role, is_primary, teacher:teachers (${TEACHER_COLUMNS})`)
    .eq("course_id", courseId)
    .order("is_primary", { ascending: false })
    .order("created_at");
  if (error) throw error;
  return data.map(({ role, is_primary, teacher }) => ({ role, is_primary, teacher }));
}

/** Nombre del docente principal de cada clase indicada (para las tarjetas de la lista). */
export async function listPrimaryTeacherNames(
  supabase: ServerSupabaseClient,
  courseIds: string[],
): Promise<Record<string, string>> {
  if (courseIds.length === 0) return {};
  const { data, error } = await supabase
    .from("course_teachers")
    .select("course_id, teacher:teachers (full_name)")
    .eq("is_primary", true)
    .in("course_id", courseIds);
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.course_id, row.teacher.full_name]));
}

/**
 * Crea un docente y, si se indica una clase, lo asigna como su docente principal.
 * La clase se comprueba antes (propia y en un trimestre editable) para no dejar un docente
 * creado a medias por un TERM_ARCHIVED.
 */
export async function createTeacher(
  supabase: ServerSupabaseClient,
  input: CreateTeacherInput,
): Promise<Teacher> {
  const { course_id: courseId, ...fields } = input;
  if (courseId) await getWritableCourse(supabase, courseId);

  const { data, error } = await supabase
    .from("teachers")
    .insert(fields)
    .select(TEACHER_COLUMNS)
    .single();
  if (error) throw error;

  if (courseId) await setPrimaryTeacher(supabase, courseId, data.id);
  return data;
}

/** Los datos de contacto son del docente, no de un trimestre: se editan aunque tenga clases archivadas. */
export async function updateTeacher(
  supabase: ServerSupabaseClient,
  input: UpdateTeacherInput,
): Promise<Teacher> {
  const { id, ...fields } = input;
  const { data, error } = await supabase
    .from("teachers")
    .update(fields)
    .eq("id", id)
    .select(TEACHER_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
  return data;
}

/**
 * Fija el docente principal de la clase (sustituye al anterior). La FK compuesta rechaza
 * clases o docentes ajenos (→ NOT_FOUND) y la BD bloquea trimestres archivados.
 */
export async function setPrimaryTeacher(
  supabase: ServerSupabaseClient,
  courseId: string,
  teacherId: string,
): Promise<void> {
  await getWritableCourse(supabase, courseId);
  const { error } = await supabase.rpc("set_course_primary_teacher", {
    p_course_id: courseId,
    p_teacher_id: teacherId,
  });
  if (error) throw error;
}

/** Quita un docente de la clase (el docente se conserva para otras clases). */
export async function unassignTeacher(
  supabase: ServerSupabaseClient,
  courseId: string,
  teacherId: string,
): Promise<void> {
  await getWritableCourse(supabase, courseId);
  const { data, error } = await supabase
    .from("course_teachers")
    .delete()
    .eq("course_id", courseId)
    .eq("teacher_id", teacherId)
    .select("course_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError("NOT_FOUND");
}
