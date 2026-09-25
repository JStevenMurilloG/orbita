import type { Tables } from "@/types/database";

export type Teacher = Tables<"teachers">;

/** Docente asignado a una clase, con su papel en ella. */
export type CourseTeacher = {
  teacher: Teacher;
  role: string | null;
  is_primary: boolean;
};

/** Lo que necesita el buscador para reutilizar un docente existente. */
export type TeacherOption = Pick<Teacher, "id" | "full_name" | "email">;
