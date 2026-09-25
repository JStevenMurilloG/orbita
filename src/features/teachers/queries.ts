import "server-only";
import { cache } from "react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listCourseTeachers, listPrimaryTeacherNames, listTeachers } from "./service";
import type { CourseTeacher, Teacher } from "./types";

/** Todos los docentes del usuario (para el buscador), deduplicado por petición. */
export const getCurrentTeachers = cache(async (): Promise<Teacher[]> => {
  const user = await getUser();
  if (!user) return [];
  return listTeachers(await createClient());
});

/** Docentes de una clase propia (el principal primero). */
export const getCourseTeachers = cache(async (courseId: string): Promise<CourseTeacher[]> => {
  const user = await getUser();
  if (!user) return [];
  return listCourseTeachers(await createClient(), courseId);
});

/** Nombre del docente principal por id de clase. */
export async function getPrimaryTeacherNames(courseIds: string[]): Promise<Record<string, string>> {
  const user = await getUser();
  if (!user) return {};
  return listPrimaryTeacherNames(await createClient(), courseIds);
}
