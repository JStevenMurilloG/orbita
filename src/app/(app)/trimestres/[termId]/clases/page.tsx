import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/empty-state";
import { ReadOnlyBanner } from "@/components/feedback/read-only-banner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CourseGrid } from "@/features/courses/components/course-grid";
import { getTermCourses } from "@/features/courses/queries";
import { getPrimaryTeacherNames } from "@/features/teachers/queries";
import { TermTransitionButton } from "@/features/terms/components/term-transition-button";
import { termLabel } from "@/features/terms/labels";
import { findCurrentTerm, getActiveTerm } from "@/features/terms/queries";

export async function generateMetadata({
  params,
}: PageProps<"/trimestres/[termId]/clases">): Promise<Metadata> {
  const term = await findCurrentTerm((await params).termId);
  return { title: term ? `Clases · ${termLabel(term)}` : "Clases" };
}

/** Clases de un trimestre (URL explícita: permite consultar trimestres pasados, plan §22). */
export default async function TermCoursesPage({
  params,
}: PageProps<"/trimestres/[termId]/clases">) {
  const { termId } = await params;
  const [term, activeTerm] = await Promise.all([findCurrentTerm(termId), getActiveTerm()]);
  if (!term) notFound();

  const courses = await getTermCourses(term.id);
  const teacherNames = await getPrimaryTeacherNames(courses.map((course) => course.id));
  const archived = term.status === "archived";
  const isActiveTerm = activeTerm?.id === term.id;

  const newCourseButton = archived ? null : (
    <Button asChild>
      <Link href={`/trimestres/${term.id}/clases/nueva`}>
        <PlusIcon aria-hidden /> Nueva clase
      </Link>
    </Button>
  );

  return (
    <>
      {/* Si es el activo, el layout ya muestra el aviso de solo lectura. */}
      {archived && !isActiveTerm ? (
        <ReadOnlyBanner
          termName={term.name}
          action={<TermTransitionButton termId={term.id} transition="unarchive" />}
        />
      ) : null}

      <PageHeader
        title="Clases"
        description={
          <Link
            href={`/trimestres/${term.id}`}
            className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {termLabel(term)}
          </Link>
        }
        actions={courses.length > 0 ? newCourseButton : null}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title={
            archived ? "Este trimestre no tiene clases" : "Aún no tienes clases en este trimestre"
          }
          description={
            archived
              ? undefined
              : "Añade las materias que cursas para organizar su docente, horario y tareas."
          }
          action={newCourseButton}
        />
      ) : (
        <CourseGrid
          termId={term.id}
          courses={courses}
          teacherNames={teacherNames}
          readOnly={archived}
        />
      )}
    </>
  );
}
