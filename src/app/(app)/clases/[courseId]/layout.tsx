import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { ReadOnlyBanner } from "@/components/feedback/read-only-banner";
import { Button } from "@/components/ui/button";
import { CourseIcon } from "@/features/courses/components/course-icon";
import { CourseTabs } from "@/features/courses/components/course-tabs";
import { getCourseWithTerm } from "@/features/courses/queries";
import { TermTransitionButton } from "@/features/terms/components/term-transition-button";
import { termLabel } from "@/features/terms/labels";
import { getActiveTerm } from "@/features/terms/queries";

export async function generateMetadata({
  params,
}: LayoutProps<"/clases/[courseId]">): Promise<Metadata> {
  const found = await getCourseWithTerm((await params).courseId);
  return { title: found ? found.course.name : "Clase" };
}

/** Espacio virtual de una clase (plan §13): cabecera, pestañas y aviso de solo lectura. */
export default async function CourseLayout({
  children,
  params,
}: LayoutProps<"/clases/[courseId]">) {
  const [found, activeTerm] = await Promise.all([
    getCourseWithTerm((await params).courseId),
    getActiveTerm(),
  ]);
  if (!found) notFound();
  const { course, term } = found;
  const archived = term.status === "archived";

  return (
    <>
      {/* Si es el trimestre activo, el layout de la app ya muestra el aviso. */}
      {archived && activeTerm?.id !== term.id ? (
        <ReadOnlyBanner
          termName={term.name}
          action={<TermTransitionButton termId={term.id} transition="unarchive" />}
        />
      ) : null}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CourseIcon icon={course.icon} name={course.name} color={course.color} size="lg" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              {course.code ? (
                <>
                  <span className="font-mono">{course.code}</span>
                  <span aria-hidden>·</span>
                </>
              ) : null}
              <Link
                href={`/trimestres/${term.id}/clases`}
                className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {termLabel(term)}
              </Link>
            </p>
          </div>
        </div>
        {archived ? null : (
          <Button variant="outline" asChild>
            <Link href={`/clases/${course.id}/editar`}>
              <PencilIcon aria-hidden /> Editar clase
            </Link>
          </Button>
        )}
      </div>

      <CourseTabs courseId={course.id} />
      {children}
    </>
  );
}
