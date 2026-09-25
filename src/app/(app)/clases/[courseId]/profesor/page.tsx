import { notFound } from "next/navigation";
import { getCourseWithTerm } from "@/features/courses/queries";
import { CourseTeacherPanel } from "@/features/teachers/components/course-teacher-panel";
import { getCourseTeachers, getCurrentTeachers } from "@/features/teachers/queries";

/** Pestaña Profesor: docente principal de la clase (plan §13). */
export default async function CourseTeacherPage({
  params,
}: PageProps<"/clases/[courseId]/profesor">) {
  const found = await getCourseWithTerm((await params).courseId);
  if (!found) notFound();
  const { course, term } = found;
  const [courseTeachers, teachers] = await Promise.all([
    getCourseTeachers(course.id),
    getCurrentTeachers(),
  ]);
  const primary = courseTeachers.find((entry) => entry.is_primary) ?? courseTeachers[0] ?? null;

  return (
    <section aria-labelledby="profesor-titulo" className="flex flex-col gap-4">
      <h2 id="profesor-titulo" className="sr-only">
        Profesor
      </h2>
      <CourseTeacherPanel
        // Al cambiar el docente, el panel vuelve a su estado inicial.
        key={primary?.teacher.id ?? "none"}
        courseId={course.id}
        primary={primary?.teacher ?? null}
        teachers={teachers.map(({ id, full_name, email }) => ({ id, full_name, email }))}
        readOnly={term.status === "archived"}
      />
    </section>
  );
}
